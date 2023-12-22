export * from "ce/plugins/Linting/lib/entity/index";
import CE_EntityFactory from "ce/plugins/Linting/lib/entity";
import { ModuleInputsEntity } from "./ModuleInputsEntity";
import type { IEntity } from "./types";
import type {
  JSModuleInstanceEntityConfig,
  ModuleInputsConfig,
  QueryModuleInstanceEntityConfig,
  ModuleInputsEntity as TModuleInputsEntity,
} from "@appsmith/entities/DataTree/types";
import {
  isModuleInput,
  isQueryModuleInstance,
  isJSModuleInstance,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type { DataTreeEntityConfig } from "@appsmith/entities/DataTree/types";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import type { EntityClassLoader } from "plugins/Linting/lib/entity/EntityTree";
import { JSModuleInstanceEntity } from "./JSModuleInstanceEntity";
import { QueryModuleInstanceEntity } from "./QueryModuleInstanceEntity";

export default class EntityFactory extends CE_EntityFactory {
  static getEntity<
    T extends DataTreeEntity,
    K extends DataTreeEntityConfig | undefined,
  >(entity: T, config: K, classLoader: EntityClassLoader): IEntity {
    const { DiffGenerator, Parser } = classLoader.load(
      entity as DataTreeEntity,
    );

    if (isModuleInput(entity)) {
      return new ModuleInputsEntity(
        entity as TModuleInputsEntity,
        config as ModuleInputsConfig,
        new DiffGenerator(),
      );
    }

    if (isJSModuleInstance(entity)) {
      return new JSModuleInstanceEntity(
        entity,
        config as JSModuleInstanceEntityConfig,
        new Parser(),
        new DiffGenerator(),
      );
    }
    if (isQueryModuleInstance(entity)) {
      return new QueryModuleInstanceEntity(
        entity,
        config as QueryModuleInstanceEntityConfig,
        new DiffGenerator(),
      );
    }

    return super.getEntity(entity, config, classLoader);
  }
}
