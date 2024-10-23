export { nestDSL, flattenDSL, ROOT_CONTAINER_WIDGET_ID } from "./transform";

export type {
  NestedDSLWidget,
  NestedDSL,
  FlattenedDSLWidget,
  FlattenedDSL,
  FlattenedDSLEntities,
} from "./transform";

export { migrateDSL, LATEST_DSL_VERSION } from "./migrate";

export type { DSLWidget } from "./migrate/types";
export { isDynamicValue } from "./migrate/utils";
