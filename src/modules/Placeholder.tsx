import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Construction } from 'lucide-react';
import { PageHeader } from '@/components/data/primitives';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUi } from '@/stores/uiStore';

/**
 * A route that is navigable but not built yet.
 *
 * It says what it WILL do and offers the nearest thing that works today. A dead link, or
 * a page that silently renders nothing, teaches the user to distrust the navigation —
 * which is far more expensive than admitting the gap.
 */
export function Placeholder({
  title,
  description,
  planned,
  nearest,
}: {
  title: string;
  description: string;
  planned: string[];
  nearest: { label: string; to: string };
}) {
  const askAi = useUi((s) => s.askAi);

  return (
    <div className="space-y-4">
      <PageHeader title={title} description={description} />

      <Card className="p-6">
        <div className="mx-auto max-w-md text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-xl bg-warning-soft text-warning-soft-fg">
            <Construction className="size-5" aria-hidden="true" />
          </span>
          <Badge tone="warning" className="mt-3">
            Not built yet
          </Badge>
          <p className="mt-3 text-sm text-fg-muted">
            This screen is part of the module but has not been implemented in this prototype.
          </p>
        </div>

        <ul className="mx-auto mt-5 max-w-md space-y-1.5">
          {planned.map((p) => (
            <li
              key={p}
              className="flex items-start gap-2 rounded-lg border border-line bg-surface-2/50 px-3 py-2 text-sm text-fg-muted"
            >
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-fg-subtle" aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button variant="primary" size="sm" asChild>
            <Link to={nearest.to}>
              {nearest.label}
              <ArrowRight />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => askAi(`What can you tell me about ${title.toLowerCase()}?`)}>
            <Sparkles />
            Ask AI instead
          </Button>
        </div>
      </Card>
    </div>
  );
}
