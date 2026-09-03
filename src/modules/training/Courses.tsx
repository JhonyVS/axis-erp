import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, Clock, Ellipsis, Pencil, Plus, Search, Trash2, UserPlus, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounced, useMockQuery } from '@/lib/hooks';
import { TRACK_LIST, type Course } from '@/mock/data';
import { useData } from '@/stores/dataStore';
import { CourseFormDialog } from './CourseFormDialog';
import { PageHeader, EmptyState, StatCard } from '@/components/data/primitives';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress, Separator, Skeleton } from '@/components/ui/misc';
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
import { stagger, fadeUp, spring } from '@/lib/motion';

/** Turns "days remaining" into the three answers a user actually needs to distinguish. */
function expiryState(days: number | null) {
  if (days === null) return { tone: 'neutral' as const, label: 'No expiry' };
  if (days < 0) return { tone: 'danger' as const, label: `Expired ${Math.abs(days)}d ago` };
  if (days <= 30) return { tone: 'warning' as const, label: `Expires in ${days}d` };
  return { tone: 'success' as const, label: `Valid ${days}d` };
}

function CourseCard({
  course,
  highlighted,
  onOpen,
  onEdit,
  onDelete,
}: {
  course: Course;
  highlighted: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // A course created a moment ago has nobody enrolled. 0/0 is NaN, and `NaN%` on a
  // progress bar is the kind of thing that only shows up after someone uses the feature.
  const rate = course.enrolled > 0 ? (course.completed / course.enrolled) * 100 : 0;
  const expiry = expiryState(course.expiresInDays);

  return (
    <motion.div variants={fadeUp} layout>
      <motion.div whileHover={{ y: -2 }} transition={spring} className="h-full">
        <Card
          onClick={onOpen}
          className={cn(
            'flex h-full cursor-pointer flex-col p-3.5 transition-shadow duration-normal hover:shadow-mid',
            // The flash fades on its own. A permanent marker would still be there
            // tomorrow, meaning nothing.
            highlighted && 'animate-row-flash ring-1 ring-primary-line'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-mono text-2xs text-fg-subtle">{course.code}</p>
              {/* Wraps rather than truncates: a half-shown course title is unusable. */}
              <h3 className="mt-0.5 text-sm font-semibold leading-snug text-fg">{course.title}</h3>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {course.mandatory && (
                <Tooltip content="Required for this role">
                  <Badge tone="primary">Mandatory</Badge>
                </Tooltip>
              )}
              {/* Stops the card's own click from also firing and opening the drawer
                  behind the menu. */}
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${course.title}`}>
                      <Ellipsis />
                    </Button>
                  </DropdownTrigger>
                  <DropdownContent>
                    <DropdownItem icon={<Pencil />} onSelect={onEdit}>
                      Edit
                    </DropdownItem>
                    <DropdownItem
                      icon={<UserPlus />}
                      onSelect={() => toast.info('Enrolment opened', course.title)}
                    >
                      Enrol people
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem destructive icon={<Trash2 />} onSelect={onDelete}>
                      Delete
                    </DropdownItem>
                  </DropdownContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">{course.track}</Badge>
            <Badge tone={expiry.tone} dot>
              {expiry.tone === 'danger' && <AlertTriangle className="size-3" aria-hidden="true" />}
              {expiry.label}
            </Badge>
          </div>

          <div className="mt-auto space-y-2 pt-3">
            <Progress
              value={rate}
              label={`${course.title}: ${course.completed} of ${course.enrolled} completed`}
              tone={rate >= 80 ? 'success' : rate >= 50 ? 'warning' : 'danger'}
            />
            <div className="flex items-center gap-3 text-2xs text-fg-muted">
              <span className="flex items-center gap-1">
                <Users className="size-3" aria-hidden="true" />
                {course.completed}/{course.enrolled} completed
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" aria-hidden="true" />
                {Math.floor(course.durationMin / 60)}h {course.durationMin % 60}m
              </span>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export function Courses() {
  const [params] = useSearchParams();
  const { courses, people, addCourse, updateCourse, removeCourse, restoreCourse, commitCourse } = useData();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Course | undefined>();
  const [detail, setDetail] = useState<Course | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Course | null>(null);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [track, setTrack] = useState('all');
  const [onlyMandatory, setOnlyMandatory] = useState(false);
  const debounced = useDebounced(search, 300);
  const { loading } = useMockQuery(null, 500);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return courses.filter((c) => {
      if (q && !`${c.code} ${c.title} ${c.track}`.toLowerCase().includes(q)) return false;
      if (track !== 'all' && c.track !== track) return false;
      if (onlyMandatory && !c.mandatory) return false;
      return true;
    });
  }, [courses, debounced, track, onlyMandatory]);

  const hasFilters = !!debounced || track !== 'all' || onlyMandatory;
  const clearAll = () => {
    setSearch('');
    setTrack('all');
    setOnlyMandatory(false);
  };

  // Clearing the id after the flash finishes means the same card can be highlighted again
  // later — a highlight that never resets only ever fires once.
  const flash = (id: number) => {
    setHighlight(id);
    window.setTimeout(() => setHighlight((cur) => (cur === id ? null : cur)), 2400);
  };

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditing(course);
    setFormOpen(true);
  };

  const handleSubmit = (draft: Omit<Course, 'id' | 'completed'>) => {
    if (editing) {
      updateCourse(editing.id, draft);
      flash(editing.id);
    } else {
      flash(addCourse(draft).id);
    }
  };

  const confirmDelete = () => {
    const course = pendingDelete;
    if (!course) return;
    removeCourse(course.id);
    setPendingDelete(null);
    setDetail(null);
    // The toast owns the commit: the record is only really gone when the timer expires.
    toast.undo('Course deleted', {
      description: `${course.code} · ${course.title}`,
      onUndo: () => {
        restoreCourse(course.id);
        toast.success('Course restored', course.title);
      },
      onCommit: () => commitCourse(course.id),
    });
  };

  const expiring = courses.filter((c) => c.expiresInDays !== null && c.expiresInDays <= 30 && c.expiresInDays >= 0).length;
  const expired = courses.filter((c) => c.expiresInDays !== null && c.expiresInDays < 0).length;
  // Guard the divide: a fresh course has nobody enrolled, and 0/0 renders as NaN%.
  const rated = courses.filter((c) => c.enrolled > 0);
  const avgRate = rated.length ? rated.reduce((s, c) => s + (c.completed / c.enrolled) * 100, 0) / rated.length : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Training courses"
        description="Course catalogue with enrolment, completion rate and certification validity."
        aiPrompt="What certifications expire in the next 30 days?"
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus />
            New course
          </Button>
        }
      />

      <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Courses" value={courses.length} icon={<BookOpen />} loading={loading} hint="in catalogue" />
        <StatCard label="Expiring soon" value={expiring} tone="warning" loading={loading} hint="within 30 days" />
        <StatCard label="Already expired" value={expired} tone="danger" loading={loading} hint="needs renewal" />
        <StatCard
          label="Average completion"
          value={avgRate}
          format={(n) => `${n.toFixed(0)}%`}
          delta={5.1}
          loading={loading}
          hint={`across ${people.length} people`}
        />
      </motion.div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search course or code…"
            aria-label="Search courses"
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

        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Filter by track">
          <Button size="xs" variant={track === 'all' ? 'soft' : 'ghost'} aria-pressed={track === 'all'} onClick={() => setTrack('all')}>
            All
          </Button>
          {TRACK_LIST.map((t) => (
            <Button key={t} size="xs" variant={track === t ? 'soft' : 'ghost'} aria-pressed={track === t} onClick={() => setTrack(t)}>
              {t}
            </Button>
          ))}
        </div>

        <Button
          size="xs"
          variant={onlyMandatory ? 'soft' : 'ghost'}
          aria-pressed={onlyMandatory}
          onClick={() => setOnlyMandatory((v) => !v)}
        >
          Mandatory only
        </Button>

        {hasFilters && (
          <Button size="xs" variant="ghost" onClick={clearAll}>
            Clear all
          </Button>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {loading ? 'Loading courses' : `${filtered.length} of ${courses.length} courses shown`}
      </p>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-3.5">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="mt-2 h-4 w-4/5" />
              <Skeleton className="mt-3 h-4 w-24" />
              <Skeleton className="mt-4 h-1.5 w-full" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen />}
            title="No courses match these filters"
            description="Try a different track, or clear the search to see the full catalogue."
            action={
              hasFilters ? (
                <Button variant="secondary" size="sm" onClick={clearAll}>
                  Clear all filters
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={openCreate}>
                  <Plus />
                  New course
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <motion.div
          variants={stagger(0.04)}
          initial="hidden"
          animate="show"
          className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-3')}
        >
          {filtered.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              highlighted={highlight === c.id}
              onOpen={() => setDetail(c)}
              onEdit={() => openEdit(c)}
              onDelete={() => setPendingDelete(c)}
            />
          ))}
        </motion.div>
      )}

      <CourseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Delete this course?"
        description={pendingDelete ? `${pendingDelete.code} · ${pendingDelete.title}` : ''}
        detail="It is removed from the catalogue, but you have six seconds to undo before it is committed."
        onConfirm={confirmDelete}
      />

      <Sheet
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        title={detail?.title ?? ''}
        description={detail ? `${detail.code} · ${detail.track}` : ''}
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
              Edit course
            </Button>
          </>
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="neutral">{detail.track}</Badge>
              {detail.mandatory && <Badge tone="primary">Mandatory</Badge>}
              <Badge tone={expiryState(detail.expiresInDays).tone} dot>
                {expiryState(detail.expiresInDays).label}
              </Badge>
            </div>

            <div className="space-y-1.5">
              <p className="text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                Completion
              </p>
              <Progress
                value={detail.enrolled > 0 ? (detail.completed / detail.enrolled) * 100 : 0}
                label={`${detail.title}: ${detail.completed} of ${detail.enrolled} completed`}
                tone={
                  detail.enrolled === 0
                    ? 'primary'
                    : detail.completed / detail.enrolled >= 0.8
                      ? 'success'
                      : detail.completed / detail.enrolled >= 0.5
                        ? 'warning'
                        : 'danger'
                }
              />
            </div>

            <Separator />

            <dl className="divide-y divide-line text-sm">
              {[
                ['Code', detail.code],
                ['Track', detail.track],
                ['Duration', `${Math.floor(detail.durationMin / 60)}h ${String(detail.durationMin % 60).padStart(2, '0')}m`],
                ['Enrolled', String(detail.enrolled)],
                ['Completed', String(detail.completed)],
                [
                  'Certification',
                  detail.expiresInDays === null ? 'Does not expire' : `${detail.expiresInDays} days`,
                ],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-fg-muted">{k}</dt>
                  <dd className="font-mono tabular">{v}</dd>
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
              Delete this course
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
