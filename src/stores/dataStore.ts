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

  addItem: (draft: Omit<Item, 'id' | 'updatedAt'>) => Item;
  updateItem: (id: number, patch: Partial<Item>) => void;
  removeItem: (id: number) => void;
  restoreItem: (id: number) => void;
  commitItem: (id: number) => void;

  addPerson: (draft: Omit<Person, 'id' | 'startedAt'>) => Person;
  addCourse: (draft: Omit<Course, 'id' | 'completed'>) => Course;
}

/** Ids come from a counter, never from `array.length` — that repeats after a delete. */
let nextId = Math.max(...ITEMS.map((i) => i.id), ...PEOPLE.map((p) => p.id), ...COURSES.map((c) => c.id)) + 1;

export const useData = create<DataState>((set) => ({
  items: [...ITEMS],
  people: [...PEOPLE],
  courses: [...COURSES],
  parkedItems: {},

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
      const index = s.items.findIndex((i) => i.id === id);
      if (index < 0) return s;
      return {
        items: s.items.filter((i) => i.id !== id),
        parkedItems: { ...s.parkedItems, [id]: { record: s.items[index]!, index } },
      };
    }),

  restoreItem: (id) =>
    set((s) => {
      const parked = s.parkedItems[id];
      if (!parked) return s;
      const items = [...s.items];
      // Splice back at the ORIGINAL index. Pushing to the end would "restore" the row
      // somewhere the user never had it, which reads as a second mistake.
      items.splice(Math.min(parked.index, items.length), 0, parked.record);
      const { [id]: _, ...rest } = s.parkedItems;
      return { items, parkedItems: rest };
    }),

  commitItem: (id) =>
    set((s) => {
      const { [id]: _, ...rest } = s.parkedItems;
      return { parkedItems: rest };
    }),

  addPerson: (draft) => {
    const person: Person = { ...draft, id: nextId++, startedAt: new Date().toISOString() };
    set((s) => ({ people: [person, ...s.people] }));
    return person;
  },

  addCourse: (draft) => {
    const course: Course = { ...draft, id: nextId++, completed: 0 };
    set((s) => ({ courses: [course, ...s.courses] }));
    return course;
  },
}));
