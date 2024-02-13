import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import type { DataTreeEntityConfig } from "../DataTree/types";

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

export type PlatformErrorTypeValue = ValueOf<typeof PLATFORM_ERROR>;

export const getModuleInstanceInvalidErrors = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  entity: DataTreeEntity,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  entityConfig: DataTreeEntityConfig,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  propertyPath: string,
) => {
  return [];
};
