import type { FocusStrategy } from "sagas/FocusRetentionSaga";
import NoIDEFocusElements from "../FocusElements/NoIDE";
export const NoIDEFocusStrategy: FocusStrategy = {
  focusElements: NoIDEFocusElements,
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
