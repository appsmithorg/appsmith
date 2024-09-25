import { isJSAction, isWidget } from "ee/workers/Evaluation/evaluationUtils";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import type { DataTreeEntityConfig } from "ee/entities/DataTree/types";

export default function isLintErrorLoggingEnabledForEntity(
  entity: DataTreeEntity,
  propertyPath: string,
  config: DataTreeEntityConfig,
) {
  if (isJSAction(entity)) {
    return true;
  }

  if (isWidget(entity)) {
    return !(propertyPath in config.reactivePaths);
  }
}
