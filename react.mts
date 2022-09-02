import React from "react";
import type { Initializer, ObjectLike } from "./core.mjs";
import { createHooks } from "./hook-like.mjs";

export const createReactStore = <T extends ObjectLike>(init: Initializer<T>) =>
  createHooks(init, (subscribe, getSnapshot) => React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot));
