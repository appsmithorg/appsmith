import type {
  ModuleInputsEntity as TModuleInputsEntity,
  ModuleInputsConfig,
} from "@appsmith/entities/DataTree/types";
import {
  ENTITY_TYPE,
  type IEntity,
} from "@appsmith/plugins/Linting/lib/entity/types";
import type { Diff } from "deep-diff";

export class ModuleInputsEntity implements IEntity {
  private entity: TModuleInputsEntity;
  private config: ModuleInputsConfig;
  constructor(entity: TModuleInputsEntity, config: ModuleInputsConfig) {
    this.entity = entity;
    this.config = config;
  }
  getType() {
    return ENTITY_TYPE.MODULE_INPUT;
  }
  getConfig() {
    return this.config;
  }
  getRawEntity() {
    return this.entity;
  }
  getName() {
    return "inputs";
  }
  getId() {
    return "inputs";
  }
  computeDifference(): Diff<unknown>[] | undefined {
    return;
  }
}
