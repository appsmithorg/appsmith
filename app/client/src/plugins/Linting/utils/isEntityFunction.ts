import type { DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import { isDataTreeEntity } from "@appsmith/workers/Evaluation/evaluationUtils";
import { entityFns } from "@appsmith/workers/Evaluation/fns";

export default function isEntityFunction(
  entity: unknown,
  propertyName: string,
) {
  if (!isDataTreeEntity(entity)) return false;
  return entityFns.find((entityFn) => {
    const entityFnpropertyName = entityFn.path
      ? entityFn.path.split(".")[1]
      : entityFn.name;
    return (
      entityFnpropertyName === propertyName &&
      entityFn.qualifier(entity as DataTreeEntity)
    );
  });
}
