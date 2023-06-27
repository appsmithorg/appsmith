import type { ConfigTree, UnEvalTree } from "entities/DataTree/dataTreeFactory";
import type { TEntityTree } from "../utils/entityTree";
import { getEntityTreeDifferences } from "../utils/entityTree";
import { updateTreeWithParsedJS } from "../utils/entityTree";
import { getUnevalEntityTree } from "../utils/entityTree";
import { createEntityTree } from "../utils/entityTree";
import { intersection, isEmpty, mapValues, uniq } from "lodash";
import {
  convertPathToString,
  getAllPaths,
  getEntityNameAndPropertyPath,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import { AppsmithFunctionsWithFields } from "components/editorComponents/ActionCreator/constants";
import { PathUtils } from "Linting/utils/pathUtils";
import { extractReferencesFromPath } from "Linting/utils/getEntityDependencies";
import { sortDifferencesByType } from "Linting/utils/sortDifferencesByType";
import { getAllPathsFromNode } from "Linting/utils/entityPath";
import type { LintTreeRequestPayload, LintTreeResponse } from "Linting/types";
import { getLintErrorsFromTree } from "Linting/lintTree";
import type { TJSPropertiesState } from "workers/Evaluation/JSObject/jsPropertiesState";
import { parsedJSCache } from "Linting/utils/parseJSEntity";
import jsActionsInDataFields from "Linting/utils/jsActionsInDataFields";
import { isJSEntity } from "Linting/lib/entity";
import DependencyMap from "entities/DependencyMap";
import { LintEntityTree, type EntityTree } from "Linting/lib/entity/EntityTree";

class LintService {
  cachedEntityTree: EntityTree | null;
  lintingDependencyMap: DependencyMap = new DependencyMap();
  constructor() {
    this.cachedEntityTree = null;
    if (isEmpty(this.cachedEntityTree)) {
      this.lintingDependencyMap = new DependencyMap();
      this.lintingDependencyMap.addNodes(
        convertArrayToObject(AppsmithFunctionsWithFields),
      );
    }
  }

  lintTree = (payload: LintTreeRequestPayload) => {
    const {
      cloudHosting,
      configTree,
      forceLinting = false,
      unevalTree: unEvalTree,
    } = payload;

    const entityTree = new LintEntityTree(unEvalTree, configTree);

    const { asyncFunctionsBoundToDataFields, pathsToLint } =
      isEmpty(this.cachedEntityTree) || forceLinting
        ? this.lintFirstTree(entityTree)
        : this.lintUpdatedTree(entityTree);

    const jsPropertiesState = mapValues(
      parsedJSCache,
      ({ parsedEntityConfig }) => parsedEntityConfig,
    ) as TJSPropertiesState;

    const lintTreeResponse: LintTreeResponse = {
      errors: {},
      lintedJSPaths: [],
      jsPropertiesState,
    };
    try {
      const { errors: lintErrors, lintedJSPaths } = getLintErrorsFromTree({
        pathsToLint,
        unEvalTree: this.cachedEntityTree?.getRawTree() || {},
        jsPropertiesState,
        cloudHosting,
        asyncJSFunctionsInDataFields: generateAsyncFunctionsMap(
          asyncFunctionsBoundToDataFields,
          this.cachedEntityTree,
          this.lintingDependencyMap,
        ),
        configTree,
      });

      lintTreeResponse.errors = lintErrors;
      lintTreeResponse.lintedJSPaths = lintedJSPaths;
    } catch (e) {}
    return lintTreeResponse;
  };

  lintFirstTree = (entityTree: EntityTree) => {
    const pathsToLint: Array<string> = [];
    const allNodes: Record<string, true> = entityTree.getAllPaths();
    const asyncFunctionsBoundToDataFields: string[] = [];
    this.lintingDependencyMap.addNodes(allNodes);

    const entities = entityTree.getEntities();

    for (const entity of entities) {
      const dynamicPaths = PathUtils.getDynamicPaths(entity);
      for (const path of dynamicPaths) {
        const references = extractReferencesFromPath(entity, path, allNodes);
        this.lintingDependencyMap.addDependency(path, references);
        pathsToLint.push(path);
      }
    }

    const jsEntities = entities.filter(isJSEntity);

    const fns = jsEntities.flatMap((e) => e.getFns());

    const asyncFns = fns
      .filter(
        (fn) =>
          fn.isMarkedAsync ||
          this.lintingDependencyMap.isRelated(
            fn.name,
            AppsmithFunctionsWithFields,
          ),
      )
      .map((fn) => fn.name);

    for (const entity of entities) {
      const dataFields = PathUtils.getDataPaths(entity);
      for (const path of dataFields) {
        const reachableNodes = this.lintingDependencyMap.getAllReachableNodes(
          path,
          asyncFns,
        );
        if (!reachableNodes.length) continue;
        asyncFunctionsBoundToDataFields.push(...reachableNodes);
      }
    }

    this.cachedEntityTree = entityTree;
    return {
      pathsToLint,
      asyncFunctionsBoundToDataFields,
    };
  };

  lintUpdatedTree(entityTree: EntityTree) {
    const asyncFunctionsBoundToDataFields: string[] = [];

    const pathsToLint: string[] = [];

    const NOOP = {
      pathsToLint: [],
      asyncFunctionsBoundToDataFields,
    };

    const entityTreeDiff = entityTree.computeDifferences(
      this.cachedEntityTree as EntityTree,
    );

    const entities = entityTree.getEntities();
    const asyncFns = entities
      .filter(isJSEntity)
      .flatMap((e) => e.getFns())
      .filter(
        (fn) =>
          fn.isMarkedAsync ||
          this.lintingDependencyMap.isRelated(
            fn.name,
            AppsmithFunctionsWithFields,
          ),
      )
      .map((fn) => fn.name);

    if (!entityTreeDiff) return NOOP;
    const { additions, deletions, edits } =
      sortDifferencesByType(entityTreeDiff);

    for (const edit of edits) {
      const pathString = convertPathToString(edit?.path || []);
      if (!pathString) continue;
      const { entityName } = getEntityNameAndPropertyPath(pathString);
      const entity = entityTree.getEntityByName(entityName);
      if (!entity) continue;
      const dynamicPaths = PathUtils.getDynamicPaths(entity);
      if (!dynamicPaths.includes(pathString)) {
        if (!dynamicPaths.some((p) => pathString.startsWith(p))) continue;
      }

      const previousDependencies =
        this.lintingDependencyMap.getOutgoingDependencies(pathString);

      const references = extractReferencesFromPath(
        entity,
        pathString,
        unevalEntityTree,
      );
      this.lintingDependencyMap.addDependency(pathString, references);

      pathsToLint.push(pathString);

      const isDataPath = PathUtils.isDataPath(pathString, entity);
      if (!isDataPath) continue;

      const dependencies =
        this.lintingDependencyMap.getOutgoingDependencies(pathString);

      const asyncDeps = intersection(asyncFns, dependencies);
      const prevAsyncDeps = intersection(asyncFns, previousDependencies);

      asyncFunctionsBoundToDataFields.push(...asyncDeps, ...prevAsyncDeps);
      pathsToLint.push(...asyncDeps, ...prevAsyncDeps);
    }

    for (const addition of additions) {
      const pathString = convertPathToString(addition?.path || []);
      if (!pathString) continue;
      const { entityName } = getEntityNameAndPropertyPath(pathString);
      if (!entityName) continue;
      const entity = entityTree.getEntityByName(entityName);
      if (!entity) continue;
      const allAddedPaths = PathUtils.getAllPaths({
        [entityName]: entity.getRawEntity(),
      });

      this.lintingDependencyMap.addNodes(allAddedPaths);
      for (const path of Object.keys(allAddedPaths)) {
        const previousDependencies =
          this.lintingDependencyMap.getOutgoingDependencies(path);
        const references = extractReferencesFromPath(
          entity,
          path,
          allAddedPaths,
        );
        if (PathUtils.isDynamicLeaf(entity, path)) {
          this.lintingDependencyMap.addDependency(path, references);
          pathsToLint.push(path);
        }
        const { asyncJSFunctionsInPath, removedAsyncJSFunctionsInPath } =
          jsActionsInDataFields.handlePathUpdate({
            previousReferencesInPath: previousDependencies,
            referencesInPath: references,
            fullPath: path,
            entityTree,
            dependencyMap: this.lintingDependencyMap,
          });
        asyncFunctionsBoundToDataFields.push(...asyncJSFunctionsInPath);
        const incomingDeps =
          this.lintingDependencyMap.getIncomingDependencies(path);
        pathsToLint.push(
          ...asyncJSFunctionsInPath,
          ...removedAsyncJSFunctionsInPath,
          ...incomingDeps,
        );
      }
    }
    for (const deletion of deletions) {
      const pathString = convertPathToString(deletion?.path || []);
      if (!pathString) continue;
      const { entityName } = getEntityNameAndPropertyPath(pathString);
      if (!entityName) continue;
      const entity = this.cachedEntityTree?.getEntityByName(entityName); // Use previous tree in a DELETE EVENT
      if (!entity) continue;

      const allDeletedPaths = PathUtils.getAllPaths({
        [entityName]: entity.getRawEntity(),
      });

      for (const path of Object.keys(allDeletedPaths)) {
        const previousDependencies =
          this.lintingDependencyMap.getOutgoingDependencies(path);
        const asyncDeps = intersection(asyncFns, previousDependencies);
        asyncFunctionsBoundToDataFields.push(...asyncDeps);
        const incomingDeps =
          this.lintingDependencyMap.getIncomingDependencies(path);
        pathsToLint.push(...asyncDeps, ...incomingDeps);
      }
      this.lintingDependencyMap.removeNodes(allDeletedPaths);
    }

    this.cachedEntityTree = entityTree;
    return {
      pathsToLint,
      entityTree,
      asyncFunctionsBoundToDataFields,
    };
  }
}

function generateAsyncFunctionsMap(
  asyncFunctionsBoundToSyncFields: string[],
  entityTree: TEntityTree,
  dependencyMap: DependencyMap,
) {
  const map: Record<string, Array<string>> = {};
  for (const asyncFunc of uniq(asyncFunctionsBoundToSyncFields)) {
    const { entityName } = getEntityNameAndPropertyPath(asyncFunc);
    const entity = entityTree[entityName];
    if (!entity || !isJSEntity(entity)) continue;
    const dependants = dependencyMap.getIncomingDependencies(asyncFunc);
    if (isEmpty(dependants)) continue;

    const dataFieldDependants = dependants.filter((path) => {
      const { entityName } = getEntityNameAndPropertyPath(path);
      const entity = entityTree[entityName];
      if (!entity) return false;
      return PathUtils.isDataPath(path, entity);
    });
    map[asyncFunc] = dataFieldDependants;
  }
  return map;
}
function convertArrayToObject(arr: string[]) {
  return arr.reduce((acc, item) => {
    return { ...acc, [item]: true } as const;
  }, {} as Record<string, true>);
}

export const lintService = new LintService();
