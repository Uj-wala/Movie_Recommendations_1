import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';

export const Pagination = ({ currentPage, totalPages, onPageChange, isLoading }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page);
  }

  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <PageButton
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
      >
        <FiArrowLeft />
        <span className="hidden sm:inline">Previous</span>
      </PageButton>

      {pages.map((page) => (
        <PageButton
          key={page}
          onClick={() => onPageChange(page)}
          active={page === currentPage}
          disabled={isLoading}
        >
          {page}
        </PageButton>
      ))}

      <PageButton
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
      >
        <span className="hidden sm:inline">Next</span>
        <FiArrowRight />
      </PageButton>
    </div>
  );
};

const PageButton = ({ children, onClick, active = false, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border px-4 font-black transition ${
      active
        ? 'border-cyan-200 bg-cyan-300 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.32)]'
        : 'border-white/10 bg-white/10 text-white hover:border-cyan-300/40 hover:bg-cyan-300/10'
    } disabled:cursor-not-allowed disabled:opacity-40`}
  >
    {children}
  </button>
);
