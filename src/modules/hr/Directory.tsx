import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, UserPlus, UserX, X } from 'lucide-react';
import { dateOnly, relative } from '@/lib/utils';
import { useDebounced, useMockQuery } from '@/lib/hooks';
import { PEOPLE, DEPARTMENT_LIST, type Person } from '@/mock/data';
import { PageHeader, EmptyState, Section, StatCard } from '@/components/data/primitives';
import { DataTable, type Column } from '@/components/data/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, Progress } from '@/components/ui/misc';
import { Tooltip } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { stagger } from '@/lib/motion';

const STATUS_TONE = {
  Active: 'success',
  'On leave': 'warning',
  Onboarding: 'info',
} as const;

export function Directory() {
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [department, setDepartment] = useState('all');
  const debounced = useDebounced(search, 300);
  const { loading } = useMockQuery(null, 520);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return PEOPLE.filter((p) => {
      if (q && !`${p.name} ${p.role} ${p.department} ${p.site} ${p.email}`.toLowerCase().includes(q)) return false;
      if (department !== 'all' && p.department !== department) return false;
      return true;
    });
  }, [debounced, department]);

  const hasFilters = !!debounced || department !== 'all';

  const columns: Column<Person>[] = [
    {
      id: 'name',
      header: 'Person',
      sortBy: (p) => p.name,
      cell: (p) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={p.name} className="size-7" />
          <div className="min-w-0">
            <p className="truncate font-medium text-fg">{p.name}</p>
            <p className="truncate text-2xs text-fg-subtle">{p.email}</p>
          </div>
        </div>
      ),
    },
    { id: 'role', header: 'Role', sortBy: (p) => p.role, hideBelow: 'sm', cell: (p) => <span className="text-fg-muted">{p.role}</span> },
    {
      id: 'department',
      header: 'Department',
      sortBy: (p) => p.department,
      hideBelow: 'md',
      cell: (p) => <Badge tone="neutral">{p.department}</Badge>,
    },
    { id: 'site', header: 'Site', sortBy: (p) => p.site, hideBelow: 'lg', cell: (p) => <span className="text-fg-muted">{p.site}</span> },
    {
      id: 'status',
      header: 'Status',
      width: 'w-28',
      sortBy: (p) => p.status,
      cell: (p) => (
        <Badge tone={STATUS_TONE[p.status]} dot>
          {p.status}
        </Badge>
      ),
    },
    {
      id: 'compliance',
      header: 'Training',
      width: 'w-40',
      hideBelow: 'md',
      sortBy: (p) => p.compliance,
      cell: (p) => (
        <Progress
          value={p.compliance}
          label={`${p.name}: ${p.compliance}% of mandatory training complete`}
          tone={p.compliance >= 90 ? 'success' : p.compliance >= 70 ? 'warning' : 'danger'}
        />
      ),
    },
    {
      id: 'started',
      header: 'Started',
      width: 'w-24',
      hideBelow: 'lg',
      sortBy: (p) => p.startedAt,
      cell: (p) => (
        <Tooltip content={dateOnly(p.startedAt)}>
          <span className="text-2xs text-fg-subtle">{relative(p.startedAt)}</span>
        </Tooltip>
      ),
    },
  ];

  const onLeave = PEOPLE.filter((p) => p.status === 'On leave').length;
  const behind = PEOPLE.filter((p) => p.compliance < 80).length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="People directory"
        description="Everyone on site, with their department, status and training compliance."
        aiPrompt="Who is on leave right now?"
        actions={
          <Button variant="primary" size="sm">
            <UserPlus />
            Add person
          </Button>
        }
      />

      <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Headcount" value={PEOPLE.length} loading={loading} hint="all sites" />
        <StatCard label="On leave" value={onLeave} tone="warning" loading={loading} hint="today" />
        <StatCard
          label="Below 80% compliance"
          value={behind}
          tone="danger"
          loading={loading}
          hint="mandatory training"
        />
        <StatCard
          label="Average compliance"
          value={PEOPLE.reduce((s, p) => s + p.compliance, 0) / PEOPLE.length}
          format={(n) => `${n.toFixed(0)}%`}
          delta={3.4}
          loading={loading}
          hint="vs last quarter"
        />
      </motion.div>

      <Section
        title="Directory"
        description={loading ? 'Loading…' : `${filtered.length} of ${PEOPLE.length} people${hasFilters ? ' match your filters' : ''}`}
        actions={
          hasFilters ? (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setSearch('');
                setDepartment('all');
              }}
            >
              Clear all
            </Button>
          ) : null
        }
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, role or site…"
              aria-label="Search people"
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

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            aria-label="Filter by department"
            className="h-9 rounded-md border border-line bg-surface-3 px-2 text-sm text-fg transition-colors hover:border-line-strong focus:border-primary-line focus:outline-none focus:ring-2 focus:ring-ring/35"
          >
            <option value="all">All departments</option>
            {DEPARTMENT_LIST.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          caption="People directory with department, status and training compliance"
          rows={filtered}
          columns={columns}
          getRowId={(p) => p.id}
          loading={loading}
          initialSort={{ column: 'name', dir: 'asc' }}
          empty={
            <EmptyState
              icon={<UserX />}
              title={hasFilters ? 'No one matches these filters' : 'No people on record'}
              description={
                hasFilters
                  ? 'Try a different department, or clear the search.'
                  : 'Add the first person to start tracking roles and training compliance.'
              }
              action={
                hasFilters ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSearch('');
                      setDepartment('all');
                    }}
                  >
                    Clear all filters
                  </Button>
                ) : (
                  <Button variant="primary" size="sm">
                    <UserPlus />
                    Add person
                  </Button>
                )
              }
            />
          }
        />
      </Section>
    </div>
  );
}
