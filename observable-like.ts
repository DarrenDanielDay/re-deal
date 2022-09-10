import { Observable, type TeardownLogic } from "rxjs";
import { type Initializer, type NextStore, type ObjectLike, store, Store } from "./core";

export interface StoreObservables<T extends ObjectLike> {
  flow$: Observable<T>;
  dispatch: (this: void, nextStore: NextStore<T>, message?: string) => {};
  store: Store<T>;
}

export const createObservables = <T extends ObjectLike>(init: Initializer<T>): StoreObservables<T> => {
  const internalStore = store(init);
  const { fetch, dispatch, subscribe } = internalStore;
  const flow$ = new Observable<T>((subscriber) => {
    const teardownLogic: TeardownLogic = subscribe((latest) => subscriber.next(latest));
    subscriber.next(fetch());
    return teardownLogic;
  });
  return {
    store: internalStore,
    flow$,
    dispatch,
  };
};
