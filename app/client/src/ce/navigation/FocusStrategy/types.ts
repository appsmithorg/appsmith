import type { FocusEntityInfo } from "navigation/FocusEntity";
import type { FocusEntity } from "navigation/FocusEntity";
import type { FocusElementConfig } from "navigation/FocusElements";
import type { AppsmithLocationState } from "utils/history";

export interface FocusPath {
  key: string;
  entityInfo: FocusEntityInfo;
}

export type FocusElementsConfigList = {
  [key in FocusEntity]?: FocusElementConfig[];
};

export interface FocusStrategy {
  focusElements: FocusElementsConfigList;
  /** based on the route change, what states need to be set in the upcoming route **/
  getEntitiesForSet: (
    previousPath: string,
    currentPath: string,
    state: AppsmithLocationState,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Generator<any, Array<FocusPath>, any>;
  /** based on the route change, what states need to be stored for the previous route **/
  getEntitiesForStore: (
    path: string,
    currentPath: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Generator<any, Array<FocusPath>, any>;
  /** For entities with hierarchy, return the parent entity path for storing its state  **/
  getEntityParentUrl: (
    entityInfo: FocusEntityInfo,
    parentEntity: FocusEntity,
  ) => string;
  /** Get focus history key for the URL */
  getUrlKey: (
    url: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Generator<any, string, any>;
  /** Define a wait (saga) before we start setting states  **/
  waitForPathLoad: (
    currentPath: string,
    previousPath: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Generator<any, void, any>;
}
