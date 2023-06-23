import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import { difference, get, isString } from "lodash";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import type { TEntity } from "Linting/lib/entity";
import { isDynamicEntity } from "Linting/lib/entity";
import { isJSEntity } from "Linting/lib/entity";
import { AppsmithFunctionsWithFields } from "components/editorComponents/ActionCreator/constants";
import type { TEntityTree } from "./entityTree";
import { entityFns } from "workers/Evaluation/fns";
import { parsedJSCache } from "./parseJSEntity";
import { PathUtils } from "./pathUtils";
import type DependencyMap from "entities/DependencyMap";

const noResponse = {
  asyncJSFunctionsInPath: [],
  removedAsyncJSFunctionsInPath: [],
};

function handlePathUpdate({
  dependencyMap,
  entityTree,
  fullPath,
  previousReferencesInPath,
  referencesInPath,
}: {
  fullPath: string;
  referencesInPath: string[];
  previousReferencesInPath: string[];
  entityTree: TEntityTree;
  dependencyMap: DependencyMap;
}) {
  const { entityName } = getEntityNameAndPropertyPath(fullPath);
  const entity = entityTree[entityName];
  if (!entity || !isDynamicEntity(entity)) return noResponse;
  if (
    isJSEntity(entity) &&
    isAsyncJSFunction(fullPath, entityTree, dependencyMap)
  ) {
    return {
      asyncJSFunctionsInPath: [fullPath],
      removedAsyncJSFunctionsInPath: [],
    };
  }
  // Only datafields can cause updates
  if (!PathUtils.isDataPath(fullPath, entity)) return noResponse;
  const asyncJSFunctionsInvokedInPath = getJSActionInvocationsInPath(
    entity,
    referencesInPath,
    fullPath,
    entityTree,
    dependencyMap,
  );

  const asyncFunctionsInPreviousReferences = previousReferencesInPath.filter(
    (reference) => isAsyncJSFunction(reference, entityTree, dependencyMap),
  );

  const removedAsyncFunctionsInPath = difference(
    asyncFunctionsInPreviousReferences,
    asyncJSFunctionsInvokedInPath,
  );

  return {
    asyncJSFunctionsInPath: asyncJSFunctionsInvokedInPath,
    removedAsyncJSFunctionsInPath: removedAsyncFunctionsInPath,
  };
}

function handlePathDeletion({
  dependencyMap,
  entityTree,
  fullPath: deletedPath,
  previousReferencesInPath,
}: {
  fullPath: string;
  previousReferencesInPath: string[];
  entityTree: TEntityTree;
  dependencyMap: DependencyMap;
}) {
  const removedAsyncFunctionsInPath = new Set<string>();
  const { entityName } = getEntityNameAndPropertyPath(deletedPath);
  const entity = entityTree[entityName];
  if (!entity) return noResponse;

  for (const reference of previousReferencesInPath) {
    const isAsyncFunction = isAsyncJSFunction(
      reference,
      entityTree,
      dependencyMap,
    );
    if (!isAsyncFunction) continue;
    removedAsyncFunctionsInPath.add(reference);
  }
  return {
    asyncJSFunctionsInPath: [],
    removedAsyncJSFunctionsInPath: removedAsyncFunctionsInPath,
  };
}

function getJSActionInvocationsInPath(
  entity: TEntity,
  dependencies: string[],
  fullPath: string,
  entityTree: TEntityTree,
  dependencyMap: DependencyMap,
) {
  const invokedAsyncJSFunctions = new Set<string>();
  const { propertyPath } = getEntityNameAndPropertyPath(fullPath);
  const unevalPropValue = get(entity.getRawEntity(), propertyPath);

  dependencies.forEach((dependant) => {
    if (
      isAsyncJSFunction(dependant, entityTree, dependencyMap) &&
      isFunctionInvoked(dependant, unevalPropValue)
    ) {
      invokedAsyncJSFunctions.add(dependant);
    }
  });

  return Array.from(invokedAsyncJSFunctions);
}

function getFunctionInvocationRegex(funcName: string) {
  return new RegExp(`${funcName}[.call | .apply]*\s*\\(.*?\\)`, "g");
}

export function isFunctionInvoked(
  functionName: string,
  unevalPropValue: unknown,
) {
  if (!isString(unevalPropValue)) return false;
  const { jsSnippets } = getDynamicBindings(unevalPropValue);
  for (const jsSnippet of jsSnippets) {
    if (!jsSnippet.includes(functionName)) continue;
    const isInvoked = getFunctionInvocationRegex(functionName).test(jsSnippet);
    if (isInvoked) return true;
  }
  return false;
}

export function isAsyncJSFunction(
  jsFnFullname: string,
  entityTree: TEntityTree,
  dependencyMap: DependencyMap,
) {
  const { entityName: jsObjectName, propertyPath } =
    getEntityNameAndPropertyPath(jsFnFullname);
  const parsedJSEntity = parsedJSCache[jsObjectName];
  if (!parsedJSEntity) return false;
  const config = parsedJSEntity.parsedEntityConfig;
  const propertyConfig = config[propertyPath];
  if (!propertyConfig) return false;
  return (
    ("isMarkedAsync" in propertyConfig && propertyConfig.isMarkedAsync) ||
    dependencyMap.isRelated(jsFnFullname, AppsmithFunctionsWithFields) ||
    dependencyMap.isRelated(jsFnFullname, getAllEntityActions(entityTree))
  );
}

function getAllEntityActions(entityTree: TEntityTree) {
  const allEntityActions = new Set<string>();
  for (const [entityName, entity] of Object.entries(entityTree)) {
    if (!isDynamicEntity(entity)) continue;
    for (const entityFnDescription of entityFns) {
      if (entityFnDescription.qualifier(entity.getRawEntity())) {
        const fullPath = `${
          entityFnDescription.path ||
          `${entityName}.${entityFnDescription.name}`
        }`;
        allEntityActions.add(fullPath);
      }
    }
  }
  return [...allEntityActions];
}

export default { handlePathUpdate, handlePathDeletion };
