import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import type { DataTreeEntityConfig } from "../DataTree/types";
import type { TriggerMeta } from "../../sagas/ActionExecution/ActionExecutionSagas";
import type { SourceEntity } from "../../../entities/AppsmithConsole";

export enum ENTITY_TYPE {
  ACTION = "ACTION",
  DATASOURCE = "DATASOURCE",
  WIDGET = "WIDGET",
  JSACTION = "JSACTION",
}

export enum PLATFORM_ERROR {
  PLUGIN_EXECUTION = "PLUGIN_EXECUTION",
  JS_FUNCTION_EXECUTION = "JS_FUNCTION_EXECUTION",
}

// export type PlatformErrorTypeValue = ValueOf<typeof PLATFORM_ERROR>;

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

export const getSourceFromTriggerMeta = (
  triggerMeta?: TriggerMeta,
): SourceEntity => {
  const type =
    (triggerMeta?.source?.entityType as ENTITY_TYPE) || ENTITY_TYPE.JSACTION;
  const name =
    triggerMeta?.source?.name || triggerMeta?.triggerPropertyName || "";
  const propertyPath = triggerMeta?.triggerPropertyName || "";
  const id = triggerMeta?.source?.id || "";

  return { type, name, id, propertyPath };
};
