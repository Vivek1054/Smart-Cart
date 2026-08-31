import React, { useMemo, useState } from 'react';
import { FaSearch, FaChevronLeft, FaChevronRight, FaInbox } from 'react-icons/fa';

const DataTable = ({ columns, data, searchKeys = [], pageSize = 8, emptyMessage = 'No records found', toolbar = null, rowKey = 'id' }) => {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!query || searchKeys.length === 0) return data;
    const q = query.toLowerCase();
    return data.filter((row) => searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)));
  }, [data, query, searchKeys]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice(page * pageSize, page * pageSize + pageSize);

  const changeQuery = (v) => { setQuery(v); setPage(0); };

  return (
    <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft overflow-hidden">
      <div className="flex items-center gap-3 p-4 flex-wrap border-b border-ink-800/5 dark:border-white/10">
        {searchKeys.length > 0 && (
          <label className="flex items-center gap-2 flex-1 min-w-[180px] px-3.5 py-2 rounded-full border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5">
            <FaSearch className="text-ink-800/40 dark:text-white/40 shrink-0" size={12} />
            <input
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
              placeholder="Search..."
              className="bg-transparent outline-none text-sm w-full placeholder:text-ink-800/40 dark:placeholder:text-white/40"
            />
          </label>
        )}
        {toolbar}
        <span className="text-xs text-ink-800/40 dark:text-white/40 ml-auto">{filtered.length} results</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-800/40 dark:text-white/40 border-b border-ink-800/5 dark:border-white/10">
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-semibold whitespace-nowrap">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row) => (
              <tr key={row[rowKey]} className="border-b border-ink-800/5 dark:border-white/5 last:border-0 hover:bg-cream-50 dark:hover:bg-white/[0.03] transition-colors">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3.5 align-middle text-ink-800/80 dark:text-white/80 whitespace-nowrap">
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {paged.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-ink-800/40 dark:text-white/40">
            <FaInbox size={26} className="mb-3" />
            <p className="text-sm font-medium">{emptyMessage}</p>
          </div>
        )}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-ink-800/5 dark:border-white/10">
          <span className="text-xs text-ink-800/40 dark:text-white/40">Page {page + 1} of {pageCount}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-800/10 dark:border-white/15 disabled:opacity-30 text-ink-800/70 dark:text-white/70"
            >
              <FaChevronLeft size={11} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-800/10 dark:border-white/15 disabled:opacity-30 text-ink-800/70 dark:text-white/70"
            >
              <FaChevronRight size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
