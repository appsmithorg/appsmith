import type { ActionEntity } from "@appsmith/entities/DataTree/types";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import { isAction } from "@appsmith/workers/Evaluation/evaluationUtils";

export function isRunNClearFnQualifierEntity(
  entity: DataTreeEntity,
): entity is ActionEntity {
  return isAction(entity);
}
