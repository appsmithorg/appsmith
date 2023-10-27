export * from "ce/entities/DataTree/types";
import { ENTITY_TYPE as CE_ENTITY_TYPE } from "ce/entities/DataTree/types";
import type { DynamicPath } from "utils/DynamicBindingUtils";
import type {
  DataTreeEntityObject as CE_DataTreeEntityObject,
  DataTreeEntityConfig as CE_DataTreeEntityConfig,
  UnEvalTreeEntityObject as CE_UnEvalTreeEntityObject,
  EvaluationSubstitutionType,
} from "ce/entities/DataTree/types";
import type { EntityConfig } from "ce/entities/DataTree/types";
export enum EE_ENTITY_TYPE {
  MODULE_INPUT = "MODULE_INPUT",
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

export type EE_DataTreeEntityObject = ModuleInputsEntity;

export type DataTreeEntityObject =
  | CE_DataTreeEntityObject
  | EE_DataTreeEntityObject;

export type UnEvalTreeEntityObject =
  | CE_UnEvalTreeEntityObject
  | EE_DataTreeEntityObject;

export type EE_DataTreeEntityConfig = ModuleInputsConfig;

export type DataTreeEntityConfig =
  | CE_DataTreeEntityConfig
  | EE_DataTreeEntityConfig;
