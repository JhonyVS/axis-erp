import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, Clock, Plus, Search, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounced, useMockQuery } from '@/lib/hooks';
import { COURSES, TRACK_LIST, PEOPLE, type Course } from '@/mock/data';
import { PageHeader, EmptyState, StatCard } from '@/components/data/primitives';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress, Skeleton } from '@/components/ui/misc';
import { Tooltip } from '@/components/ui/tooltip';
import { stagger, fadeUp, spring } from '@/lib/motion';

/** Turns "days remaining" into the three answers a user actually needs to distinguish. */
function expiryState(days: number | null) {
  if (days === null) return { tone: 'neutral' as const, label: 'No expiry' };
  if (days < 0) return { tone: 'danger' as const, label: `Expired ${Math.abs(days)}d ago` };
  if (days <= 30) return { tone: 'warning' as const, label: `Expires in ${days}d` };
  return { tone: 'success' as const, label: `Valid ${days}d` };
}

function CourseCard({ course }: { course: Course }) {
  const rate = (course.completed / course.enrolled) * 100;
  const expiry = expiryState(course.expiresInDays);

  return (
    <motion.div variants={fadeUp} layout>
      <motion.div whileHover={{ y: -2 }} transition={spring} className="h-full">
        <Card className="flex h-full flex-col p-3.5 transition-shadow duration-normal hover:shadow-mid">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-mono text-2xs text-fg-subtle">{course.code}</p>
              {/* Wraps rather than truncates: a half-shown course title is unusable. */}
              <h3 className="mt-0.5 text-sm font-semibold leading-snug text-fg">{course.title}</h3>
            </div>
            {course.mandatory && (
              <Tooltip content="Required for this role">
                <Badge tone="primary" className="shrink-0">
                  Mandatory
                </Badge>
              </Tooltip>
            )}
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
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [track, setTrack] = useState('all');
  const [onlyMandatory, setOnlyMandatory] = useState(false);
  const debounced = useDebounced(search, 300);
  const { loading } = useMockQuery(null, 500);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return COURSES.filter((c) => {
      if (q && !`${c.code} ${c.title} ${c.track}`.toLowerCase().includes(q)) return false;
      if (track !== 'all' && c.track !== track) return false;
      if (onlyMandatory && !c.mandatory) return false;
      return true;
    });
  }, [debounced, track, onlyMandatory]);

  const hasFilters = !!debounced || track !== 'all' || onlyMandatory;
  const clearAll = () => {
    setSearch('');
    setTrack('all');
    setOnlyMandatory(false);
  };

  const expiring = COURSES.filter((c) => c.expiresInDays !== null && c.expiresInDays <= 30 && c.expiresInDays >= 0).length;
  const expired = COURSES.filter((c) => c.expiresInDays !== null && c.expiresInDays < 0).length;
  const avgRate = COURSES.reduce((s, c) => s + (c.completed / c.enrolled) * 100, 0) / COURSES.length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Training courses"
        description="Course catalogue with enrolment, completion rate and certification validity."
        aiPrompt="What certifications expire in the next 30 days?"
        actions={
          <Button variant="primary" size="sm">
            <Plus />
            New course
          </Button>
        }
      />

      <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Courses" value={COURSES.length} icon={<BookOpen />} loading={loading} hint="in catalogue" />
        <StatCard label="Expiring soon" value={expiring} tone="warning" loading={loading} hint="within 30 days" />
        <StatCard label="Already expired" value={expired} tone="danger" loading={loading} hint="needs renewal" />
        <StatCard
          label="Average completion"
          value={avgRate}
          format={(n) => `${n.toFixed(0)}%`}
          delta={5.1}
          loading={loading}
          hint={`across ${PEOPLE.length} people`}
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
        {loading ? 'Loading courses' : `${filtered.length} of ${COURSES.length} courses shown`}
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
              <Button variant="secondary" size="sm" onClick={clearAll}>
                Clear all filters
              </Button>
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
            <CourseCard key={c.id} course={c} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
