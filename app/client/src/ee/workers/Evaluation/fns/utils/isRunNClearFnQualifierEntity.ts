export * from "ce/workers/Evaluation/fns/utils/isRunNClearFnQualifierEntity";
import type { ActionEntity } from "@appsmith/entities/DataTree/types";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import { isQueryModuleInstance } from "@appsmith/workers/Evaluation/evaluationUtils";
import { isRunNClearFnQualifierEntity as CE_isRunNClearFnQualifierEntity } from "ce/workers/Evaluation/fns/utils/isRunNClearFnQualifierEntity";

export function isRunNClearFnQualifierEntity(
  entity: DataTreeEntity,
): entity is ActionEntity {
  return (
    CE_isRunNClearFnQualifierEntity(entity) || isQueryModuleInstance(entity)
  );
}
