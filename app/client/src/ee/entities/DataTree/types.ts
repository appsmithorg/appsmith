export * from "ce/entities/DataTree/types";
import type { MODULE_TYPE } from "ee/constants/ModuleConstants";
import type { EvaluationSubstitutionType } from "ce/entities/DataTree/types";
import {
  ENTITY_TYPE as CE_ENTITY_TYPE,
  type EntityConfig,
  type MetaArgs,
  type DataTreeEntityObject as CE_DataTreeEntityObject,
  type DataTreeEntityConfig as CE_DataTreeEntityConfig,
  type UnEvalTreeEntityObject as CE_UnEvalTreeEntityObject,
} from "ce/entities/DataTree/types";
import type { DependencyMap, DynamicPath } from "utils/DynamicBindingUtils";
import type { ModuleInstance } from "ee/constants/ModuleInstanceConstants";

export const ENTITY_TYPE = {
  ...CE_ENTITY_TYPE,
  MODULE_INPUT: "MODULE_INPUT",
  MODULE_INSTANCE: "MODULE_INSTANCE",
} as const;

type ValueOf<T> = T[keyof T];
export type EntityTypeValue = ValueOf<typeof ENTITY_TYPE>;

export interface ModuleInstanceEntityConfig extends EntityConfig {
  ENTITY_TYPE: typeof ENTITY_TYPE.MODULE_INSTANCE;
  type: MODULE_TYPE;
  actionId: string;
  moduleId: string;
  moduleInstanceId: string;
  name: string;
  dynamicBindingPathList: DynamicPath[];
  dependencyMap: DependencyMap;
  bindingPaths: Record<string, EvaluationSubstitutionType>;
  reactivePaths: Record<string, EvaluationSubstitutionType>;
  invalids: Array<string>;
  rootModuleInstanceId?: string;
  dynamicTriggerPathList: DynamicPath[];
}
export interface JSModuleInstanceEntityConfig
  extends ModuleInstanceEntityConfig {
  type: MODULE_TYPE.JS;
  variables: Array<string>;
  publicEntityName: string;
  meta: Record<string, MetaArgs>;
  actionNames: Set<string>;
  dynamicTriggerPathList: DynamicPath[];
}

export interface ModuleInstanceEntity {
  ENTITY_TYPE: typeof ENTITY_TYPE.MODULE_INSTANCE;
  type: MODULE_TYPE;
  actionId: string;
  moduleId: string;
  moduleInstanceId: string;
  inputs: Record<string, string | unknown[]>;
  isValid: boolean;
  moduleInputs: ModuleInstance["moduleInputs"];
}

export type EE_DataTreeEntityObject = ModuleInstanceEntity;

export type DataTreeEntityObject =
  | CE_DataTreeEntityObject
  | EE_DataTreeEntityObject;

export type UnEvalTreeEntityObject =
  | CE_UnEvalTreeEntityObject
  | EE_DataTreeEntityObject;

export type EE_DataTreeEntityConfig = ModuleInstanceEntityConfig;

export type DataTreeEntityConfig =
  | CE_DataTreeEntityConfig
  | EE_DataTreeEntityConfig;

// Ankita: check
