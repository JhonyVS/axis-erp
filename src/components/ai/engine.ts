import { ITEMS, PEOPLE, COURSES, MOVEMENTS, stockState, type Item } from '@/mock/data';
import { money, num, relative } from '@/lib/utils';

/**
 * The assistant's answer engine.
 *
 * There is no model behind this — the project has no backend. What it does have is the
 * *shape* a real assistant integration needs, which is the part that determines whether
 * the UI works: named tool calls that resolve one at a time, structured answer blocks
 * instead of a wall of prose, and a cited source under every claim.
 *
 * Swapping in a real API means replacing `answer()` and streaming the blocks it returns.
 * Nothing in the components changes.
 */

export type Block =
  | { kind: 'text'; text: string }
  | { kind: 'stats'; items: { label: string; value: string; tone?: 'danger' | 'warning' | 'success' }[] }
  | { kind: 'table'; caption: string; columns: string[]; rows: (string | number)[][] }
  | { kind: 'actions'; items: { label: string; to?: string; prompt?: string }[] };

export interface ToolCall {
  /** Shown to the user verbatim. An assistant that reads your data should say which data. */
  label: string;
  /** Milliseconds this step appears to take. Staggered so the sequence reads as work. */
  ms: number;
}

export interface Answer {
  tools: ToolCall[];
  blocks: Block[];
  /** Where the numbers came from. An unsourced figure in an ERP is a liability. */
  source: string;
}

const lowStock = () => ITEMS.filter((i) => stockState(i) === 'low');
const outOfStock = () => ITEMS.filter((i) => stockState(i) === 'out');

const itemRow = (i: Item) => [i.sku, i.name, `${i.onHand} ${i.uom}`, i.minStock, i.bin];

export const SUGGESTIONS = [
  'Which items are below minimum stock?',
  'What certifications expire in the next 30 days?',
  'Show inventory value by category',
  'Who is on leave right now?',
] as const;

export function answer(question: string): Answer {
  const q = question.toLowerCase();

  /* ---- Inventory: stock levels ---- */
  if (/(low|below|minimum|reorder|replenish|out of stock|shortage)/.test(q)) {
    const low = lowStock();
    const out = outOfStock();
    const exposure = [...low, ...out].reduce((s, i) => s + (i.minStock - i.onHand) * i.unitCost, 0);

    return {
      tools: [
        { label: 'Reading inventory levels', ms: 480 },
        { label: `Comparing ${ITEMS.length} items against reorder points`, ms: 620 },
      ],
      blocks: [
        {
          kind: 'text',
          text: `${low.length + out.length} items need attention: ${out.length} are out of stock and ${low.length} are at or below their reorder point. Replenishing all of them to minimum costs roughly ${money(exposure)}.`,
        },
        {
          kind: 'stats',
          items: [
            { label: 'Out of stock', value: String(out.length), tone: 'danger' },
            { label: 'Below minimum', value: String(low.length), tone: 'warning' },
            { label: 'To restock', value: money(exposure) },
          ],
        },
        {
          kind: 'table',
          caption: 'Highest-value gaps',
          columns: ['SKU', 'Item', 'On hand', 'Min', 'Bin'],
          rows: [...out, ...low]
            .sort((a, b) => (b.minStock - b.onHand) * b.unitCost - (a.minStock - a.onHand) * a.unitCost)
            .slice(0, 6)
            .map(itemRow),
        },
        {
          kind: 'actions',
          items: [
            { label: 'Open inventory', to: '/warehouse' },
            { label: 'Draft a purchase request', prompt: 'Draft a purchase request for the out-of-stock items' },
          ],
        },
      ],
      source: `Inventory · ${ITEMS.length} items · Plant North`,
    };
  }

  /* ---- Training: certifications ---- */
  if (/(certif|training|course|expir|compliance|lapse)/.test(q)) {
    const expiring = COURSES.filter((c) => c.expiresInDays !== null && c.expiresInDays <= 30).sort(
      (a, b) => (a.expiresInDays ?? 0) - (b.expiresInDays ?? 0)
    );
    const behind = PEOPLE.filter((p) => p.compliance < 80);

    return {
      tools: [
        { label: 'Reading training records', ms: 420 },
        { label: 'Checking certification validity', ms: 560 },
      ],
      blocks: [
        {
          kind: 'text',
          text:
            expiring.length > 0
              ? `${expiring.length} mandatory courses lapse within 30 days, and ${behind.length} people are below the 80% compliance threshold.`
              : `No mandatory certifications lapse in the next 30 days. ${behind.length} people are still below the 80% compliance threshold.`,
        },
        {
          kind: 'table',
          caption: 'Expiring soonest',
          columns: ['Code', 'Course', 'Track', 'Days left', 'Completed'],
          rows: expiring.slice(0, 6).map((c) => [
            c.code,
            c.title,
            c.track,
            c.expiresInDays! < 0 ? `${Math.abs(c.expiresInDays!)} overdue` : c.expiresInDays!,
            `${c.completed}/${c.enrolled}`,
          ]),
        },
        { kind: 'actions', items: [{ label: 'Open training', to: '/training' }] },
      ],
      source: `Training · ${COURSES.length} courses · ${PEOPLE.length} people`,
    };
  }

  /* ---- Inventory value ---- */
  if (/(value|worth|cost|capital|category|categories)/.test(q)) {
    const byCat = new Map<string, number>();
    for (const i of ITEMS) byCat.set(i.category, (byCat.get(i.category) ?? 0) + i.onHand * i.unitCost);
    const sorted = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((s, [, v]) => s + v, 0);

    return {
      tools: [
        { label: 'Reading inventory levels', ms: 400 },
        { label: 'Valuing stock at unit cost', ms: 520 },
      ],
      blocks: [
        {
          kind: 'text',
          text: `Total on-hand value is ${money(total)} across ${ITEMS.length} SKUs. ${sorted[0]![0]} alone accounts for ${((sorted[0]![1] / total) * 100).toFixed(0)}% of it.`,
        },
        {
          kind: 'table',
          caption: 'Value by category',
          columns: ['Category', 'Value', 'Share'],
          rows: sorted.map(([c, v]) => [c, money(v), `${((v / total) * 100).toFixed(1)}%`]),
        },
      ],
      source: `Inventory · valued at standard unit cost`,
    };
  }

  /* ---- People ---- */
  if (/(people|headcount|staff|team|leave|absent|who|employee|onboard)/.test(q)) {
    const onLeave = PEOPLE.filter((p) => p.status === 'On leave');
    const onboarding = PEOPLE.filter((p) => p.status === 'Onboarding');

    return {
      tools: [
        { label: 'Reading the people directory', ms: 430 },
        { label: 'Filtering by status', ms: 380 },
      ],
      blocks: [
        {
          kind: 'text',
          text: `${PEOPLE.length} people on record. ${onLeave.length} are currently on leave and ${onboarding.length} are onboarding.`,
        },
        {
          kind: 'stats',
          items: [
            { label: 'Active', value: String(PEOPLE.length - onLeave.length - onboarding.length), tone: 'success' },
            { label: 'On leave', value: String(onLeave.length), tone: 'warning' },
            { label: 'Onboarding', value: String(onboarding.length) },
          ],
        },
        {
          kind: 'table',
          caption: 'On leave',
          columns: ['Name', 'Role', 'Department', 'Site'],
          rows: onLeave.slice(0, 6).map((p) => [p.name, p.role, p.department, p.site]),
        },
        { kind: 'actions', items: [{ label: 'Open directory', to: '/hr' }] },
      ],
      source: `People · ${PEOPLE.length} records`,
    };
  }

  /* ---- Movements ---- */
  if (/(movement|transaction|receipt|issue|transfer|activity|recent)/.test(q)) {
    return {
      tools: [{ label: 'Reading stock movements', ms: 460 }],
      blocks: [
        { kind: 'text', text: `The ${MOVEMENTS.length} most recent movements, newest first.` },
        {
          kind: 'table',
          caption: 'Recent movements',
          columns: ['Type', 'Item', 'Qty', 'By', 'When'],
          rows: MOVEMENTS.slice(0, 8).map((m) => [m.type, m.item, m.qty, m.by, relative(m.at)]),
        },
      ],
      source: `Movements · last 7 days`,
    };
  }

  /* ---- Fallback. Says what it can do rather than apologising. ---- */
  return {
    tools: [{ label: 'Checking available data sources', ms: 380 }],
    blocks: [
      {
        kind: 'text',
        text: `I can read this workspace's inventory, people and training data. I do not have access to anything outside it, and I will not invent a number I cannot source.`,
      },
      {
        kind: 'stats',
        items: [
          { label: 'SKUs', value: num(ITEMS.length) },
          { label: 'People', value: num(PEOPLE.length) },
          { label: 'Courses', value: num(COURSES.length) },
        ],
      },
      {
        kind: 'actions',
        items: SUGGESTIONS.map((s) => ({ label: s, prompt: s })),
      },
    ],
    source: 'Workspace · Plant North',
  };
}
