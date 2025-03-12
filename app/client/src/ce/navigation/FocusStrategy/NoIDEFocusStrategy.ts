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
  getEntityParentUrl: (): string => {
    return "";
  },
  getUrlKey: function* (url: string) {
    return url;
  },
  *waitForPathLoad() {},
};
