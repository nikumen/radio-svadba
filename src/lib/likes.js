// shared "liked tracks" store with change notifications
import { store } from "./util.js";

const set = new Set(store.get("liked", []));
const listeners = new Set();

export const likes = {
  has: (id) => set.has(id),
  toggle(id) {
    set.has(id) ? set.delete(id) : set.add(id);
    store.set("liked", [...set]);
    listeners.forEach((fn) => fn(id, set.has(id)));
    return set.has(id);
  },
  list: () => [...set],
  count: () => set.size,
  onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
