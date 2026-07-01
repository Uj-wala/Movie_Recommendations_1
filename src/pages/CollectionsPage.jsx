import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiEdit3, FiFilm, FiFolderPlus, FiSave, FiTrash2, FiUserPlus, FiUsers, FiX } from 'react-icons/fi';
import { EmptyState } from '../components/EmptyState';
import { MovieCard } from '../components/MovieCard';

const normalizeCollectionMovie = (movie) => ({
  ...movie,
  imdbID: movie.imdbID || movie.imdb_id,
  Title: movie.Title || movie.title,
  Year: movie.Year || movie.year,
  Poster: movie.Poster || movie.poster_url,
  Type: movie.Type || movie.type || 'movie',
});

export const CollectionsPage = ({
  collections = [],
  isLoading = false,
  onBack,
  onCreateCollection,
  onUpdateCollection,
  onDeleteCollection,
  onRemoveMovie,
  onFavoriteToggle,
  isFavorite,
  onMovieClick,
  discoverCollections = [],
  onFollowCollection,
  onCompareToggle,
  isCompareSelected = () => false,
  isCompareLimitReached = false,
}) => {
  const [form, setForm] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState({ name: '', description: '' });
  const [activeCollectionId, setActiveCollectionId] = useState(null);

  useEffect(() => {
    if (!collections.length) {
      setActiveCollectionId(null);
      return;
    }
    if (!activeCollectionId || !collections.some((collection) => collection.id === activeCollectionId)) {
      setActiveCollectionId(collections[0].id);
    }
  }, [activeCollectionId, collections]);

  const activeCollection = collections.find((collection) => collection.id === activeCollectionId) || null;

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    const created = await onCreateCollection(form.name, form.description);
    if (created) {
      setForm({ name: '', description: '' });
      setActiveCollectionId(created.id);
    }
  };

  const startEditing = (collection) => {
    setEditingId(collection.id);
    setEditingForm({
      name: collection.name,
      description: collection.description || '',
    });
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editingId || !editingForm.name.trim()) return;
    await onUpdateCollection(editingId, editingForm);
    setEditingId(null);
  };

  return (
    <main className="relative mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">
            Personal movie shelves
          </p>
          <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">Collections</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Create themed lists, edit their details, and manage the movies saved inside each collection.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/20"
        >
          <FiArrowLeft />
          Back to movies
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        <aside className="space-y-5">
          <form onSubmit={handleCreate} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
              <FiFolderPlus />
              New Collection
            </div>
            <div className="space-y-3">
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
                placeholder="Collection name"
              />
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
                placeholder="Description"
              />
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
              >
                <FiSave />
                Create Collection
              </button>
            </div>
          </form>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
            {isLoading ? (
              <p className="p-4 text-sm text-slate-300">Loading collections...</p>
            ) : collections.length === 0 ? (
              <p className="p-4 text-sm text-slate-300">No collections yet.</p>
            ) : (
              <div className="space-y-2">
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    type="button"
                    onClick={() => setActiveCollectionId(collection.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      activeCollectionId === collection.id
                        ? 'border-cyan-300/50 bg-cyan-300/15 text-cyan-100'
                        : 'border-white/10 bg-slate-950/40 text-slate-200 hover:border-cyan-300/30'
                    }`}
                  >
                    <span className="block text-sm font-black">{collection.name}</span>
                    <span className="mt-1 block text-xs text-slate-400">
                      {collection.movie_count} movie{collection.movie_count === 1 ? '' : 's'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-fuchsia-200">
              <FiUsers />
              Discover
            </div>
            {discoverCollections.length === 0 ? (
              <p className="text-sm text-slate-300">No public collections from other users yet.</p>
            ) : (
              <div className="space-y-3">
                {discoverCollections.map((collection) => (
                  <div key={collection.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white">{collection.name}</p>
                        <p className="mt-1 truncate text-xs text-slate-400">
                          {collection.owner_email || 'Another user'} / {collection.movie_count} movie{collection.movie_count === 1 ? '' : 's'}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {collection.followers_count || 0} follower{collection.followers_count === 1 ? '' : 's'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onFollowCollection?.(collection.id, collection.followed_by_me)}
                        className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black transition ${
                          collection.followed_by_me
                            ? 'border border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100 hover:bg-fuchsia-300/20'
                            : 'bg-cyan-300 text-slate-950 hover:bg-cyan-200'
                        }`}
                      >
                        <FiUserPlus />
                        {collection.followed_by_me ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="min-h-[32rem] rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          {!activeCollection ? (
            <EmptyState
              icon={<FiFilm className="h-7 w-7" />}
              title="Create your first collection."
              description="Use the form on this page to start grouping movies into custom lists."
            />
          ) : (
            <div className="space-y-6">
              {editingId === activeCollection.id ? (
                <form onSubmit={handleUpdate} className="rounded-3xl border border-cyan-300/20 bg-slate-950/50 p-4">
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <input
                      value={editingForm.name}
                      onChange={(event) => setEditingForm((current) => ({ ...current, name: event.target.value }))}
                      className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-cyan-300 focus:outline-none"
                    />
                    <input
                      value={editingForm.description}
                      onChange={(event) => setEditingForm((current) => ({ ...current, description: event.target.value }))}
                      className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-cyan-300 focus:outline-none"
                      placeholder="Description"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-slate-950">
                        <FiSave />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/10 text-white"
                      >
                        <FiX />
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <h2 className="text-3xl font-black text-white">{activeCollection.name}</h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-300">
                      {activeCollection.description || 'No description added.'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(activeCollection)}
                      className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                      title="Edit collection"
                    >
                      <FiEdit3 />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCollection(activeCollection.id)}
                      className="grid h-11 w-11 place-items-center rounded-2xl border border-rose-300/30 bg-rose-300/10 text-rose-100"
                      title="Delete collection"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              )}

              {activeCollection.movies.length === 0 ? (
                <EmptyState
                  icon={<FiFilm className="h-7 w-7" />}
                  title="No movies in this collection."
                  description="Open a movie and use Add to collection to save it here."
                  actionLabel="Back to movies"
                  actionIcon={<FiArrowLeft />}
                  onAction={onBack}
                />
              ) : (
                <motion.div
                  layout
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
                >
                  {activeCollection.movies.map((movie) => {
                    const normalizedMovie = normalizeCollectionMovie(movie);
                    return (
                      <motion.div
                        key={normalizedMovie.imdbID}
                        variants={{
                          hidden: { opacity: 0, y: 24, scale: 0.96 },
                          show: { opacity: 1, y: 0, scale: 1 },
                        }}
                        className="space-y-3"
                      >
                        <MovieCard
                          movie={normalizedMovie}
                          onClick={() => onMovieClick(normalizedMovie)}
                          onFavoriteToggle={onFavoriteToggle}
                          isFavorite={isFavorite(normalizedMovie.imdbID)}
                          onCompareToggle={onCompareToggle}
                          isCompareSelected={isCompareSelected(normalizedMovie.imdbID)}
                          isCompareDisabled={isCompareLimitReached}
                          showQuickAction={false}
                          secondaryActionIcon={FiTrash2}
                          secondaryActionLabel="Remove from Collection"
                          secondaryActionAriaLabel="Remove from collection"
                          onSecondaryAction={() => onRemoveMovie(activeCollection.id, normalizedMovie.imdbID)}
                        />
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};
