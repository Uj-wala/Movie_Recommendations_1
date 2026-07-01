import { FiEdit3, FiSave, FiSearch, FiStar, FiTrash2 } from 'react-icons/fi';

export const AdminReviewsPanel = ({
  panelClass,
  buttonTheme,
  toolbarPillClass,
  tableShellClass,
  tableHeadClass,
  tableBodyClass,
  tableRowClass,
  editingReviewId,
  startCreate,
  form,
  handleFormChange,
  submitReview,
  savingReview,
  formError,
  reviewFilter,
  setReviewFilter,
  filteredReviews,
  formatDate,
  startEdit,
  handleDeleteReview,
  deletingReviewId,
  reviewsTotal,
  reviewsPage,
  setReviewsPage,
  reviewsLimit,
}) => (
  <>
    <div className={`min-w-0 rounded-2xl border p-4 sm:rounded-3xl sm:p-6 ${panelClass}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">Review editor</p>
          <h2 className="mt-2 text-2xl font-black">
            {editingReviewId ? 'Edit review or rating' : 'Create review or rating'}
          </h2>
        </div>
        {editingReviewId && (
          <button
            type="button"
            onClick={startCreate}
            className={`rounded-2xl border px-4 py-2 text-sm font-black transition ${buttonTheme.cancel}`}
          >
            Cancel
          </button>
        )}
      </div>

      <div className="grid items-end gap-4 xl:grid-cols-[minmax(180px,0.75fr)_minmax(360px,2fr)_minmax(120px,0.45fr)_auto]">
        <label className="block text-sm font-semibold text-slate-300">
          IMDb ID
          <input
            type="text"
            value={form.imdb_id}
            onChange={(event) => handleFormChange('imdb_id', event.target.value)}
            disabled={Boolean(editingReviewId)}
            placeholder="tt0468569"
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <label className="block text-sm font-semibold text-slate-300">
          Review
          <input
            type="text"
            value={form.review}
            onChange={(event) => handleFormChange('review', event.target.value)}
            placeholder="Write the review text..."
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
          />
        </label>

        <label className="block text-sm font-semibold text-slate-300">
          Rating
          <input
            type="number"
            min="1"
            max="5"
            step="1"
            inputMode="numeric"
            value={form.rating}
            onChange={(event) => {
              const nextValue = event.target.value;
              if (nextValue === '') {
                handleFormChange('rating', '');
                return;
              }

              const nextNumber = Number(nextValue);
              if (Number.isNaN(nextNumber)) return;
              handleFormChange('rating', String(Math.min(5, Math.max(1, nextNumber))));
            }}
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 [appearance:textfield] [-moz-appearance:textfield]"
          />
        </label>

        <button
          type="button"
          onClick={submitReview}
          disabled={savingReview}
          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiSave />
          {savingReview ? 'Saving...' : editingReviewId ? 'Update Review' : 'Create Review'}
        </button>

        {formError && (
          <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-100 xl:col-span-4">
            {formError}
          </div>
        )}
      </div>
    </div>

    <section className={`rounded-2xl border p-4 sm:rounded-3xl sm:p-6 ${panelClass}`}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">All reviews</p>
          <h2 className="mt-2 text-2xl font-black">Users reviews and ratings</h2>
        </div>
        <label className="block w-full max-w-md">
          <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Search reviews
          </span>
          <div className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${toolbarPillClass}`}>
            <FiSearch className="text-slate-400" />
            <input
              value={reviewFilter}
              onChange={(event) => setReviewFilter(event.target.value)}
              placeholder="Filter by user, imdb id, text, or rating"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </label>
      </div>

      <div className={`overflow-hidden rounded-2xl border sm:rounded-3xl ${tableShellClass}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className={tableHeadClass}>
              <tr>
                <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">ID</th>
                <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">IMDb ID</th>
                <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">User</th>
                <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">Rating</th>
                <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">Review</th>
                <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">Updated</th>
                <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">Actions</th>
              </tr>
            </thead>
            <tbody className={tableBodyClass}>
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                    No reviews found.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr key={review.id} className={`align-top ${tableRowClass}`}>
                    <td className="px-4 py-3 font-semibold text-white">{review.id}</td>
                    <td className="px-4 py-3 text-slate-200">{review.imdb_id}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-white">{review.user_email}</p>
                        <p className="text-xs text-slate-400">User ID {review.user_id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {review.rating != null ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-900 shadow-none dark:border-amber-300/20 dark:bg-amber-300/15 dark:text-amber-100">
                          <FiStar className="fill-current text-amber-500 dark:text-amber-300" />
                          {review.rating}/5
                        </span>
                      ) : (
                        <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 shadow-none dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400">
                          No rating
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      <p className="max-w-xl whitespace-pre-wrap leading-6">{review.review}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{formatDate(review.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(review)}
                          className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition ${buttonTheme.edit}`}
                        >
                          <FiEdit3 />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={deletingReviewId === review.id}
                          className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonTheme.delete}`}
                        >
                          <FiTrash2 />
                          {deletingReviewId === review.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">
          Showing {filteredReviews.length} of {reviewsTotal} reviews
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReviewsPage((page) => Math.max(1, page - 1))}
            disabled={reviewsPage === 1}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setReviewsPage((page) => page + 1)}
            disabled={reviewsPage * reviewsLimit >= reviewsTotal}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  </>
);
