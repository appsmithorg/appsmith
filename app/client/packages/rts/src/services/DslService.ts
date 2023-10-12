import { LATEST_DSL_VERSION, transformDSL } from "@shared/dsl";

export function migrateDSLToLatest(currentDsl) {
  const latestDSL = transformDSL(currentDsl);
  return latestDSL;
}

export const latestDSLVersion = LATEST_DSL_VERSION;
