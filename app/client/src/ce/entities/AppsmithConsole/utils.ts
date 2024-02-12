export const ENTITY_TYPE = {
  ACTION: "ACTION",
  DATASOURCE: "DATASOURCE",
  WIDGET: "WIDGET",
  JSACTION: "JSACTION",
};

type ValueOf<T> = T[keyof T];
export type EntityTypeValue = ValueOf<typeof ENTITY_TYPE>;

export const PLATFORM_ERROR = {
  PLUGIN_EXECUTION: "PLUGIN_EXECUTION",
  JS_FUNCTION_EXECUTION: "JS_FUNCTION_EXECUTION",
};

export type PlatformErrorTypeValue = ValueOf<typeof ENTITY_TYPE>;
