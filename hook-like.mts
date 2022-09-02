import { type Initializer, type NextStore, type ObjectLike, type Revoker, store } from "./core.mjs";

type Comparator<T> = (a: T, b: T) => boolean;
type Selector<T, R> = (store: T) => R;

/**
 * Default comparator for `useSelector` if no comparator passed
 */
export let comparator = Object.is;

/**
 * Configure default comparator.
 * @param newComparator
 */
export const setComparator = (newComparator: Comparator<unknown>) => {
  comparator = newComparator;
};

type Scheduler = (callback: () => void) => void;
const globalObject = globalThis;
/**
 * Scheduler function for batching.
 */
export let scheduler: Scheduler =
  globalObject.requestIdleCallback || globalObject.requestAnimationFrame || globalObject.setTimeout;

/**
 * Configure the scheduler.
 * @param newScheduler
 */
export const setScheduler = (newScheduler: Scheduler) => {
  scheduler = newScheduler;
};

export interface StoreHooks<T extends ObjectLike> {
  /**
   * Returns the complete stored value.
   */
  useStore: (this: void) => T;
  /**
   * Returns a dispatcher function that schedules updates.
   */
  useDispatch: (this: void) => (this: void, nextStore: NextStore<T>) => void;
  /**
   * Map current store with given selector and return it.
   * When the whole store gets changed, components depending on this hook will be notified to update
   * only if the selected value changed.
   */
  useSelector: <R>(this: void, selector: Selector<T, R>) => R;
}

/**
 * Create store with JavaScript framework specific connector.
 * @param init init function or value
 * @param connector connect function
 * @returns hooks object
 */
export const createHooks = <T extends ObjectLike>(
  init: Initializer<T>,
  connector: <R>(subscribe: (subscriber: (latest: R) => void) => Revoker, fetch: () => R) => R
): StoreHooks<T> => {
  const internalStore = store(init);
  const useStore = () => connector(internalStore.subscribe, internalStore.fetch);
  let shouldCommit = 0;
  const dispatch = (nextState: NextStore<T>) => {
    internalStore.add(nextState);
    // Automatic batching
    if (!shouldCommit) {
      shouldCommit = 1;
      scheduler(() => {
        if (shouldCommit) {
          shouldCommit = 0;
          internalStore.commit();
          internalStore.push();
        }
      });
    }
  };
  const useDispatch = () => dispatch;
  const useSelector = <R extends unknown>(selector: Selector<T, R>, compare: Comparator<R> = comparator): R => {
    const getSnapshot = () => selector(internalStore.fetch());
    return connector((onStoreChange) => {
      const previous = getSnapshot();
      return internalStore.subscribe((latest) => {
        const selected = selector(latest);
        if (!compare(selected, previous)) {
          onStoreChange(selected);
        }
      });
    }, getSnapshot);
  };
  const createdStore = {
    useStore,
    useDispatch,
    useSelector,
  };
  return createdStore;
};
