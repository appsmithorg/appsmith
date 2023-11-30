import type {
  ModuleInputsEntity as TModuleInputsEntity,
  ModuleInputsConfig,
} from "@appsmith/entities/DataTree/types";
import {
  ENTITY_TYPE,
  type IEntity,
} from "@appsmith/plugins/Linting/lib/entity/types";
import type { Diff } from "deep-diff";
import type { EntityDiffGenerator } from "plugins/Linting/utils/diffGenerator";

export class ModuleInputsEntity implements IEntity {
  private entity: TModuleInputsEntity;
  private config: ModuleInputsConfig;
  private diffGenerator: EntityDiffGenerator;
  constructor(
    entity: TModuleInputsEntity,
    config: ModuleInputsConfig,
    diffGenerator: EntityDiffGenerator,
  ) {
    this.entity = entity;
    this.config = config;
    this.diffGenerator = diffGenerator;
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
  computeDifference(oldEntity?: IEntity): Diff<unknown>[] | undefined {
    return this.diffGenerator.generate(oldEntity, this);
  }
}
