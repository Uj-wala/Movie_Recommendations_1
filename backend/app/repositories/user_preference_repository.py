from sqlalchemy.orm import Session

from app.models.user_preference import UserPreference


class UserPreferenceRepository:
    @staticmethod
    def list_by_user(db: Session, user_id: int) -> list[UserPreference]:
        return (
            db.query(UserPreference)
            .filter(UserPreference.user_id == user_id)
            .order_by(UserPreference.weight.desc(), UserPreference.updated_at.desc())
            .all()
        )

    @staticmethod
    def replace_genre_preferences(
        db: Session,
        user_id: int,
        genres: list[str],
        source: str = "activity_analysis",
    ) -> list[UserPreference]:
        db.query(UserPreference).filter(
            UserPreference.user_id == user_id,
            UserPreference.preference_type == "genre",
        ).delete(synchronize_session=False)

        preferences: list[UserPreference] = []
        total = max(len(genres), 1)

        for index, genre in enumerate(genres):
            weight = round((total - index) / total, 3)
            preference = UserPreference(
                user_id=user_id,
                preference_type="genre",
                preference_value=genre,
                weight=weight,
                source=source,
            )
            db.add(preference)
            preferences.append(preference)

        db.commit()

        for preference in preferences:
            db.refresh(preference)

        return preferences
