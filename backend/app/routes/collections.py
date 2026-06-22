from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.models.collection import Collection, CollectionMovie
from app.models.user import User
from app.schemas.collection import (
    CollectionCreate,
    CollectionMovieCreate,
    CollectionMovieResponse,
    CollectionResponse,
    CollectionUpdate,
)
from app.services.auth_service import get_current_user

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


def _build_collection_response(collection: Collection) -> CollectionResponse:
    movies = list(collection.movies or [])
    return CollectionResponse(
        id=collection.id,
        name=collection.name,
        description=collection.description,
        created_at=collection.created_at,
        updated_at=collection.updated_at,
        movie_count=len(movies),
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
    return _build_collection_response(collection)


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
    return [_build_collection_response(collection) for collection in collections]


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
    return _build_collection_response(collection)


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
