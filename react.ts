import React from "react";
import type { Initializer, ObjectLike } from "./core";
import { createHooks } from "./hook-like";

export const createStore = <T extends ObjectLike>(init: Initializer<T>) =>
  createHooks(init, (subscribe, getSnapshot) => React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot));
