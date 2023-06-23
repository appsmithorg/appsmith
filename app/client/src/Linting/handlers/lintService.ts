import type { ConfigTree, UnEvalTree } from "entities/DataTree/dataTreeFactory";
import type { TEntityTree } from "../utils/entityTree";
import { getEntityTreeDifferences } from "../utils/entityTree";
import { updateTreeWithParsedJS } from "../utils/entityTree";
import { getUnevalEntityTree } from "../utils/entityTree";
import { createEntityTree } from "../utils/entityTree";
import { isEmpty, mapValues, uniq } from "lodash";
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

class LintService {
  cachedEntityTree: TEntityTree = {};
  lintingDependencyMap: DependencyMap = new DependencyMap();
  constructor() {
    this.initializeLinting = this.initializeLinting.bind(this);
    this.lintTree = this.lintTree.bind(this);
    this.lintFirstTree = this.lintFirstTree.bind(this);
    this.lintUpdatedTree = this.lintUpdatedTree.bind(this);
    this.preProcessTree = this.preProcessTree.bind(this);
  }
  lintTree({
    cloudHosting,
    configTree,
    forceLinting = false,
    unevalTree: unEvalTree,
  }: LintTreeRequestPayload) {
    this.initializeLinting();
    const { asyncFunctionsBoundToDataFields, pathsToLint } =
      isEmpty(this.cachedEntityTree) || forceLinting
        ? this.lintFirstTree(unEvalTree as UnEvalTree, configTree)
        : this.lintUpdatedTree(unEvalTree as UnEvalTree, configTree);

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
        unEvalTree: getUnevalEntityTree(this.cachedEntityTree),
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
  }
  lintFirstTree(
    unEvalTree: UnEvalTree,
    configTree: ConfigTree,
  ): {
    pathsToLint: string[];
    entityTree: TEntityTree;
    asyncFunctionsBoundToDataFields: string[];
  } {
    const { entityTree, unevalEntityTree } = this.preProcessTree(
      unEvalTree,
      configTree,
    );
    const pathsToLint: Array<string> = [];
    const allNodes: Record<string, true> = getAllPaths(unevalEntityTree);
    const asyncFunctionsBoundToDataFields: string[] = [];
    this.lintingDependencyMap.addNodes(allNodes);

    for (const entity of Object.values(entityTree)) {
      const dynamicPaths = PathUtils.getDynamicPaths(entity);
      for (const path of dynamicPaths) {
        const references = extractReferencesFromPath(
          entity,
          path,
          unevalEntityTree,
        );
        const { asyncJSFunctionsInPath } =
          jsActionsInDataFields.handlePathUpdate({
            fullPath: path,
            previousReferencesInPath: [],
            referencesInPath: references,
            entityTree,
            dependencyMap: this.lintingDependencyMap,
          });

        asyncFunctionsBoundToDataFields.push(...asyncJSFunctionsInPath);

        this.lintingDependencyMap.addDependency(path, references);
        pathsToLint.push(path);
      }
    }

    this.cachedEntityTree = entityTree;
    return {
      pathsToLint,
      entityTree,
      asyncFunctionsBoundToDataFields,
    };
  }
  lintUpdatedTree(
    unEvalTree: UnEvalTree,
    configTree: ConfigTree,
  ): {
    pathsToLint: string[];
    entityTree: TEntityTree;
    asyncFunctionsBoundToDataFields: string[];
  } {
    const { entityTree, unevalEntityTree } = this.preProcessTree(
      unEvalTree,
      configTree,
    );
    const asyncFunctionsBoundToDataFields: string[] = [];

    const pathsToLint: string[] = [];

    const NOOP = {
      pathsToLint: [],
      entityTree,
      asyncFunctionsBoundToDataFields,
    };
    const entityTreeDiff = getEntityTreeDifferences(
      this.cachedEntityTree,
      entityTree,
    );

    if (!entityTreeDiff) return NOOP;
    const { additions, deletions, edits } =
      sortDifferencesByType(entityTreeDiff);

    for (const edit of edits) {
      const pathString = convertPathToString(edit?.path || []);
      if (!pathString) continue;
      const { entityName } = getEntityNameAndPropertyPath(pathString);
      const entity = entityTree[entityName];
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
      const { asyncJSFunctionsInPath, removedAsyncJSFunctionsInPath } =
        jsActionsInDataFields.handlePathUpdate({
          previousReferencesInPath: previousDependencies,
          referencesInPath: references,
          fullPath: pathString,
          entityTree,
          dependencyMap: this.lintingDependencyMap,
        });
      asyncFunctionsBoundToDataFields.push(...asyncJSFunctionsInPath);
      pathsToLint.push(
        ...asyncJSFunctionsInPath,
        ...removedAsyncJSFunctionsInPath,
        pathString,
      );
    }

    for (const addition of additions) {
      const pathString = convertPathToString(addition?.path || []);
      if (!pathString) continue;
      const { entityName } = getEntityNameAndPropertyPath(pathString);
      if (!entityName) continue;
      const entity = entityTree[entityName];
      if (!entity) continue;

      const allAddedPaths = getAllPathsFromNode(pathString, unevalEntityTree);
      this.lintingDependencyMap.addNodes(allAddedPaths);
      for (const path of Object.keys(allAddedPaths)) {
        const previousDependencies =
          this.lintingDependencyMap.getOutgoingDependencies(path);
        const references = extractReferencesFromPath(
          entity,
          path,
          unevalEntityTree,
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
      const entity = this.cachedEntityTree[entityName]; // Use previous tree in a DELETE EVENT
      if (!entity) continue;

      const allDeletedPaths = getAllPathsFromNode(
        pathString,
        getUnevalEntityTree(this.cachedEntityTree),
      );

      for (const path of Object.keys(allDeletedPaths)) {
        const previousDependencies =
          this.lintingDependencyMap.getOutgoingDependencies(path);
        const { asyncJSFunctionsInPath, removedAsyncJSFunctionsInPath } =
          jsActionsInDataFields.handlePathDeletion({
            fullPath: path,
            previousReferencesInPath: previousDependencies,
            entityTree: this.cachedEntityTree,
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
      this.lintingDependencyMap.removeNodes(allDeletedPaths);
    }

    this.cachedEntityTree = entityTree;
    return {
      pathsToLint,
      entityTree,
      asyncFunctionsBoundToDataFields,
    };
  }
  preProcessTree(unEvalTree: UnEvalTree, configTree: ConfigTree) {
    const entityTree = createEntityTree(unEvalTree, configTree);
    updateTreeWithParsedJS(entityTree);
    const unevalEntityTree = getUnevalEntityTree(entityTree);

    return { entityTree, unevalEntityTree };
  }
  initializeLinting() {
    if (isEmpty(this.cachedEntityTree)) {
      this.lintingDependencyMap = new DependencyMap();
      this.lintingDependencyMap.addNodes(
        convertArrayToObject(AppsmithFunctionsWithFields),
      );
    }
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
