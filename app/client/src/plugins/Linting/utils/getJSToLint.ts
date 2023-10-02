import type { DataTreeEntity } from "@appsmith/entities/DataTree/types";
import { isJSAction } from "@appsmith/workers/Evaluation/evaluationUtils";

// Removes "export default" statement from js Object

export function getJSToLint(
  entity: DataTreeEntity,
  snippet: string,
  propertyPath: string,
): string {
  return entity && isJSAction(entity) && propertyPath === "body"
    ? snippet.replace(/export default/g, "")
    : snippet;
}
