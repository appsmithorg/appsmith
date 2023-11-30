export * from "ce/plugins/Linting/lib/entity/index";
import CE_EntityFactory from "ce/plugins/Linting/lib/entity";
import { ModuleInputsEntity } from "./ModuleInputsEntity";
import type { IEntity } from "./types";
import type {
  ModuleInputsConfig,
  ModuleInputsEntity as TModuleInputsEntity,
} from "@appsmith/entities/DataTree/types";
import { isModuleInput } from "@appsmith/workers/Evaluation/evaluationUtils";
import type { DataTreeEntityConfig } from "@appsmith/entities/DataTree/types";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import type { EntityClassLoader } from "plugins/Linting/lib/entity/EntityTree";

export default class EntityFactory extends CE_EntityFactory {
  static getEntity<
    T extends DataTreeEntity,
    K extends DataTreeEntityConfig | undefined,
  >(entity: T, config: K, classLoader: EntityClassLoader): IEntity {
    const { DiffGenerator } = classLoader.load(entity as DataTreeEntity);
    if (isModuleInput(entity)) {
      return new ModuleInputsEntity(
        entity as TModuleInputsEntity,
        config as ModuleInputsConfig,
        new DiffGenerator(),
      );
    }
    return super.getEntity(entity, config, classLoader);
  }
}
