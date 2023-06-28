import type { DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import { isDataTreeEntity } from "@appsmith/workers/Evaluation/evaluationUtils";
import { entityFns } from "@appsmith/workers/Evaluation/fns";

export default function isEntityFunction(
  entity: unknown,
  propertyName: string,
) {
  if (!isDataTreeEntity(entity)) return false;
  return entityFns.find(
    (entityFn) =>
      entityFn.name === propertyName &&
      entityFn.qualifier(entity as DataTreeEntity),
  );
}
