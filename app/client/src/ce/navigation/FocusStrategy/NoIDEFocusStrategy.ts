import type { FocusStrategy } from "../../../sagas/FocusRetentionSaga";

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
