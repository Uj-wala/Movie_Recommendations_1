-- Supporting indexes for history and dashboard queries.

CREATE INDEX IF NOT EXISTS ix_favorites_user_id ON favorites (user_id);
CREATE INDEX IF NOT EXISTS ix_favorites_imdb_id ON favorites (imdb_id);

CREATE INDEX IF NOT EXISTS ix_search_history_user_id ON search_history (user_id);
CREATE INDEX IF NOT EXISTS ix_search_history_searched_at ON search_history (searched_at DESC);
CREATE INDEX IF NOT EXISTS ix_search_history_keyword ON search_history (keyword);

CREATE INDEX IF NOT EXISTS ix_reviews_user_id ON reviews (user_id);
CREATE INDEX IF NOT EXISTS ix_reviews_imdb_id ON reviews (imdb_id);
