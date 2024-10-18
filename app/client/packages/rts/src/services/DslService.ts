import { LATEST_DSL_VERSION, migrateDSL } from "@shared/dsl";

export async function migrateDSLToLatest(currentDsl) {
  const latestDSL = await migrateDSL(currentDsl);

  return latestDSL;
}

export const latestDSLVersion = LATEST_DSL_VERSION;
