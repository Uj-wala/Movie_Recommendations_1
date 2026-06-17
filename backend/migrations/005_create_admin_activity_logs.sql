-- Audit trail for admin actions.
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_user_id INTEGER NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    details TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_admin_activity_logs_actor_user_id ON admin_activity_logs (actor_user_id);
CREATE INDEX IF NOT EXISTS ix_admin_activity_logs_action ON admin_activity_logs (action);
CREATE INDEX IF NOT EXISTS ix_admin_activity_logs_entity_type ON admin_activity_logs (entity_type);
CREATE INDEX IF NOT EXISTS ix_admin_activity_logs_created_at ON admin_activity_logs (created_at DESC);
