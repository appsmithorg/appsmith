import type { FocusStrategy } from "ee/navigation/FocusStrategy/types";
import NoIDEFocusElements from "../FocusElements/NoIDE";
export const NoIDEFocusStrategy: FocusStrategy = {
  focusElements: NoIDEFocusElements,
  *getEntitiesForSet() {
    return [];
  },
  *getEntitiesForStore() {
    return [];
  },
  getEntityParentUrl: function* () {
    return "";
  },
  *waitForPathLoad() {},
};
