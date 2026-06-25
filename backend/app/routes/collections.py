from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.models.collection import Collection, CollectionMovie
from app.models.collection_follow import CollectionFollow
from app.models.user import User
from app.schemas.collection import (
    CollectionCreate,
    CollectionMovieCreate,
    CollectionMovieResponse,
    CollectionResponse,
    CollectionUpdate,
)
from app.services.auth_service import get_current_user
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/collections", tags=["collections"])


def _get_collection(collection_id: int, db: Session, user: User) -> Collection:
    collection = (
        db.query(Collection)
        .options(joinedload(Collection.movies))
        .filter(Collection.id == collection_id, Collection.user_id == user.id)
        .first()
    )
    if not collection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
    return collection


def _followers_count(db: Session, collection_id: int) -> int:
    return db.query(func.count(CollectionFollow.id)).filter(CollectionFollow.collection_id == collection_id).scalar() or 0


def _followed_by_user(db: Session, collection_id: int, user: User | None) -> bool:
    if not user:
        return False
    return (
        db.query(CollectionFollow.id)
        .filter(CollectionFollow.collection_id == collection_id, CollectionFollow.user_id == user.id)
        .first()
        is not None
    )


def _build_collection_response(
    collection: Collection,
    db: Session,
    current_user: User | None = None,
) -> CollectionResponse:
    movies = list(collection.movies or [])
    return CollectionResponse(
        id=collection.id,
        name=collection.name,
        description=collection.description,
        created_at=collection.created_at,
        updated_at=collection.updated_at,
        movie_count=len(movies),
        followers_count=_followers_count(db, collection.id),
        followed_by_me=_followed_by_user(db, collection.id, current_user),
        owner_email=collection.user.email if collection.user else None,
        movies=movies,
    )


@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
def create_collection(
    payload: CollectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    duplicate = (
        db.query(Collection)
        .filter(Collection.user_id == current_user.id, Collection.name == payload.name)
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Collection name already exists")

    collection = Collection(user_id=current_user.id, name=payload.name, description=payload.description)
    db.add(collection)
    db.commit()
    db.refresh(collection)
    return _build_collection_response(collection, db, current_user)


@router.get("", response_model=list[CollectionResponse])
def list_collections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    collections = (
        db.query(Collection)
        .options(joinedload(Collection.movies))
        .filter(Collection.user_id == current_user.id)
        .order_by(Collection.updated_at.desc(), Collection.created_at.desc())
        .all()
    )
    return [_build_collection_response(collection, db, current_user) for collection in collections]


@router.get("/discover", response_model=list[CollectionResponse])
def discover_collections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    collections = (
        db.query(Collection)
        .options(joinedload(Collection.movies), joinedload(Collection.user))
        .filter(Collection.user_id != current_user.id)
        .order_by(Collection.updated_at.desc(), Collection.created_at.desc())
        .limit(25)
        .all()
    )
    return [_build_collection_response(collection, db, current_user) for collection in collections]


@router.patch("/{collection_id}", response_model=CollectionResponse)
def update_collection(
    collection_id: int,
    payload: CollectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    collection = _get_collection(collection_id, db, current_user)

    if payload.name and payload.name != collection.name:
        duplicate = (
            db.query(Collection)
            .filter(Collection.user_id == current_user.id, Collection.name == payload.name)
            .first()
        )
        if duplicate:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Collection name already exists")
        collection.name = payload.name

    if "description" in payload.model_fields_set:
        collection.description = payload.description

    db.commit()
    db.refresh(collection)
    return _build_collection_response(collection, db, current_user)


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    collection = _get_collection(collection_id, db, current_user)
    db.delete(collection)
    db.commit()
    return None


@router.post("/{collection_id}/movies", response_model=CollectionMovieResponse, status_code=status.HTTP_201_CREATED)
def add_movie_to_collection(
    collection_id: int,
    payload: CollectionMovieCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    collection = _get_collection(collection_id, db, current_user)
    duplicate = (
        db.query(CollectionMovie)
        .filter(CollectionMovie.collection_id == collection.id, CollectionMovie.imdb_id == payload.imdb_id)
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Movie already in collection")

    movie = CollectionMovie(
        collection_id=collection.id,
        imdb_id=payload.imdb_id,
        title=payload.title,
        year=payload.year,
        poster_url=payload.poster_url,
        type=payload.type,
    )
    db.add(movie)
    db.commit()
    db.refresh(movie)
    return movie


@router.post("/{collection_id}/follow", response_model=CollectionResponse)
def follow_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    collection = (
        db.query(Collection)
        .options(joinedload(Collection.movies), joinedload(Collection.user))
        .filter(Collection.id == collection_id)
        .first()
    )
    if not collection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
    if collection.user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot follow your own collection")

    existing = (
        db.query(CollectionFollow)
        .filter(CollectionFollow.collection_id == collection.id, CollectionFollow.user_id == current_user.id)
        .first()
    )
    if not existing:
        db.add(CollectionFollow(collection_id=collection.id, user_id=current_user.id))
        NotificationService.create_collection_follow(db=db, collection=collection, actor=current_user)
        db.commit()

    db.refresh(collection)
    return _build_collection_response(collection, db, current_user)


@router.delete("/{collection_id}/follow", response_model=CollectionResponse)
def unfollow_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    collection = (
        db.query(Collection)
        .options(joinedload(Collection.movies), joinedload(Collection.user))
        .filter(Collection.id == collection_id)
        .first()
    )
    if not collection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")

    existing = (
        db.query(CollectionFollow)
        .filter(CollectionFollow.collection_id == collection.id, CollectionFollow.user_id == current_user.id)
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()

    db.refresh(collection)
    return _build_collection_response(collection, db, current_user)


@router.delete("/{collection_id}/movies/{imdb_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_movie_from_collection(
    collection_id: int,
    imdb_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    collection = _get_collection(collection_id, db, current_user)
    movie = (
        db.query(CollectionMovie)
        .filter(CollectionMovie.collection_id == collection.id, CollectionMovie.imdb_id == imdb_id)
        .first()
    )
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection movie not found")

    db.delete(movie)
    db.commit()
    return None
