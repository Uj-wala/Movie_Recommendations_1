-- Notifications and user activity used for social events.
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_user_id INTEGER NOT NULL,
    actor_user_id INTEGER NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    review_id INTEGER NULL,
    imdb_id VARCHAR(20) NULL,
    is_read BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_notifications_recipient_user_id ON notifications (recipient_user_id);
CREATE INDEX IF NOT EXISTS ix_notifications_actor_user_id ON notifications (actor_user_id);
CREATE INDEX IF NOT EXISTS ix_notifications_type ON notifications (type);
CREATE INDEX IF NOT EXISTS ix_notifications_review_id ON notifications (review_id);
CREATE INDEX IF NOT EXISTS ix_notifications_imdb_id ON notifications (imdb_id);
CREATE INDEX IF NOT EXISTS ix_notifications_is_read ON notifications (is_read);
CREATE INDEX IF NOT EXISTS ix_notifications_created_at ON notifications (created_at DESC);

CREATE TABLE IF NOT EXISTS review_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_review_like_user UNIQUE (review_id, user_id)
);

CREATE INDEX IF NOT EXISTS ix_review_likes_review_id ON review_likes (review_id);
CREATE INDEX IF NOT EXISTS ix_review_likes_user_id ON review_likes (user_id);

CREATE TABLE IF NOT EXISTS collection_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_collection_follow_user UNIQUE (collection_id, user_id)
);

CREATE INDEX IF NOT EXISTS ix_collection_follows_collection_id ON collection_follows (collection_id);
CREATE INDEX IF NOT EXISTS ix_collection_follows_user_id ON collection_follows (user_id);
