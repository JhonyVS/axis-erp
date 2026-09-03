import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/misc';
import { playSound } from '@/lib/sound';
import { DUR, EASE } from '@/lib/motion';

export interface Column<T> {
  id: string;
  header: string;
  /** Cell renderer. Keep it pure — it runs for every visible row on every sort. */
  cell: (row: T) => React.ReactNode;
  /** Supplying this makes the column sortable. */
  sortBy?: (row: T) => string | number;
  align?: 'left' | 'right' | 'center';
  /** Tailwind width class, e.g. `w-24`. */
  width?: string;
  /** Hidden below the given breakpoint rather than truncated into uselessness. */
  hideBelow?: 'sm' | 'md' | 'lg';
}

type SortState = { column: string; dir: 'asc' | 'desc' } | null;

/**
 * A dense table built for reading, not for demoing.
 *
 * The parts that are easy to leave out and expensive to add later:
 *  - `aria-sort` on the sorted header, so the sort is announced and not merely drawn;
 *  - a sticky header, because a 60-row table whose column names scrolled away is a puzzle;
 *  - skeleton rows that occupy the real row height, so nothing reflows when data lands;
 *  - row height driven by the density token rather than by a hard-coded padding.
 */
export function DataTable<T>({
  rows,
  columns,
  getRowId,
  loading,
  empty,
  onRowClick,
  caption,
  initialSort,
}: {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string | number;
  loading?: boolean;
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
  /** Announced to screen readers; describes what the table contains. */
  caption: string;
  initialSort?: SortState;
}) {
  const [sort, setSort] = React.useState<SortState>(initialSort ?? null);
  const reduced = useReducedMotion();

  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.id === sort.column);
    if (!col?.sortBy) return rows;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = col.sortBy!(a);
      const bv = col.sortBy!(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, sort, columns]);

  const toggleSort = (id: string) => {
    playSound('tap');
    setSort((s) => {
      if (s?.column !== id) return { column: id, dir: 'asc' };
      // Third click clears the sort and restores the source order, which is often
      // meaningful (insertion order, relevance) and otherwise unreachable.
      if (s.dir === 'asc') return { column: id, dir: 'desc' };
      return null;
    });
  };

  const hideClass = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' };
  const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' };

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>

        <thead className="sticky top-0 z-10 bg-surface-2/95 backdrop-blur-sm">
          <tr className="border-b border-line">
            {columns.map((col) => {
              const isSorted = sort?.column === col.id;
              const SortIcon = !isSorted ? ChevronsUpDown : sort.dir === 'asc' ? ChevronUp : ChevronDown;

              return (
                <th
                  key={col.id}
                  scope="col"
                  // The state the screen reader hears and the icon the eye sees come from
                  // the same variable, so they cannot drift apart.
                  aria-sort={isSorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : col.sortBy ? 'none' : undefined}
                  className={cn(
                    'whitespace-nowrap px-3 text-2xs font-semibold uppercase tracking-wider text-fg-muted',
                    'h-9',
                    alignClass[col.align ?? 'left'],
                    col.width,
                    col.hideBelow && hideClass[col.hideBelow]
                  )}
                >
                  {col.sortBy ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.id)}
                      className={cn(
                        'group -mx-1 inline-flex h-7 items-center gap-1 rounded px-1',
                        'transition-colors duration-fast hover:text-fg',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isSorted && 'text-primary-fg'
                      )}
                    >
                      {col.header}
                      <SortIcon
                        className={cn(
                          'size-3 shrink-0 transition-opacity duration-fast',
                          isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            // Eight rows at the real row height. A spinner in place of the table would
            // collapse the layout and then shove it back open when the data lands.
            Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-line">
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cn('h-row px-3', col.hideBelow && hideClass[col.hideBelow])}
                  >
                    <Skeleton className="h-3.5" style={{ width: `${45 + ((i * 7 + col.id.length * 11) % 45)}%` }} />
                  </td>
                ))}
              </tr>
            ))
          ) : sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>{empty}</td>
            </tr>
          ) : (
            <AnimatePresence initial={false}>
              {sorted.map((row, i) => (
                <motion.tr
                  key={getRowId(row)}
                  layout={reduced ? false : 'position'}
                  initial={reduced ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: DUR.fast } }}
                  transition={{
                    // Stagger only the first screenful. Delaying row 60 by 2.4 seconds
                    // would be theatre, not feedback.
                    delay: reduced ? 0 : Math.min(i, 12) * 0.018,
                    duration: DUR.normal,
                    ease: EASE,
                  }}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-line last:border-0',
                    'transition-colors duration-fast',
                    onRowClick
                      ? 'cursor-pointer hover:bg-primary-soft/40 focus-within:bg-primary-soft/40'
                      : 'hover:bg-surface-2/70'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        'h-row px-3 py-row-pad align-middle',
                        alignClass[col.align ?? 'left'],
                        col.hideBelow && hideClass[col.hideBelow]
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          )}
        </tbody>
      </table>
    </div>
  );
}
