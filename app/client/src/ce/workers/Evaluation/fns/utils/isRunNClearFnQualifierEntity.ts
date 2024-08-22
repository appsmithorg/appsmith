import type { ActionEntity } from "ee/entities/DataTree/types";
import { isAction } from "ee/workers/Evaluation/evaluationUtils";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";

export function isRunNClearFnQualifierEntity(
  entity: DataTreeEntity,
): entity is ActionEntity {
  return isAction(entity);
}
