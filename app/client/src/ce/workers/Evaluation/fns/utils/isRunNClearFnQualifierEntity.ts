import type { ActionEntity } from "ee/entities/DataTree/types";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import { isAction } from "ee/workers/Evaluation/evaluationUtils";

export function isRunNClearFnQualifierEntity(
  entity: DataTreeEntity,
): entity is ActionEntity {
  return isAction(entity);
}
