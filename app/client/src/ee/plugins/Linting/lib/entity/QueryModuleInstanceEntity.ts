import type {
  QueryModuleInstanceEntity as TQueryModuleInstanceEntity,
  QueryModuleInstanceEntityConfig,
} from "@appsmith/entities/DataTree/types";

import type { EntityDiffGenerator } from "plugins/Linting/utils/diffGenerator";
import { ModuleInstanceEntity } from "./ModuleInstanceEntity";

export class QueryModuleInstanceEntity extends ModuleInstanceEntity {
  constructor(
    entity: TQueryModuleInstanceEntity,
    config: QueryModuleInstanceEntityConfig,
    diffGenerator: EntityDiffGenerator,
  ) {
    super(entity, config, diffGenerator);
  }
}
