import { LATEST_DSL_VERSION, migrateDSL } from "@shared/dsl";

export function migrateDSLToLatest(currentDsl) {
  const latestDSL = migrateDSL(currentDsl);

  return latestDSL;
}

export const latestDSLVersion = LATEST_DSL_VERSION;
