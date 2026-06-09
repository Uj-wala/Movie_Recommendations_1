-- Track user preferences for recommendation engine.

CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    preference_type VARCHAR(50) NOT NULL,
    preference_value VARCHAR(255) NOT NULL,
    weight FLOAT NOT NULL DEFAULT 1.0,
    source VARCHAR(100) NOT NULL DEFAULT 'activity_analysis',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_preference UNIQUE (user_id, preference_type, preference_value),
    CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_user_preferences_user_id ON user_preferences (user_id);
CREATE INDEX IF NOT EXISTS ix_user_preferences_type ON user_preferences (preference_type);
CREATE INDEX IF NOT EXISTS ix_user_preferences_value ON user_preferences (preference_value);
CREATE INDEX IF NOT EXISTS ix_user_preferences_updated_at ON user_preferences (updated_at DESC);
