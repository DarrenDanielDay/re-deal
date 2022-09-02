export type Revoker = () => void;
/**
 * @internal
 */
const queue = <T extends unknown>() => {
  /**
   * Linked list node.
   */
  interface Node {
    /**
     * Short for `previous`.
     */
    p: Node | 0;
    /**
     * Short for `next`.
     */
    n: Node | 0;
    /**
     * Short for `value`.
     */
    v: T;
    /**
     * Indecates whether the node is freed.
     */
    f?: 1;
  }
  type Ptr = Node | 0;
  let front: Ptr = 0,
    back: Ptr = 0;
  const a = (value: T): Revoker => {
    const newNode: Node = { p: 0, n: 0, v: value };
    if (!front || !back) {
      back = front = newNode;
    } else {
      back.n = newNode;
      newNode.p = back;
      back = newNode;
    }
    return () => remove(newNode);
  };
  const remove = (node: Node) => {
    if (node.f) {
      return;
    }
    node.f = 1;
    const { p, n } = node;
    if (p) {
      p.n = n;
    } else {
      front = n;
    }
    if (n) {
      n.p = p;
    } else {
      back = p;
    }
  };
  return {
    a,
    *[Symbol.iterator]() {
      for (let ptr = front; ptr; ptr = ptr.n) {
        yield ptr.v;
      }
    },
  };
};
export type ObjectLike = Record<PropertyKey, unknown>;
export type Reducer<T> = (prev: T) => T;
export type NextStore<T> = T | Reducer<T>;
export type Subscriber<T> = (latest: T) => void;
export type Initializer<T extends ObjectLike> = T | (() => T);
/**
 * This structure should not be extended.
 * So it's a `type`, not `interface`.
 */
export type Store<T extends ObjectLike> = {
  /**
   * Fetch current store.
   */
  fetch(this: void): T;
  /**
   * Add store changes to staged and return the latest staged.
   * @param nextStore next state or reducer
   */
  add(this: void, nextStore: NextStore<T>): T;
  /**
   * Commit changes to store.
   */
  commit(this: void): void;
  /**
   * Push change to subscribers.
   */
  push(this: void): void;
  /**
   * Add subscriber of push action.
   * @param subscriber subscribe function
   */
  subscribe(this: void, subscriber: Subscriber<T>): Revoker;
};

export const store = <T extends ObjectLike>(init: Initializer<T>) => {
  let state: T = typeof init === "function" ? init() : init;
  const fetch = () => state;
  let staged: T = state;
  const add = (nextState: NextStore<T>) => (staged = typeof nextState === "function" ? nextState(staged) : nextState);
  const commit = () => {
    state = staged;
  };
  const push = () => {
    for (const subscriber of subscribers) {
      try {
        subscriber(state);
      } catch (error) {
        console.error(error);
      }
    }
  };
  const subscribers = queue<Subscriber<T>>();
  const subscribe = (subscriber: Subscriber<T>) => subscribers.a(subscriber);
  const storeObject: Store<T> = {
    fetch,
    add,
    commit,
    push,
    subscribe,
  };
  return storeObject;
};
