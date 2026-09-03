import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageSearch, PackageX, Plus, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { money, num, cn } from '@/lib/utils';
import { useDebounced, useMockQuery } from '@/lib/hooks';
import { ITEMS, CATEGORY_LIST, STOCK_LABEL, stockState, type Item, type StockState } from '@/mock/data';
import { PageHeader, EmptyState, Section } from '@/components/data/primitives';
import { DataTable, type Column } from '@/components/data/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/misc';

const TONE: Record<StockState, 'success' | 'warning' | 'danger' | 'info'> = {
  'in-stock': 'success',
  low: 'warning',
  out: 'danger',
  reserved: 'info',
};

/** A removable filter. The chip IS the affordance for undoing it — no hidden reset. */
function FilterChip({ label, value, onClear }: { label: string; value: string; onClear: () => void }) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      className="inline-flex items-center gap-1 rounded-md bg-primary-soft py-0.5 pl-2 pr-1 text-2xs font-medium text-primary-soft-fg ring-1 ring-inset ring-primary-line/40"
    >
      <span className="text-primary-soft-fg/70">{label}:</span>
      <span className="max-w-32 truncate">{value}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove ${label} filter`}
        className="grid size-4 place-items-center rounded transition-colors hover:bg-primary-line/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-3" aria-hidden="true" />
      </button>
    </motion.span>
  );
}

export function Inventory() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [category, setCategory] = useState('all');
  const [state, setState] = useState<StockState | 'all'>('all');

  // The typed value stays instant; only the query it drives is debounced.
  const debouncedSearch = useDebounced(search, 300);
  const { loading } = useMockQuery(null, 550);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return ITEMS.filter((i) => {
      if (q && !`${i.sku} ${i.name} ${i.bin} ${i.category}`.toLowerCase().includes(q)) return false;
      if (category !== 'all' && i.category !== category) return false;
      if (state !== 'all' && stockState(i) !== state) return false;
      return true;
    });
  }, [debouncedSearch, category, state]);

  const hasFilters = !!debouncedSearch || category !== 'all' || state !== 'all';

  const clearAll = () => {
    setSearch('');
    setCategory('all');
    setState('all');
    setParams({}, { replace: true });
  };

  // Counts sit ON the filter buttons. Choosing a filter that turns out to be empty is a
  // wasted click the interface could have prevented.
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: ITEMS.length };
    for (const s of ['in-stock', 'low', 'out', 'reserved'] as StockState[]) {
      map[s] = ITEMS.filter((i) => stockState(i) === s).length;
    }
    return map;
  }, []);

  const columns: Column<Item>[] = [
    {
      id: 'sku',
      header: 'SKU',
      width: 'w-36',
      sortBy: (i) => i.sku,
      cell: (i) => <span className="font-mono text-xs text-fg-muted">{i.sku}</span>,
    },
    {
      id: 'name',
      header: 'Item',
      sortBy: (i) => i.name,
      cell: (i) => (
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium text-fg">{i.name}</span>
          {i.serialized && (
            <Tooltip content="Tracked unit by unit">
              <Badge tone="primary">Serialized</Badge>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      hideBelow: 'md',
      sortBy: (i) => i.category,
      cell: (i) => <Badge tone="neutral">{i.category}</Badge>,
    },
    {
      id: 'stock',
      header: 'On hand',
      align: 'right',
      width: 'w-32',
      sortBy: (i) => i.onHand,
      cell: (i) => (
        <Tooltip content={`${num(i.reserved)} reserved · minimum ${num(i.minStock)}`}>
          <span className="font-mono tabular">
            <span className={cn('font-medium', i.onHand === 0 && 'text-danger-fg')}>{num(i.onHand)}</span>
            <span className="ml-1 text-2xs text-fg-subtle">{i.uom}</span>
          </span>
        </Tooltip>
      ),
    },
    {
      id: 'coverage',
      header: 'vs minimum',
      hideBelow: 'lg',
      width: 'w-40',
      sortBy: (i) => (i.minStock === 0 ? 999 : i.onHand / i.minStock),
      cell: (i) => {
        const ratio = i.minStock === 0 ? 100 : (i.onHand / i.minStock) * 100;
        return (
          <Progress
            value={Math.min(100, ratio)}
            displayValue={ratio}
            label={`${i.name}: ${Math.round(ratio)}% of minimum stock`}
            tone={ratio === 0 ? 'danger' : ratio <= 100 ? 'warning' : 'success'}
          />
        );
      },
    },
    {
      id: 'state',
      header: 'Status',
      width: 'w-32',
      sortBy: (i) => stockState(i),
      // Always a text label. The soft fills are near-isoluminant with the row, so colour
      // alone would carry no information at all in greyscale.
      cell: (i) => {
        const s = stockState(i);
        return (
          <Badge tone={TONE[s]} dot>
            {STOCK_LABEL[s]}
          </Badge>
        );
      },
    },
    {
      id: 'bin',
      header: 'Bin',
      hideBelow: 'sm',
      width: 'w-24',
      sortBy: (i) => i.bin,
      cell: (i) => <span className="font-mono text-xs text-fg-muted">{i.bin}</span>,
    },
    {
      id: 'value',
      header: 'Value',
      align: 'right',
      hideBelow: 'lg',
      width: 'w-28',
      sortBy: (i) => i.onHand * i.unitCost,
      cell: (i) => <span className="font-mono text-xs tabular text-fg-muted">{money(i.onHand * i.unitCost)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Inventory"
        description="Every SKU held at Plant North, with live stock position against reorder points."
        aiPrompt="Which items are below minimum stock?"
        actions={
          <Button variant="primary" size="sm">
            <Plus />
            New item
          </Button>
        }
      />

      <Section
        title="Items"
        description={
          // A contextual phrase, not a bare number. Screen readers announce the whole
          // sentence when the count changes, so the update makes sense out of context.
          loading ? 'Loading…' : `${filtered.length} of ${ITEMS.length} items${hasFilters ? ' match your filters' : ''}`
        }
        actions={
          hasFilters ? (
            <Button variant="ghost" size="xs" onClick={clearAll}>
              Clear all
            </Button>
          ) : null
        }
      >
        <div className="space-y-2.5 border-b border-line p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-56 flex-1">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-subtle"
                aria-hidden="true"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKU, name or bin…"
                aria-label="Search items"
                className="pl-8 pr-8"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-1.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Filter by stock status">
              {(['all', 'in-stock', 'low', 'out'] as const).map((s) => (
                <Button
                  key={s}
                  size="xs"
                  variant={state === s ? 'soft' : 'ghost'}
                  aria-pressed={state === s}
                  onClick={() => setState(s)}
                >
                  {s === 'all' ? 'All' : STOCK_LABEL[s]}
                  <span className="ml-0.5 font-mono text-2xs tabular opacity-60">{counts[s]}</span>
                </Button>
              ))}
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
              className="h-9 rounded-md border border-line bg-surface-3 px-2 text-sm text-fg transition-colors hover:border-line-strong focus:border-primary-line focus:outline-none focus:ring-2 focus:ring-ring/35"
            >
              <option value="all">All categories</option>
              {CATEGORY_LIST.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {hasFilters && (
            // Chips WRAP rather than shrink. Truncating a filter's value makes the
            // active filter unreadable, which is the one thing it must never be.
            <div className="flex flex-wrap items-center gap-1.5">
              {debouncedSearch && (
                <FilterChip label="Search" value={debouncedSearch} onClear={() => setSearch('')} />
              )}
              {category !== 'all' && (
                <FilterChip label="Category" value={category} onClear={() => setCategory('all')} />
              )}
              {state !== 'all' && (
                <FilterChip label="Status" value={STOCK_LABEL[state]} onClear={() => setState('all')} />
              )}
            </div>
          )}
        </div>

        <DataTable
          caption="Inventory items with stock position, location and value"
          rows={filtered}
          columns={columns}
          getRowId={(i) => i.id}
          loading={loading}
          initialSort={{ column: 'name', dir: 'asc' }}
          empty={
            // Two genuinely different problems, two different exits.
            hasFilters ? (
              <EmptyState
                icon={<PackageSearch />}
                title="No items match these filters"
                description="Nothing in this warehouse fits the current search and filter combination."
                action={
                  <Button variant="secondary" size="sm" onClick={clearAll}>
                    Clear all filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={<PackageX />}
                title="No items in this warehouse yet"
                description="Add the first item to start tracking stock, reorder points and locations."
                action={
                  <Button variant="primary" size="sm">
                    <Plus />
                    New item
                  </Button>
                }
              />
            )
          }
        />
      </Section>
    </div>
  );
}
