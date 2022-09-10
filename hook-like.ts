import { type Initializer, type NextStore, type ObjectLike, type Revoker, store, Store } from "./core";

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

export interface StoreHooks<T extends ObjectLike> {
  store: Store<T>;
  /**
   * Returns the complete stored value.
   */
  useRead: (this: void) => T;
  /**
   * Returns a dispatcher function that schedules updates.
   */
  useDispatch: (this: void) => (this: void, nextStore: NextStore<T>) => {};
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
  const { fetch, dispatch, subscribe } = internalStore;
  const useRead = () => connector(subscribe, fetch);
  const useDispatch = () => dispatch;
  const useSelector = <R extends unknown>(selector: Selector<T, R>, compare: Comparator<R> = comparator): R => {
    const getSnapshot = () => selector(fetch());
    return connector((onStoreChange) => {
      const previous = getSnapshot();
      return subscribe((latest) => {
        const selected = selector(latest);
        if (!compare(selected, previous)) {
          onStoreChange(selected);
        }
      });
    }, getSnapshot);
  };
  return {
    store: internalStore,
    useRead,
    useDispatch,
    useSelector,
  };
};
