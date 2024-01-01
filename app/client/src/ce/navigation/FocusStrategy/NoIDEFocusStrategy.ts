import type { FocusStrategy } from "../../../sagas/ContextSwitchingSaga";

export const NoIDEFocusStrategy: FocusStrategy = {
  *getEntitiesForSet() {
    return [];
  },
  *getEntitiesForStore() {
    return [];
  },
  getEntityParentUrl(): string {
    return "";
  },
  *waitForPathLoad() {},
};
