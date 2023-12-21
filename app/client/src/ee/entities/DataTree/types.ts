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

export enum CreateNewActionKey {
  PAGE = "pageId",
  WORKFLOW = "workflowId",
  MODULE = "moduleId",
}

export enum ActionContextType {
  PAGE = "PAGE",
  WORKFLOW = "WORKFLOW",
  MODULE = "MODULE",
}

export const ENTITY_TYPE = {
  ...CE_ENTITY_TYPE,
  MODULE_INSTANCE: "MODULE_INSTANCE",
  MODULE_INPUT: "MODULE_INPUT",
} as const;

type ValueOf<T> = T[keyof T];
export type EntityTypeValue = ValueOf<typeof ENTITY_TYPE>;

export interface ModuleInputsConfig extends EntityConfig {
  ENTITY_TYPE: typeof ENTITY_TYPE.MODULE_INPUT;
  dynamicBindingPathList: DynamicPath[];
  bindingPaths: Record<string, EvaluationSubstitutionType>;
  reactivePaths: Record<string, EvaluationSubstitutionType>;
  name: string;
}

export interface ModuleInputsEntity {
  ENTITY_TYPE: typeof ENTITY_TYPE.MODULE_INPUT;
  [propName: string]: unknown;
}
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
}

export interface QueryModuleInstanceEntityConfig
  extends ModuleInstanceEntityConfig {
  type: MODULE_TYPE.QUERY;
}

export interface JSModuleInstanceEntityConfig
  extends ModuleInstanceEntityConfig {
  type: MODULE_TYPE.JS;
  variables: Array<string>;
  publicEntityName: string;
  meta: Record<string, MetaArgs>;
}

export interface ModuleInstanceEntity {
  ENTITY_TYPE: typeof ENTITY_TYPE.MODULE_INSTANCE;
  type: MODULE_TYPE;
  actionId: string;
  moduleId: string;
  moduleInstanceId: string;
  inputs: Record<string, string>;
}

export interface QueryModuleInstanceEntity extends ModuleInstanceEntity {
  type: MODULE_TYPE.QUERY;
  isLoading: boolean;
  data: unknown;
  run: ActionDispatcher | Record<string, unknown>;
  clear: ActionDispatcher | Record<string, unknown>;
}

export interface JSModuleInstanceEntity extends ModuleInstanceEntity {
  ENTITY_TYPE: typeof ENTITY_TYPE.MODULE_INSTANCE;
  type: MODULE_TYPE.JS;
  [propName: string]: any;
}

export type EE_DataTreeEntityObject = ModuleInputsEntity | ModuleInstanceEntity;

export type DataTreeEntityObject =
  | CE_DataTreeEntityObject
  | EE_DataTreeEntityObject;

export type UnEvalTreeEntityObject =
  | CE_UnEvalTreeEntityObject
  | EE_DataTreeEntityObject;

export type EE_DataTreeEntityConfig =
  | ModuleInputsConfig
  | ModuleInstanceEntityConfig;

export type DataTreeEntityConfig =
  | CE_DataTreeEntityConfig
  | EE_DataTreeEntityConfig;

export interface DataTreeSeed extends CE_DataTreeSeed {
  moduleInstances: ModuleInstanceReducerState;
  moduleInstanceEntities: ModuleInstanceEntitiesReducerState;
}
