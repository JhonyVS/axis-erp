import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  GraduationCap,
  PackageX,
  TrendingUp,
  Users,
} from 'lucide-react';
import { money, num, relative, dateTime } from '@/lib/utils';
import { useMockQuery } from '@/lib/hooks';
import { ITEMS, PEOPLE, COURSES, MOVEMENTS, THROUGHPUT, CATEGORY_VALUE, stockState } from '@/mock/data';
import { PageHeader, Section, StatCard } from '@/components/data/primitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/misc';
import { stagger } from '@/lib/motion';

/**
 * Chart colours come from the theme's generated series, each of which was solved to
 * clear 3:1 against the card it is drawn on. Recharts takes plain strings, and CSS
 * colour functions resolve normally inside SVG paint attributes.
 */
const c = (n: number) => `oklch(var(--chart-${n}))`;

function ChartFrame({ loading, children }: { loading: boolean; children: React.ReactElement }) {
  // The frame keeps its height while loading, so the page does not jump when data lands.
  if (loading) return <Skeleton className="h-[200px] w-full rounded-none" />;
  return (
    <div className="h-[200px] w-full px-1 pt-3">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

const axisProps = {
  stroke: 'oklch(var(--fg-subtle))',
  tick: { fontSize: 10, fill: 'oklch(var(--fg-muted))' },
  tickLine: false,
  axisLine: false,
} as const;

const tooltipStyle = {
  contentStyle: {
    background: 'oklch(var(--surface))',
    border: '1px solid oklch(var(--border))',
    borderRadius: 8,
    fontSize: 12,
    boxShadow: '0 8px 24px oklch(var(--fg) / 0.12)',
  },
  labelStyle: { color: 'oklch(var(--fg))', fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: 'oklch(var(--fg-muted))' },
} as const;

export function Dashboard() {
  const { loading } = useMockQuery(null, 600);

  const out = ITEMS.filter((i) => stockState(i) === 'out').length;
  const low = ITEMS.filter((i) => stockState(i) === 'low').length;
  const value = ITEMS.reduce((s, i) => s + i.onHand * i.unitCost, 0);
  const expiring = COURSES.filter((x) => x.expiresInDays !== null && x.expiresInDays <= 30).length;
  const attention = out + low;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Operations overview"
        description="Plant North — inventory, people and training at a glance."
        aiPrompt="Give me a summary of what needs attention today"
      />

      {/* The one alert that is worth interrupting for, and only when it is true. */}
      {!loading && attention > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 rounded-lg border border-warning-line/50 bg-warning-soft px-3.5 py-2.5"
        >
          <AlertTriangle className="size-4 shrink-0 text-warning-soft-fg" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-sm text-warning-soft-fg">
            <span className="font-semibold">{attention} items need replenishment.</span>{' '}
            {out} are out of stock and {low} sit at or below their reorder point.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/warehouse">
              Review inventory
              <ArrowRight />
            </Link>
          </Button>
        </motion.div>
      )}

      <motion.div
        variants={stagger(0.05)}
        initial="hidden"
        animate="show"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Inventory value"
          value={value}
          format={money}
          delta={2.4}
          hint="vs last month"
          icon={<Boxes />}
          loading={loading}
        />
        <StatCard
          label="Out of stock"
          value={out}
          delta={-8.1}
          hint="vs last week"
          tone="danger"
          icon={<PackageX />}
          loading={loading}
        />
        <StatCard
          label="Active people"
          value={PEOPLE.filter((p) => p.status === 'Active').length}
          delta={1.2}
          hint={`of ${PEOPLE.length} on record`}
          icon={<Users />}
          loading={loading}
        />
        <StatCard
          label="Certifications due"
          value={expiring}
          hint="next 30 days"
          tone="warning"
          icon={<GraduationCap />}
          loading={loading}
        />
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section
          title="Throughput"
          description="Receipts and issues, last 14 days"
          className="lg:col-span-2"
          actions={
            <Badge tone="success" dot>
              <TrendingUp className="size-3" aria-hidden="true" />
              +6.2%
            </Badge>
          }
        >
          <ChartFrame loading={loading}>
            <AreaChart data={THROUGHPUT} margin={{ left: -18, right: 8, top: 4 }}>
              <defs>
                {[1, 2].map((n) => (
                  <linearGradient key={n} id={`grad-${n}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c(n)} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={c(n)} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              {/* Grid lines stay low-contrast so they never compete with the data. */}
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" vertical={false} />
              <XAxis dataKey="day" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
              <YAxis {...axisProps} width={42} />
              <RTooltip {...tooltipStyle} />
              <Area
                type="monotone"
                dataKey="receipts"
                name="Receipts"
                stroke={c(1)}
                strokeWidth={2}
                fill="url(#grad-1)"
              />
              <Area
                type="monotone"
                dataKey="issues"
                name="Issues"
                stroke={c(2)}
                strokeWidth={2}
                fill="url(#grad-2)"
              />
            </AreaChart>
          </ChartFrame>
          <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-2xs text-fg-muted">
            {/* A visible legend, not a colour the reader has to decode from the tooltip. */}
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm" style={{ background: c(1) }} aria-hidden="true" />
              Receipts
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm" style={{ background: c(2) }} aria-hidden="true" />
              Issues
            </span>
          </div>
        </Section>

        <Section title="Value by category" description="Top 6 by on-hand value">
          <ChartFrame loading={loading}>
            <BarChart data={CATEGORY_VALUE} layout="vertical" margin={{ left: 4, right: 12, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" horizontal={false} />
              <XAxis type="number" {...axisProps} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              {/* interval={0} forces every category label. Recharts skips ticks by default,
                  which on a category axis silently hides half the rows it just drew. */}
              <YAxis type="category" dataKey="category" {...axisProps} width={68} interval={0} />
              <RTooltip {...tooltipStyle} formatter={(v: number) => money(v)} />
              <Bar dataKey="value" name="Value" radius={[0, 4, 4, 0]}>
                {CATEGORY_VALUE.map((_, i) => (
                  <Cell key={i} fill={c((i % 6) + 1)} />
                ))}
              </Bar>
            </BarChart>
          </ChartFrame>
        </Section>
      </div>

      <Section
        title="Recent movements"
        description="Last 7 days across all zones"
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/warehouse/movements">
              View all
              <ArrowRight />
            </Link>
          </Button>
        }
      >
        <ul className="divide-y divide-line">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="ml-auto h-3.5 w-16" />
                </li>
              ))
            : MOVEMENTS.slice(0, 6).map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors duration-fast hover:bg-surface-2/60"
                >
                  <Badge
                    tone={
                      m.type === 'Receipt' || m.type === 'Return'
                        ? 'success'
                        : m.type === 'Issue'
                          ? 'warning'
                          : m.type === 'Adjustment'
                            ? 'danger'
                            : 'info'
                    }
                    dot
                    className="w-24 justify-start"
                  >
                    {m.type}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-fg">{m.item}</p>
                    <p className="truncate font-mono text-2xs text-fg-subtle">{m.sku}</p>
                  </div>
                  <span className="hidden shrink-0 font-mono text-sm tabular text-fg-muted sm:block">
                    {num(m.qty)}
                  </span>
                  <span className="hidden w-32 shrink-0 truncate text-2xs text-fg-muted md:block">{m.by}</span>
                  {/* Relative for scanning, absolute in the tooltip — "2d ago" alone is
                      ambiguous the moment someone reads the screenshot next week. */}
                  <Tooltip content={dateTime(m.at)}>
                    <span className="w-16 shrink-0 text-right text-2xs text-fg-subtle">{relative(m.at)}</span>
                  </Tooltip>
                </li>
              ))}
        </ul>
      </Section>
    </div>
  );
}
