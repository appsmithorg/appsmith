import get from "lodash/get";
import intersection from "lodash/intersection";
import isEmpty from "lodash/isEmpty";
import uniq from "lodash/uniq";
import {
  convertPathToString,
  getAllPaths,
  getEntityNameAndPropertyPath,
} from "ee/workers/Evaluation/evaluationUtils";
import { AppsmithFunctionsWithFields } from "components/editorComponents/ActionCreator/constants";
import { PathUtils } from "plugins/Linting/utils/pathUtils";
import { extractReferencesFromPath } from "ee/plugins/Linting/utils/getEntityDependencies";
import { groupDifferencesByType } from "plugins/Linting/utils/groupDifferencesByType";
import type {
  LintRequest,
  LintTreeRequestPayload,
  LintTreeResponse,
} from "plugins/Linting/types";
import { getLintErrorsFromTree } from "plugins/Linting/lintTree";
import type {
  TJSPropertiesState,
  TJSpropertyState,
} from "workers/Evaluation/JSObject/jsPropertiesState";
import { isJSEntity } from "ee/plugins/Linting/lib/entity";
import DependencyMap from "entities/DependencyMap";
import {
  LintEntityTree,
  type EntityTree,
} from "plugins/Linting/lib/entity/EntityTree";
import { getEntityFunctions } from "ee/workers/Evaluation/fns";

class LintService {
  cachedEntityTree: EntityTree | null;
  dependencyMap: DependencyMap = new DependencyMap();
  constructor() {
    this.cachedEntityTree = null;

    if (isEmpty(this.cachedEntityTree)) {
      this.dependencyMap = new DependencyMap();
      this.dependencyMap.addNodes(
        convertArrayToObject(AppsmithFunctionsWithFields),
      );
    }
  }

  lintTree = (lintRequest: LintRequest<LintTreeRequestPayload>) => {
    const { data: payload, webworkerTelemetry } = lintRequest;
    const {
      cloudHosting,
      configTree,
      forceLinting = false,
      unevalTree: unEvalTree,
    } = payload;

    const entityTree = new LintEntityTree(unEvalTree, configTree);

    const { asyncJSFunctionsInDataFields, pathsToLint } =
      isEmpty(this.cachedEntityTree) || forceLinting
        ? this.lintFirstTree(entityTree)
        : this.lintUpdatedTree(entityTree);

    const jsEntities = entityTree.getEntities().filter(isJSEntity);
    const jsPropertiesState: TJSPropertiesState = {};

    for (const jsEntity of jsEntities) {
      const rawEntity = jsEntity.getRawEntity();
      const config = jsEntity.getConfig();

      if (!jsEntity.entityParser) continue;

      const { parsedEntityConfig } = jsEntity.entityParser.parse(
        rawEntity,
        config,
      );

      jsPropertiesState[jsEntity.getName()] = parsedEntityConfig as Record<
        string,
        TJSpropertyState
      >;
    }

    const lintTreeResponse: LintTreeResponse = {
      errors: {},
      lintedJSPaths: [],
      jsPropertiesState,
      webworkerTelemetry,
    };

    try {
      const { errors: lintErrors, lintedJSPaths } = getLintErrorsFromTree({
        pathsToLint,
        unEvalTree: this.cachedEntityTree?.getRawTree() || {},
        jsPropertiesState,
        cloudHosting,
        asyncJSFunctionsInDataFields,
        webworkerTelemetry,
        configTree,
      });

      lintTreeResponse.errors = lintErrors;
      lintTreeResponse.lintedJSPaths = lintedJSPaths;
      lintTreeResponse.webworkerTelemetry = webworkerTelemetry;
    } catch (e) {}

    return lintTreeResponse;
  };

  private lintFirstTree = (entityTree: EntityTree) => {
    const pathsToLint: Array<string> = [];
    const allNodes: Record<string, true> = entityTree.getAllPaths();
    const asyncJSFunctionsInDataFields: Record<string, string[]> = {};

    this.dependencyMap.addNodes(allNodes);

    const entities = entityTree.getEntities();

    for (const entity of entities) {
      const dynamicPaths = PathUtils.getDynamicPaths(entity);

      for (const path of dynamicPaths) {
        const references = extractReferencesFromPath(entity, path, allNodes);

        this.dependencyMap.addDependency(path, references);
        pathsToLint.push(path);
      }
    }

    const asyncEntityActions = AppsmithFunctionsWithFields.concat(
      getAllEntityActions(entityTree),
    );
    const asyncFns = entities
      .filter(isJSEntity)
      .flatMap((e) => e.getFns())
      .filter(
        (fn) =>
          fn.isMarkedAsync ||
          this.dependencyMap.isRelated(fn.name, asyncEntityActions),
      )
      .map((fn) => fn.name);

    for (const asyncFn of asyncFns) {
      const nodesThatDependOnAsyncFn =
        this.dependencyMap.getDependents(asyncFn);
      const dataPathsThatDependOnAsyncFn = filterDataPaths(
        nodesThatDependOnAsyncFn,
        entityTree,
      );

      if (isEmpty(dataPathsThatDependOnAsyncFn)) continue;

      asyncJSFunctionsInDataFields[asyncFn] = dataPathsThatDependOnAsyncFn;
    }

    this.cachedEntityTree = entityTree;

    return {
      pathsToLint,
      asyncJSFunctionsInDataFields,
    };
  };

  private lintUpdatedTree(entityTree: EntityTree) {
    const asyncJSFunctionsInDataFields: Record<string, string[]> = {};
    const pathsToLint: string[] = [];
    const NOOP = {
      pathsToLint: [],
      asyncJSFunctionsInDataFields,
    };
    const entityTreeDiff =
      this.cachedEntityTree?.computeDifferences(entityTree);

    if (!entityTreeDiff) return NOOP;

    const { additions, deletions, edits } =
      groupDifferencesByType(entityTreeDiff);

    const allNodes = getAllPaths(entityTree.getRawTree());

    const updatedPathsDetails: Record<
      string,
      {
        previousDependencies: string[];
        currentDependencies: string[];
        updateType: "EDIT" | "ADD" | "DELETE";
      }
    > = {};

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
        this.dependencyMap.getDirectDependencies(pathString);
      const references = extractReferencesFromPath(
        entity,
        pathString,
        allNodes,
      );

      this.dependencyMap.addDependency(pathString, references);
      pathsToLint.push(pathString);

      updatedPathsDetails[pathString] = {
        previousDependencies,
        currentDependencies: references,
        updateType: "EDIT",
      };
    }

    for (const addition of additions) {
      const pathString = convertPathToString(addition?.path || []);

      if (!pathString) continue;

      const { entityName } = getEntityNameAndPropertyPath(pathString);

      if (!entityName) continue;

      const entity = entityTree.getEntityByName(entityName);

      if (!entity) continue;

      const allAddedPaths = PathUtils.getAllPaths({
        [pathString]: get(entityTree.getRawTree(), pathString),
      });

      this.dependencyMap.addNodes(allAddedPaths);

      for (const path of Object.keys(allAddedPaths)) {
        const previousDependencies =
          this.dependencyMap.getDirectDependencies(path);
        const references = extractReferencesFromPath(entity, path, allNodes);

        if (PathUtils.isDynamicLeaf(entity, path)) {
          this.dependencyMap.addDependency(path, references);
          pathsToLint.push(path);
        }

        const incomingDeps = this.dependencyMap.getDependents(path);

        pathsToLint.push(...incomingDeps);

        updatedPathsDetails[path] = {
          previousDependencies,
          currentDependencies: references,
          updateType: "ADD",
        };
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
        [pathString]: get(this.cachedEntityTree?.getRawTree(), pathString),
      });

      for (const path of Object.keys(allDeletedPaths)) {
        const previousDependencies =
          this.dependencyMap.getDirectDependencies(path);

        updatedPathsDetails[path] = {
          previousDependencies,
          currentDependencies: [],
          updateType: "DELETE",
        };

        const incomingDeps = this.dependencyMap.getDependents(path);

        pathsToLint.push(...incomingDeps);
      }

      this.dependencyMap.removeNodes(allDeletedPaths);
    }

    // generate async functions only after dependencyMap update is complete
    const asyncEntityActions = AppsmithFunctionsWithFields.concat(
      getAllEntityActions(entityTree),
    );
    const asyncFns = entityTree
      .getEntities()
      .filter(isJSEntity)
      .flatMap((e) => e.getFns())
      .filter(
        (fn) =>
          fn.isMarkedAsync ||
          this.dependencyMap.isRelated(fn.name, asyncEntityActions),
      )
      .map((fn) => fn.name);

    // generate asyncFunctionsBoundToSyncFields

    for (const [updatedPath, details] of Object.entries(updatedPathsDetails)) {
      const { currentDependencies, previousDependencies, updateType } = details;
      const { entityName } = getEntityNameAndPropertyPath(updatedPath);

      if (!entityName) continue;

      // Use cached entityTree in a delete event
      const entityTreeToUse =
        updateType === "DELETE" ? this.cachedEntityTree : entityTree;
      const entity = entityTreeToUse?.getEntityByName(entityName);

      if (!entity) continue;

      if (isJSEntity(entity) && asyncFns.includes(updatedPath)) {
        const nodesThatDependOnAsyncFn =
          this.dependencyMap.getDependents(updatedPath);
        const dataPathsThatDependOnAsyncFn = filterDataPaths(
          nodesThatDependOnAsyncFn,
          entityTree,
        );

        if (!isEmpty(dataPathsThatDependOnAsyncFn)) {
          asyncJSFunctionsInDataFields[updatedPath] =
            dataPathsThatDependOnAsyncFn;
        }

        continue;
      }

      const isDataPath = PathUtils.isDataPath(updatedPath, entity);

      if (!isDataPath) continue;

      const asyncDeps = intersection(asyncFns, currentDependencies);
      const prevAsyncDeps = intersection(asyncFns, previousDependencies);

      for (const asyncFn of asyncDeps) {
        const nodesThatDependOnAsyncFn =
          this.dependencyMap.getDependents(asyncFn);
        const dataPathsThatDependOnAsyncFn = filterDataPaths(
          nodesThatDependOnAsyncFn,
          entityTree,
        );

        if (isEmpty(dataPathsThatDependOnAsyncFn)) continue;

        asyncJSFunctionsInDataFields[asyncFn] = dataPathsThatDependOnAsyncFn;
      }

      pathsToLint.push(...asyncDeps, ...prevAsyncDeps);
    }

    this.cachedEntityTree = entityTree;

    return {
      pathsToLint: uniq(pathsToLint),
      entityTree,
      asyncJSFunctionsInDataFields,
    };
  }
}

function convertArrayToObject(arr: string[]) {
  return arr.reduce(
    (acc, item) => {
      return { ...acc, [item]: true } as const;
    },
    {} as Record<string, true>,
  );
}

function filterDataPaths(paths: string[], entityTree: EntityTree) {
  const dataPaths: string[] = [];

  for (const path of paths) {
    const { entityName } = getEntityNameAndPropertyPath(path);
    const entity = entityTree.getEntityByName(entityName);

    if (!entity || !PathUtils.isDataPath(path, entity)) continue;

    dataPaths.push(path);
  }

  return dataPaths;
}

function getAllEntityActions(entityTree: EntityTree) {
  const allEntityActions = new Set<string>();

  for (const [entityName, entity] of Object.entries(entityTree.getRawTree())) {
    for (const entityFnDescription of getEntityFunctions()) {
      if (entityFnDescription.qualifier(entity)) {
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

export const lintService = new LintService();
