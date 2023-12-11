export * from "ce/entities/DataTree/types";
import { ENTITY_TYPE as CE_ENTITY_TYPE } from "ce/entities/DataTree/types";
import type { DependencyMap, DynamicPath } from "utils/DynamicBindingUtils";
import type {
  DataTreeEntityObject as CE_DataTreeEntityObject,
  DataTreeEntityConfig as CE_DataTreeEntityConfig,
  UnEvalTreeEntityObject as CE_UnEvalTreeEntityObject,
  EvaluationSubstitutionType,
  DataTreeSeed as CE_DataTreeSeed,
  ActionDispatcher,
  MetaArgs,
} from "ce/entities/DataTree/types";
import type { EntityConfig } from "ce/entities/DataTree/types";
import type { ModuleInstanceReducerState } from "@appsmith/reducers/entityReducers/moduleInstancesReducer";
import type { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import type { ModuleInstanceEntitiesReducerState } from "@appsmith/reducers/entityReducers/moduleInstanceEntitiesReducer";
export enum EE_ENTITY_TYPE {
  MODULE_INPUT = "MODULE_INPUT",
  MODULE_INSTANCE = "MODULE_INSTANCE",
}

export type ENTITY_TYPE = CE_ENTITY_TYPE | EE_ENTITY_TYPE;

export const ENTITY_TYPE_VALUE = {
  ...CE_ENTITY_TYPE,
  ...EE_ENTITY_TYPE,
};

export interface ModuleInputsConfig extends EntityConfig {
  ENTITY_TYPE: EE_ENTITY_TYPE.MODULE_INPUT;
  dynamicBindingPathList: DynamicPath[];
  bindingPaths: Record<string, EvaluationSubstitutionType>;
  reactivePaths: Record<string, EvaluationSubstitutionType>;
  name: string;
}

export interface ModuleInputsEntity {
  ENTITY_TYPE: EE_ENTITY_TYPE.MODULE_INPUT;
  [propName: string]: unknown;
}
export interface QueryModuleInstanceEntityConfig extends EntityConfig {
  ENTITY_TYPE: EE_ENTITY_TYPE.MODULE_INSTANCE;
  type: MODULE_TYPE.QUERY;
  actionId: string;
  moduleId: string;
  moduleInstanceId: string;
  name: string;
  dynamicBindingPathList: DynamicPath[];
  dependencyMap: DependencyMap;
  bindingPaths: Record<string, EvaluationSubstitutionType>;
  reactivePaths: Record<string, EvaluationSubstitutionType>;
}

export interface JSModuleInstanceEntityConfig extends EntityConfig {
  ENTITY_TYPE: EE_ENTITY_TYPE.MODULE_INSTANCE;
  type: MODULE_TYPE.JS;
  moduleId: string;
  dynamicBindingPathList: DynamicPath[];
  moduleInstanceId: string;
  bindingPaths: Record<string, EvaluationSubstitutionType>;
  reactivePaths: Record<string, EvaluationSubstitutionType>;
  variables: Array<string>;
  dependencyMap: DependencyMap;
  name: string;
  actionId: string;
  publicEntityName: string;
  meta: Record<string, MetaArgs>;
}

export interface QueryModuleInstanceEntity {
  ENTITY_TYPE: EE_ENTITY_TYPE.MODULE_INSTANCE;
  type: MODULE_TYPE.QUERY;
  actionId: string;
  moduleId: string;
  moduleInstanceId: string;
  isLoading: boolean;
  data: unknown;
  run: ActionDispatcher | Record<string, unknown>;
  clear: ActionDispatcher | Record<string, unknown>;
  inputs: Record<string, string>;
}

export interface JSModuleInstanceEntity {
  ENTITY_TYPE: EE_ENTITY_TYPE.MODULE_INSTANCE;
  type: MODULE_TYPE.JS;
  actionId: string;
  moduleId: string;
  moduleInstanceId: string;
  [propName: string]: any;
  inputs: Record<string, string>;
}

export type EE_DataTreeEntityObject =
  | ModuleInputsEntity
  | QueryModuleInstanceEntity
  | JSModuleInstanceEntity;

export type DataTreeEntityObject =
  | CE_DataTreeEntityObject
  | EE_DataTreeEntityObject;

export type UnEvalTreeEntityObject =
  | CE_UnEvalTreeEntityObject
  | EE_DataTreeEntityObject;

export type EE_DataTreeEntityConfig =
  | ModuleInputsConfig
  | QueryModuleInstanceEntityConfig
  | JSModuleInstanceEntityConfig;

export type DataTreeEntityConfig =
  | CE_DataTreeEntityConfig
  | EE_DataTreeEntityConfig;

export interface DataTreeSeed extends CE_DataTreeSeed {
  moduleInstances: ModuleInstanceReducerState;
  moduleInstanceEntities: ModuleInstanceEntitiesReducerState;
}
