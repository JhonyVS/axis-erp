/**
 * Deterministic mock data. There is no backend in this project — the point is the
 * interface — but the shapes are realistic enough that swapping in a real API means
 * changing the fetch layer only, not the components.
 *
 * Everything is generated from a seeded PRNG so a reload does not reshuffle the tables.
 * Randomness that changes between renders makes it impossible to tell a UI bug from data.
 */

/** Mulberry32 — small, fast, and identical across runs. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r = rng(20260902);
const one = <T,>(list: readonly T[]): T => list[Math.floor(r() * list.length)]!;
const between = (min: number, max: number) => Math.floor(r() * (max - min + 1)) + min;
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

/* ------------------------------------------------------------------ *
 * Warehouse
 * ------------------------------------------------------------------ */

export type StockState = 'in-stock' | 'low' | 'out' | 'reserved';

export interface Item {
  id: number;
  sku: string;
  name: string;
  category: string;
  uom: string;
  onHand: number;
  reserved: number;
  minStock: number;
  bin: string;
  unitCost: number;
  serialized: boolean;
  updatedAt: string;
}

const CATEGORIES = ['Bearings', 'Fasteners', 'Hydraulics', 'Electrical', 'Filters', 'Lubricants', 'Safety', 'Tooling'] as const;
const UOM = ['ea', 'box', 'set', 'm', 'L', 'kg'] as const;
const ADJ = ['Hex', 'Flanged', 'Tapered', 'Sealed', 'Reinforced', 'Coated', 'Precision', 'Heavy-duty', 'Compact', 'Modular'] as const;
const NOUN = ['Bolt M12', 'Ball Bearing 6204', 'Hydraulic Hose', 'Contactor 24V', 'Air Filter', 'Gear Oil 80W', 'Safety Harness', 'Torque Wrench', 'O-Ring Kit', 'Proximity Sensor', 'Drive Belt', 'Coupling Sleeve'] as const;

const ZONES = ['A', 'B', 'C', 'D'] as const;

export const ITEMS: Item[] = Array.from({ length: 64 }, (_, i) => {
  const minStock = between(4, 30);
  // A deliberate spread of stock states so every badge and empty state is reachable
  // without editing data: ~14% out, ~20% low, the rest healthy.
  const roll = r();
  const onHand = roll < 0.14 ? 0 : roll < 0.34 ? between(1, minStock) : between(minStock + 1, minStock * 9);

  return {
    id: i + 1,
    sku: `AX-${String(between(1000, 9999))}-${one(ZONES)}${between(10, 99)}`,
    name: `${one(ADJ)} ${one(NOUN)}`,
    category: one(CATEGORIES),
    uom: one(UOM),
    onHand,
    reserved: onHand > 0 ? between(0, Math.min(onHand, 12)) : 0,
    minStock,
    bin: `${one(ZONES)}-${String(between(1, 24)).padStart(2, '0')}-${String(between(1, 6))}`,
    unitCost: Number((r() * 480 + 3).toFixed(2)),
    serialized: r() < 0.22,
    updatedAt: daysAgo(Number((r() * 45).toFixed(2))),
  };
});

export function stockState(item: Item): StockState {
  if (item.onHand === 0) return 'out';
  if (item.onHand <= item.minStock) return 'low';
  if (item.reserved >= item.onHand) return 'reserved';
  return 'in-stock';
}

export const STOCK_LABEL: Record<StockState, string> = {
  'in-stock': 'In stock',
  low: 'Low stock',
  out: 'Out of stock',
  reserved: 'Fully reserved',
};

export interface Movement {
  id: number;
  sku: string;
  item: string;
  type: 'Receipt' | 'Issue' | 'Transfer' | 'Adjustment' | 'Return';
  qty: number;
  by: string;
  at: string;
}

export const CATEGORY_LIST = [...CATEGORIES];

/* ------------------------------------------------------------------ *
 * Human Resources
 * ------------------------------------------------------------------ */

export interface Person {
  id: number;
  name: string;
  role: string;
  department: string;
  site: string;
  email: string;
  status: 'Active' | 'On leave' | 'Onboarding';
  startedAt: string;
  compliance: number; // % of mandatory training completed
}

const FIRST = ['Ana', 'Luis', 'María', 'Carlos', 'Sofía', 'Diego', 'Elena', 'Javier', 'Nora', 'Pablo', 'Irene', 'Tomás', 'Clara', 'Marco', 'Lucía', 'Iván', 'Rita', 'Hugo', 'Vera', 'Andrés'] as const;
const LAST = ['Rivas', 'Moreno', 'Castillo', 'Duarte', 'Peña', 'Salas', 'Ibarra', 'Vargas', 'Cordero', 'Navarro', 'Bustos', 'Quintana', 'Lozano', 'Herrera'] as const;
const DEPARTMENTS = ['Operations', 'Maintenance', 'Quality', 'Logistics', 'Safety', 'Engineering', 'People'] as const;
const ROLES = ['Technician', 'Shift Lead', 'Planner', 'Inspector', 'Coordinator', 'Engineer', 'Supervisor', 'Analyst'] as const;
const SITES = ['Plant North', 'Plant South', 'DC East', 'HQ'] as const;

export const PEOPLE: Person[] = Array.from({ length: 42 }, (_, i) => {
  const name = `${one(FIRST)} ${one(LAST)}`;
  const roll = r();
  return {
    id: i + 1,
    name,
    role: one(ROLES),
    department: one(DEPARTMENTS),
    site: one(SITES),
    email: `${name.toLowerCase().replace(/[^a-z]/g, '.')}@axis.example`,
    status: roll < 0.08 ? 'Onboarding' : roll < 0.2 ? 'On leave' : 'Active',
    startedAt: daysAgo(between(20, 2400)),
    compliance: between(38, 100),
  };
});

export const DEPARTMENT_LIST = [...DEPARTMENTS];

/* ------------------------------------------------------------------ *
 * Training
 * ------------------------------------------------------------------ */

export interface Course {
  id: number;
  code: string;
  title: string;
  track: string;
  durationMin: number;
  mandatory: boolean;
  enrolled: number;
  completed: number;
  /** Days until the certification lapses; negative means already expired. */
  expiresInDays: number | null;
}

const TRACKS = ['Safety', 'Equipment', 'Quality', 'Systems', 'Leadership'] as const;
const COURSE_TITLES = [
  'Forklift Operation & Certification',
  'Lockout / Tagout Fundamentals',
  'Hazardous Materials Handling',
  'Cycle Counting Procedures',
  'Preventive Maintenance Basics',
  'Root Cause Analysis',
  'Warehouse Management System',
  'Confined Space Entry',
  'Quality Inspection Standards',
  'Shift Handover & Communication',
  'Ergonomics on the Floor',
  'Incident Reporting',
] as const;

export const COURSES: Course[] = COURSE_TITLES.map((title, i) => {
  const enrolled = between(12, 42);
  const mandatory = r() < 0.55;
  return {
    id: i + 1,
    code: `TR-${String(100 + i)}`,
    title,
    track: one(TRACKS),
    durationMin: between(2, 16) * 15,
    mandatory,
    enrolled,
    completed: between(Math.floor(enrolled * 0.25), enrolled),
    expiresInDays: mandatory ? between(-20, 300) : null,
  };
});

export const TRACK_LIST = [...TRACKS];

/* ------------------------------------------------------------------ *
 * Dashboard series
 * ------------------------------------------------------------------ */

export const THROUGHPUT = Array.from({ length: 14 }, (_, i) => ({
  day: new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  receipts: between(40, 160),
  issues: between(35, 150),
}));

export const CATEGORY_VALUE = CATEGORIES.map((c) => ({
  category: c,
  value: ITEMS.filter((i) => i.category === c).reduce((sum, i) => sum + i.onHand * i.unitCost, 0),
}))
  .sort((a, b) => b.value - a.value)
  .slice(0, 6);

export const HEADCOUNT = DEPARTMENTS.map((d) => ({
  department: d,
  people: PEOPLE.filter((p) => p.department === d).length,
}));

export const MOVEMENTS: Movement[] = Array.from({ length: 18 }, (_, i) => {
  const item = ITEMS[between(0, ITEMS.length - 1)]!;
  return {
    id: i + 1,
    sku: item.sku,
    item: item.name,
    type: one(['Receipt', 'Issue', 'Transfer', 'Adjustment', 'Return'] as const),
    qty: between(1, 60),
    by: PEOPLE[between(0, PEOPLE.length - 1)]!.name,
    at: daysAgo(Number((r() * 6).toFixed(3))),
  };
}).sort((a, b) => +new Date(b.at) - +new Date(a.at));
