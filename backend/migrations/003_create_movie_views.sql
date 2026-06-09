-- Track movie detail views for recommendation signals.

CREATE TABLE IF NOT EXISTS movie_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    imdb_id VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    year VARCHAR(10) NOT NULL,
    poster_url VARCHAR(500) NOT NULL,
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_imdb_movie_view UNIQUE (user_id, imdb_id),
    CONSTRAINT fk_movie_views_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_movie_views_user_id ON movie_views (user_id);
CREATE INDEX IF NOT EXISTS ix_movie_views_imdb_id ON movie_views (imdb_id);
CREATE INDEX IF NOT EXISTS ix_movie_views_viewed_at ON movie_views (viewed_at DESC);
