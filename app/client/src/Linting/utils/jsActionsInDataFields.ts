import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import { get, isString } from "lodash";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import type { TEntity } from "Linting/lib/entity";
import { isDynamicEntity } from "Linting/lib/entity";
import { isJSEntity } from "Linting/lib/entity";
import { AppsmithFunctionsWithFields } from "components/editorComponents/ActionCreator/constants";
import type { TEntityTree } from "./entityTree";
import { getUnevalEntityTree } from "./entityTree";
import DependencyMap from "entities/DependencyMap";
import { getAllPathsFromNode } from "./entityPath";
import { lintingDependencyMap } from "./lintingDependencyMap";
import { entityFns } from "workers/Evaluation/fns";
import { parsedJSCache } from "./parseJSEntity";
import { PathUtils } from "./pathUtils";

export enum UPDATE_TYPE {
  ADD = "ADD",
  DELETE = "DELETE",
  EDIT = "EDIT",
}
let jsActionsInDataFields: DependencyMap | undefined = undefined;

export function getJSActionsInDataFields() {
  const inverseMap: Map<string, string> =
    jsActionsInDataFields?.getDependenciesInverse() || new Map();
  const map: Record<string, string[]> = {};
  for (const [jsfn, boundDataFields] of inverseMap.entries()) {
    map[jsfn] = [...boundDataFields];
  }
  return map;
}

export function initializeJSActionsInDataFields() {
  jsActionsInDataFields = new DependencyMap();
}
function handlePathUpdate(
  fullPath: string,
  referencesInPath: string[],
  entityTree: TEntityTree,
) {
  if (!jsActionsInDataFields) return [];

  const { entityName } = getEntityNameAndPropertyPath(fullPath);
  const entity = entityTree[entityName];
  // Only datafields can cause updates
  if (!entity || !PathUtils.isDataPath(fullPath, entity)) return [];

  const asyncJSFunctionsInvokedInPath = getJSActionInvocationsInPath(
    entity,
    referencesInPath,
    fullPath,
    entityTree,
  );
  const pathsToAdd = asyncJSFunctionsInvokedInPath.reduce(
    (paths: Record<string, true>, currentPath) => {
      return { ...paths, [currentPath]: true } as const;
    },
    { [fullPath]: true } as Record<string, true>,
  );
  jsActionsInDataFields.addNodes(pathsToAdd);

  const currentNodeDependencies = [
    ...(jsActionsInDataFields.getDependencies().get(fullPath) || []),
  ];

  const updatedDependencies = asyncJSFunctionsInvokedInPath
    .filter((x) => !currentNodeDependencies.includes(x))
    .concat(
      currentNodeDependencies.filter(
        (x) => !asyncJSFunctionsInvokedInPath.includes(x),
      ),
    );
  jsActionsInDataFields.addDependency(fullPath, asyncJSFunctionsInvokedInPath);
  return updatedDependencies;
}

function handlePathDeletion(deletedPath: string, entityTree: TEntityTree) {
  if (!jsActionsInDataFields) return [];
  const updatedJSFns = new Set<string>();
  const { entityName } = getEntityNameAndPropertyPath(deletedPath);
  const entity = entityTree[entityName];
  if (!entity) return [];

  const allDeletedPaths = getAllPathsFromNode(
    deletedPath,
    getUnevalEntityTree(entityTree),
  );

  for (const path of Object.keys(allDeletedPaths)) {
    const pathDependencies = jsActionsInDataFields.getDependencies().get(path);
    if (!pathDependencies) continue;
    pathDependencies.forEach((funcName) => updatedJSFns.add(funcName));
  }
  jsActionsInDataFields.removeNodes(allDeletedPaths);

  return Array.from(updatedJSFns);
}

function handlePathEdit(
  editedPath: string,
  dependenciesInPath: string[],
  entityTree: TEntityTree,
) {
  if (!jsActionsInDataFields) return [];
  let updatedJSFns: string[] = [];
  const { entityName } = getEntityNameAndPropertyPath(editedPath);
  const entity = entityTree[entityName];
  if (!entity) return [];

  if (isJSEntity(entity)) {
    if (isAsyncJSFunction(editedPath, entityTree)) {
      jsActionsInDataFields.addNodes({ [editedPath]: true });
      const dependentPaths =
        lintingDependencyMap.getIncomingDependencies(editedPath);
      for (const dependentPath of dependentPaths) {
        const updatedPaths = handlePathUpdate(
          dependentPath,
          [
            ...(lintingDependencyMap.getDependencies().get(dependentPath) ||
              []),
          ],
          entityTree,
        );
        updatedJSFns = [...updatedJSFns, ...updatedPaths];
      }
    } else {
      jsActionsInDataFields.removeNodes({ [editedPath]: true });
    }
  } else {
    const updatedPaths = handlePathUpdate(
      editedPath,
      dependenciesInPath,
      entityTree,
    );
    updatedJSFns = [...updatedJSFns, ...updatedPaths];
  }
  return updatedJSFns;
}

function getJSActionInvocationsInPath(
  entity: TEntity,
  dependencies: string[],
  fullPath: string,
  entityTree: TEntityTree,
) {
  const invokedAsyncJSFunctions = new Set<string>();
  const { propertyPath } = getEntityNameAndPropertyPath(fullPath);
  const unevalPropValue = get(entity.getRawEntity(), propertyPath);

  dependencies.forEach((dependant) => {
    if (
      isAsyncJSFunction(dependant, entityTree) &&
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
    lintingDependencyMap.isRelated(jsFnFullname, AppsmithFunctionsWithFields) ||
    lintingDependencyMap.isRelated(
      jsFnFullname,
      getAllEntityActions(entityTree),
    )
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

export function updateJSActionsInDataFields(
  fullPath: string,
  dependenciesInPath: string[],
  entityTree: TEntityTree,
  updateType: UPDATE_TYPE,
) {
  switch (updateType) {
    case UPDATE_TYPE.ADD: {
      return handlePathUpdate(fullPath, dependenciesInPath, entityTree);
    }
    case UPDATE_TYPE.EDIT: {
      return handlePathEdit(fullPath, dependenciesInPath, entityTree);
    }
    case UPDATE_TYPE.DELETE: {
      return handlePathDeletion(fullPath, entityTree);
    }
  }
}
