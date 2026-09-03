import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Ellipsis, Mail, Pencil, Search, Trash2, UserPlus, UserX, X } from 'lucide-react';
import { dateOnly, relative } from '@/lib/utils';
import { useDebounced, useMockQuery } from '@/lib/hooks';
import { DEPARTMENT_LIST, type Person } from '@/mock/data';
import { useData } from '@/stores/dataStore';
import { PersonFormDialog } from './PersonFormDialog';
import { PageHeader, EmptyState, Section, StatCard } from '@/components/data/primitives';
import { DataTable, type Column } from '@/components/data/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, Progress, Separator } from '@/components/ui/misc';
import { Sheet } from '@/components/ui/sheet';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@/components/ui/toast';
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from '@/components/ui/dropdown';
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
  const { people, addPerson, updatePerson, removePerson, restorePerson, commitPerson } = useData();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Person | undefined>();
  const [detail, setDetail] = useState<Person | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Person | null>(null);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [department, setDepartment] = useState('all');
  const debounced = useDebounced(search, 300);
  const { loading } = useMockQuery(null, 520);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return people.filter((p) => {
      if (q && !`${p.name} ${p.role} ${p.department} ${p.site} ${p.email}`.toLowerCase().includes(q)) return false;
      if (department !== 'all' && p.department !== department) return false;
      return true;
    });
  }, [people, debounced, department]);

  const hasFilters = !!debounced || department !== 'all';

  // Clearing the id after the flash finishes means the same row can be highlighted again
  // later — a highlight that never resets only ever fires once.
  const flash = (id: number) => {
    setHighlight(id);
    window.setTimeout(() => setHighlight((cur) => (cur === id ? null : cur)), 2400);
  };

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const openEdit = (person: Person) => {
    setEditing(person);
    setFormOpen(true);
  };

  const handleSubmit = (draft: Omit<Person, 'id' | 'startedAt'>) => {
    if (editing) {
      updatePerson(editing.id, draft);
      flash(editing.id);
    } else {
      flash(addPerson(draft).id);
    }
  };

  const confirmDelete = () => {
    const person = pendingDelete;
    if (!person) return;
    removePerson(person.id);
    setPendingDelete(null);
    setDetail(null);
    // The toast owns the commit: the record is only really gone when the timer expires.
    toast.undo('Person removed', {
      description: `${person.name} · ${person.department}`,
      onUndo: () => {
        restorePerson(person.id);
        toast.success('Person restored', person.name);
      },
      onCommit: () => commitPerson(person.id),
    });
  };

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
    {
      id: 'actions',
      header: '',
      width: 'w-10',
      align: 'center',
      cell: (p) => (
        // Stops the row's own click handler from also firing and opening the drawer
        // behind the menu.
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${p.name}`}>
                <Ellipsis />
              </Button>
            </DropdownTrigger>
            <DropdownContent>
              <DropdownItem icon={<Pencil />} onSelect={() => openEdit(p)}>
                Edit
              </DropdownItem>
              <DropdownItem icon={<Mail />} onSelect={() => toast.info('Email drafted', p.email)}>
                Send email
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem destructive icon={<Trash2 />} onSelect={() => setPendingDelete(p)}>
                Remove
              </DropdownItem>
            </DropdownContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const onLeave = people.filter((p) => p.status === 'On leave').length;
  const behind = people.filter((p) => p.compliance < 80).length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="People directory"
        description="Everyone on site, with their department, status and training compliance."
        aiPrompt="Who is on leave right now?"
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <UserPlus />
            Add person
          </Button>
        }
      />

      <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Headcount" value={people.length} loading={loading} hint="all sites" />
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
          value={people.length ? people.reduce((s, p) => s + p.compliance, 0) / people.length : 0}
          format={(n) => `${n.toFixed(0)}%`}
          delta={3.4}
          loading={loading}
          hint="vs last quarter"
        />
      </motion.div>

      <Section
        title="Directory"
        description={loading ? 'Loading…' : `${filtered.length} of ${people.length} people${hasFilters ? ' match your filters' : ''}`}
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
          onRowClick={setDetail}
          highlightId={highlight}
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
                  <Button variant="primary" size="sm" onClick={openCreate}>
                    <UserPlus />
                    Add person
                  </Button>
                )
              }
            />
          }
        />
      </Section>

      <PersonFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Remove this person?"
        description={pendingDelete ? `${pendingDelete.name} · ${pendingDelete.role}` : ''}
        detail="They are removed from the directory, but you have six seconds to undo before it is committed."
        confirmLabel="Remove"
        onConfirm={confirmDelete}
      />

      <Sheet
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        title={detail?.name ?? ''}
        description={detail ? `${detail.role} · ${detail.department}` : ''}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDetail(null)} sound="close">
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (detail) openEdit(detail);
                setDetail(null);
              }}
            >
              <Pencil />
              Edit person
            </Button>
          </>
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={detail.name} className="size-12" />
              <div className="min-w-0">
                <p className="truncate text-md font-semibold">{detail.name}</p>
                <p className="truncate text-sm text-fg-muted">{detail.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Badge tone={STATUS_TONE[detail.status]} dot>
                {detail.status}
              </Badge>
              <Badge tone="neutral">{detail.department}</Badge>
              <Badge tone="neutral">{detail.site}</Badge>
            </div>

            <div className="space-y-1.5">
              <p className="text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                Mandatory training
              </p>
              <Progress
                value={detail.compliance}
                label={`${detail.name}: ${detail.compliance}% of mandatory training complete`}
                tone={detail.compliance >= 90 ? 'success' : detail.compliance >= 70 ? 'warning' : 'danger'}
              />
            </div>

            <Separator />

            <dl className="divide-y divide-line text-sm">
              {[
                ['Role', detail.role],
                ['Department', detail.department],
                ['Site', detail.site],
                ['Started', dateOnly(detail.startedAt)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-fg-muted">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-danger-fg hover:bg-danger-soft hover:text-danger-soft-fg"
              onClick={() => setPendingDelete(detail)}
            >
              <Trash2 />
              Remove from directory
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
