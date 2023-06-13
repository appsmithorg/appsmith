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
import { getParsedJSEntity } from "./parseJSEntity";
import { entityFns } from "workers/Evaluation/fns";

function isDataField(fullPath: string, entityTree: TEntityTree) {
  const { entityName, propertyPath } = getEntityNameAndPropertyPath(fullPath);
  const entity = entityTree[entityName];
  if (!entity) return false;
  const entityConfig = entity.getConfig();
  if (entityConfig && "triggerPaths" in entityConfig) {
    return !(propertyPath in entityConfig.triggerPaths);
  }
  return false;
}
export class JSActionsInDataField {
  private dependencyMap: DependencyMap | undefined = undefined;
  initialize() {
    this.dependencyMap = new DependencyMap();
  }
  update(
    fullPath: string,
    referencesInPath: string[],
    entityTree: TEntityTree,
  ) {
    if (!this.dependencyMap) return [];

    const { entityName } = getEntityNameAndPropertyPath(fullPath);
    const entity = entityTree[entityName];
    // Only datafields can cause updates
    if (!entity || !isDataField(fullPath, entityTree)) return [];

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
    this.dependencyMap.addNodes(pathsToAdd);

    const currentNodeDependencies = [
      ...(this.dependencyMap.getDependencies().get(fullPath) || []),
    ];

    const updatedDependencies = asyncJSFunctionsInvokedInPath
      .filter((x) => !currentNodeDependencies.includes(x))
      .concat(
        currentNodeDependencies.filter(
          (x) => !asyncJSFunctionsInvokedInPath.includes(x),
        ),
      );
    this.dependencyMap.addDependency(fullPath, asyncJSFunctionsInvokedInPath);
    return updatedDependencies;
  }

  handlePathDeletion(deletedPath: string, entityTree: TEntityTree) {
    if (!this.dependencyMap) return [];
    const updatedJSFns = new Set<string>();
    const { entityName } = getEntityNameAndPropertyPath(deletedPath);
    const entity = entityTree[entityName];
    if (!entity) return [];

    const allDeletedPaths = getAllPathsFromNode(
      deletedPath,
      getUnevalEntityTree(entityTree),
    );

    for (const path of Object.keys(allDeletedPaths)) {
      const pathDependencies = this.dependencyMap.getDependencies().get(path);
      if (!pathDependencies) continue;
      pathDependencies.forEach((funcName) => updatedJSFns.add(funcName));
    }
    this.dependencyMap.removeNodes(allDeletedPaths);

    return Array.from(updatedJSFns);
  }
  handlePathEdit(
    editedPath: string,
    dependenciesInPath: string[],
    entityTree: TEntityTree,
  ) {
    if (!this.dependencyMap) return [];
    let updatedJSFns: string[] = [];
    const { entityName } = getEntityNameAndPropertyPath(editedPath);
    const entity = entityTree[entityName];
    if (!entity) return [];

    if (isJSEntity(entity)) {
      if (isAsyncJSFunction(editedPath, entityTree)) {
        this.dependencyMap.addNodes({ [editedPath]: true });
      } else {
        this.dependencyMap.removeNodes({ [editedPath]: true });
      }
    } else {
      const updatedPaths = this.update(
        editedPath,
        dependenciesInPath,
        entityTree,
      );
      updatedJSFns = [...updatedJSFns, ...updatedPaths];
    }
    return updatedJSFns;
  }

  getMap() {
    const inverseMap: Map<string, string> =
      this.dependencyMap?.getDependenciesInverse() || new Map();
    const map: Record<string, string[]> = {};
    for (const [jsfn, boundDataFields] of inverseMap.entries()) {
      map[jsfn] = [...boundDataFields];
    }
    return map;
  }
  clear() {
    this.dependencyMap = undefined;
  }
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
  const parsedJSEntity = getParsedJSEntity(jsObjectName);
  if (!parsedJSEntity) return false;
  const config = parsedJSEntity.getParsedEntityConfig();
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

export const jsActionsInDataField = new JSActionsInDataField();

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
