import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import { isDataTreeEntity } from "@appsmith/workers/Evaluation/evaluationUtils";
import { getEntityFunctions } from "@appsmith/workers/Evaluation/fns";
import setters from "workers/Evaluation/setters";

export default function isEntityFunction(
  entity: unknown,
  propertyName: string,
  entityName: string,
) {
  if (!isDataTreeEntity(entity)) return false;

  if (setters.has(entityName, propertyName)) return true;

  const entityFns = getEntityFunctions();

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
