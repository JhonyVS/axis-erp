import { create } from 'zustand';
import { ITEMS, PEOPLE, COURSES, type Item, type Person, type Course } from '@/mock/data';

/**
 * The workspace's mutable data.
 *
 * `src/mock/data.ts` seeds this once; everything afterwards reads and writes HERE. Modules
 * importing the frozen module constant directly is what made "New item" a decoration —
 * a form can validate perfectly and still have nowhere to put its result.
 *
 * Deletes are SOFT. `removeItem` parks the record with its original index so `restoreItem`
 * can put it back exactly where it was, which is what lets the undo toast tell the truth.
 * A real backend would need the same thing: an endpoint that reactivates, not just one
 * that deactivates.
 */

interface Parked<T> {
  record: T;
  index: number;
}

interface DataState {
  items: Item[];
  people: Person[];
  courses: Course[];

  /** Records removed but not yet committed, keyed by id. */
  parkedItems: Record<number, Parked<Item>>;
  parkedPeople: Record<number, Parked<Person>>;
  parkedCourses: Record<number, Parked<Course>>;

  addItem: (draft: Omit<Item, 'id' | 'updatedAt'>) => Item;
  updateItem: (id: number, patch: Partial<Item>) => void;
  removeItem: (id: number) => void;
  restoreItem: (id: number) => void;
  commitItem: (id: number) => void;

  addPerson: (draft: Omit<Person, 'id' | 'startedAt'>) => Person;
  updatePerson: (id: number, patch: Partial<Person>) => void;
  removePerson: (id: number) => void;
  restorePerson: (id: number) => void;
  commitPerson: (id: number) => void;

  addCourse: (draft: Omit<Course, 'id' | 'completed'>) => Course;
  updateCourse: (id: number, patch: Partial<Course>) => void;
  removeCourse: (id: number) => void;
  restoreCourse: (id: number) => void;
  commitCourse: (id: number) => void;
}

/**
 * The park / restore / commit dance is identical for all three collections, so it is
 * written once as pure functions over the (list, parked) pair. Three hand-rolled copies
 * is three chances to splice a restored record back at the wrong index — and that bug is
 * invisible until someone actually undoes.
 */
function softRemove<T extends { id: number }>(list: T[], parked: Record<number, Parked<T>>, id: number) {
  const index = list.findIndex((r) => r.id === id);
  if (index < 0) return { list, parked };
  return {
    list: list.filter((r) => r.id !== id),
    parked: { ...parked, [id]: { record: list[index]!, index } },
  };
}

function softRestore<T extends { id: number }>(list: T[], parked: Record<number, Parked<T>>, id: number) {
  const entry = parked[id];
  if (!entry) return { list, parked };
  const next = [...list];
  // Splice back at the ORIGINAL index. Appending would "restore" the row somewhere the
  // user never had it, which reads as a second mistake rather than an undo.
  next.splice(Math.min(entry.index, next.length), 0, entry.record);
  const { [id]: _dropped, ...rest } = parked;
  return { list: next, parked: rest };
}

function softCommit<T>(parked: Record<number, Parked<T>>, id: number) {
  const { [id]: _dropped, ...rest } = parked;
  return rest;
}

/** Ids come from a counter, never from `array.length` — that repeats after a delete. */
let nextId = Math.max(...ITEMS.map((i) => i.id), ...PEOPLE.map((p) => p.id), ...COURSES.map((c) => c.id)) + 1;

export const useData = create<DataState>((set) => ({
  items: [...ITEMS],
  people: [...PEOPLE],
  courses: [...COURSES],
  parkedItems: {},
  parkedPeople: {},
  parkedCourses: {},

  addItem: (draft) => {
    const item: Item = { ...draft, id: nextId++, updatedAt: new Date().toISOString() };
    // Newest first: a user who just created something expects to see it, not to hunt
    // for it in a name-sorted list of sixty.
    set((s) => ({ items: [item, ...s.items] }));
    return item;
  },

  updateItem: (id, patch) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: new Date().toISOString() } : i)),
    })),

  removeItem: (id) =>
    set((s) => {
      const r = softRemove(s.items, s.parkedItems, id);
      return { items: r.list, parkedItems: r.parked };
    }),
  restoreItem: (id) =>
    set((s) => {
      const r = softRestore(s.items, s.parkedItems, id);
      return { items: r.list, parkedItems: r.parked };
    }),
  commitItem: (id) => set((s) => ({ parkedItems: softCommit(s.parkedItems, id) })),

  addPerson: (draft) => {
    const person: Person = { ...draft, id: nextId++, startedAt: new Date().toISOString() };
    set((s) => ({ people: [person, ...s.people] }));
    return person;
  },
  updatePerson: (id, patch) =>
    set((s) => ({ people: s.people.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
  removePerson: (id) =>
    set((s) => {
      const r = softRemove(s.people, s.parkedPeople, id);
      return { people: r.list, parkedPeople: r.parked };
    }),
  restorePerson: (id) =>
    set((s) => {
      const r = softRestore(s.people, s.parkedPeople, id);
      return { people: r.list, parkedPeople: r.parked };
    }),
  commitPerson: (id) => set((s) => ({ parkedPeople: softCommit(s.parkedPeople, id) })),

  addCourse: (draft) => {
    const course: Course = { ...draft, id: nextId++, completed: 0 };
    set((s) => ({ courses: [course, ...s.courses] }));
    return course;
  },
  updateCourse: (id, patch) =>
    set((s) => ({ courses: s.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
  removeCourse: (id) =>
    set((s) => {
      const r = softRemove(s.courses, s.parkedCourses, id);
      return { courses: r.list, parkedCourses: r.parked };
    }),
  restoreCourse: (id) =>
    set((s) => {
      const r = softRestore(s.courses, s.parkedCourses, id);
      return { courses: r.list, parkedCourses: r.parked };
    }),
  commitCourse: (id) => set((s) => ({ parkedCourses: softCommit(s.parkedCourses, id) })),
}));
