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

export {
  APPSMITH_GLOBAL_FUNCTIONS,
  APPSMITH_NAMESPACED_FUNCTIONS,
  AppsmithFunctionsWithFields,
  addWidgetPropertyDependencies,
  getDependencyFromEntityPath,
  EvaluationSubstitutionType,
  getEntityDependencies,
  JAVASCRIPT_KEYWORDS,
  DEDICATED_WORKER_GLOBAL_SCOPE_IDENTIFIERS,
  EvalErrorTypes,
  RESERVED_KEYWORDS_AND_INDENTIFIERS,
  convertPathToString,
  extractInfoFromBindings,
} from "./dependency";

export type {
  OverrideDependency,
  BindingsInfo,
  EvalError,
} from "./dependency/types";

export {
  getDynamicStringSegments,
  DATA_BIND_REGEX,
  isDynamicValue,
} from "./dynamicBinding";
