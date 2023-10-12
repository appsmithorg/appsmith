export { nestDSL, flattenDSL, ROOT_CONTAINER_WIDGET_ID } from "./dsl-transform";

export type {
  NestedDSLWidget,
  NestedDSL,
  FlattenedDSLWidget,
  FlattenedDSL,
  FlattenedDSLEntities,
} from "./dsl-transform";

export { transformDSL, LATEST_DSL_VERSION } from "./migrate";

export type { DSLWidget } from "./migrate/types";
