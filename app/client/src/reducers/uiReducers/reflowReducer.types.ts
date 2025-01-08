import type { ReflowedSpaceMap } from "../../reflow/reflowTypes";

export interface widgetReflow {
  isReflowing: boolean;
  reflowingWidgets: ReflowedSpaceMap;
}
