import type {
  ModuleInstanceEntity as TModuleInstanceEntity,
  ModuleInstanceEntityConfig,
} from "@appsmith/entities/DataTree/types";
import {
  ENTITY_TYPE,
  type IEntity,
} from "@appsmith/plugins/Linting/lib/entity/types";
import type { Diff } from "deep-diff";
import type { EntityDiffGenerator } from "plugins/Linting/utils/diffGenerator";

export class ModuleInstanceEntity implements IEntity {
  private _entity: TModuleInstanceEntity;
  private _config: ModuleInstanceEntityConfig;
  private _diffGenerator: EntityDiffGenerator;
  constructor(
    entity: TModuleInstanceEntity,
    config: ModuleInstanceEntityConfig,
    diffGenerator: EntityDiffGenerator,
  ) {
    this._entity = entity;
    this._config = config;
    this._diffGenerator = diffGenerator;
  }
  getType() {
    return ENTITY_TYPE.MODULE_INSTANCE;
  }
  getConfig() {
    return this._config;
  }
  getRawEntity() {
    return this._entity;
  }
  getName() {
    return this._config.name;
  }
  getId() {
    return this._config.moduleInstanceId;
  }
  getSubType() {
    return this._entity.type;
  }
  computeDifference(oldEntity?: IEntity): Diff<unknown>[] | undefined {
    return this._diffGenerator.generate(oldEntity, this);
  }
}
