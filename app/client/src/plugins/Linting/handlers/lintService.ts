import { intersection, isEmpty } from "lodash";
import {
  convertPathToString,
  getEntityNameAndPropertyPath,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import { AppsmithFunctionsWithFields } from "components/editorComponents/ActionCreator/constants";
import { PathUtils } from "plugins/Linting/utils/pathUtils";
import { extractReferencesFromPath } from "plugins/Linting/utils/getEntityDependencies";
import { groupDifferencesByType } from "plugins/Linting/utils/groupDifferencesByType";
import type {
  LintTreeRequestPayload,
  LintTreeResponse,
} from "plugins/Linting/types";
import { getLintErrorsFromTree } from "plugins/Linting/lintTree";
import type { TJSPropertiesState } from "workers/Evaluation/JSObject/jsPropertiesState";
import { isJSEntity } from "plugins/Linting/lib/entity";
import DependencyMap from "entities/DependencyMap";
import {
  LintEntityTree,
  type EntityTree,
} from "plugins/Linting/lib/entity/EntityTree";

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

  lintTree = (payload: LintTreeRequestPayload) => {
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
      if (!jsEntity.entityParser) continue;
      const { parsedEntityConfig } = jsEntity.entityParser.parse(rawEntity);
      jsPropertiesState[jsEntity.getName()] = parsedEntityConfig as any;
    }

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
        asyncJSFunctionsInDataFields,

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

    const jsFns = entities.filter(isJSEntity).flatMap((e) => e.getFns());
    const asyncFns = jsFns
      .filter(
        (fn) =>
          fn.isMarkedAsync ||
          this.dependencyMap.isRelated(fn.name, AppsmithFunctionsWithFields),
      )
      .map((fn) => fn.name);

    for (const asyncFn of asyncFns) {
      const nodesThatDependOnAsyncFn =
        this.dependencyMap.getIncomingDependencies(asyncFn);
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

  lintUpdatedTree(entityTree: EntityTree) {
    const asyncJSFunctionsInDataFields: Record<string, string[]> = {};
    const pathsToLint: string[] = [];
    const NOOP = {
      pathsToLint: [],
      asyncJSFunctionsInDataFields,
    };
    const entityTreeDiff = entityTree.computeDifferences(
      this.cachedEntityTree as EntityTree,
    );
    if (!entityTreeDiff) return NOOP;

    const entities = entityTree.getEntities();
    const asyncFns = entities
      .filter(isJSEntity)
      .flatMap((e) => e.getFns())
      .filter(
        (fn) =>
          fn.isMarkedAsync ||
          this.dependencyMap.isRelated(fn.name, AppsmithFunctionsWithFields),
      )
      .map((fn) => fn.name);

    const { additions, deletions, edits } =
      groupDifferencesByType(entityTreeDiff);

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
        this.dependencyMap.getOutgoingDependencies(pathString);
      const references = extractReferencesFromPath(
        entity,
        pathString,
        entityTree.getRawTree(),
      );
      this.dependencyMap.addDependency(pathString, references);
      pathsToLint.push(pathString);
      if (isJSEntity(entity) && asyncFns.includes(pathString)) {
        const nodesThatDependOnAsyncFn =
          this.dependencyMap.getIncomingDependencies(pathString);
        const dataPathsThatDependOnAsyncFn = filterDataPaths(
          nodesThatDependOnAsyncFn,
          entityTree,
        );
        if (!isEmpty(dataPathsThatDependOnAsyncFn)) {
          asyncJSFunctionsInDataFields[pathString] =
            dataPathsThatDependOnAsyncFn;
        }
      }
      const isDataPath = PathUtils.isDataPath(pathString, entity);
      if (!isDataPath) continue;

      const dependencies =
        this.dependencyMap.getOutgoingDependencies(pathString);

      const asyncDeps = intersection(asyncFns, dependencies);
      const prevAsyncDeps = intersection(asyncFns, previousDependencies);

      for (const asyncFn of asyncDeps) {
        const nodesThatDependOnAsyncFn =
          this.dependencyMap.getIncomingDependencies(asyncFn);
        const dataPathsThatDependOnAsyncFn = filterDataPaths(
          nodesThatDependOnAsyncFn,
          entityTree,
        );
        if (isEmpty(dataPathsThatDependOnAsyncFn)) continue;
        asyncJSFunctionsInDataFields[asyncFn] = dataPathsThatDependOnAsyncFn;
      }

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

      this.dependencyMap.addNodes(allAddedPaths);
      for (const path of Object.keys(allAddedPaths)) {
        const previousDependencies =
          this.dependencyMap.getOutgoingDependencies(path);
        const references = extractReferencesFromPath(
          entity,
          path,
          allAddedPaths,
        );
        if (PathUtils.isDynamicLeaf(entity, path)) {
          this.dependencyMap.addDependency(path, references);
          pathsToLint.push(path);
        }
        const incomingDeps = this.dependencyMap.getIncomingDependencies(path);
        pathsToLint.push(...incomingDeps);
        if (isJSEntity(entity) && asyncFns.includes(pathString)) {
          const nodesThatDependOnAsyncFn =
            this.dependencyMap.getIncomingDependencies(pathString);
          const dataPathsThatDependOnAsyncFn = filterDataPaths(
            nodesThatDependOnAsyncFn,
            entityTree,
          );
          if (!isEmpty(dataPathsThatDependOnAsyncFn)) {
            asyncJSFunctionsInDataFields[pathString] =
              dataPathsThatDependOnAsyncFn;
          }
        }
        const isDataPath = PathUtils.isDataPath(pathString, entity);
        if (!isDataPath) continue;

        const asyncDeps = intersection(asyncFns, references);
        const prevAsyncDeps = intersection(asyncFns, previousDependencies);

        for (const asyncFn of asyncDeps) {
          const nodesThatDependOnAsyncFn =
            this.dependencyMap.getIncomingDependencies(asyncFn);
          const dataPathsThatDependOnAsyncFn = filterDataPaths(
            nodesThatDependOnAsyncFn,
            entityTree,
          );
          if (isEmpty(dataPathsThatDependOnAsyncFn)) continue;
          asyncJSFunctionsInDataFields[asyncFn] = dataPathsThatDependOnAsyncFn;
        }
        pathsToLint.push(...asyncDeps, ...prevAsyncDeps);
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
          this.dependencyMap.getOutgoingDependencies(path);
        const asyncDeps = intersection(asyncFns, previousDependencies);
        for (const asyncFn of asyncDeps) {
          const nodesThatDependOnAsyncFn =
            this.dependencyMap.getIncomingDependencies(asyncFn);
          const dataPathsThatDependOnAsyncFn = nodesThatDependOnAsyncFn.filter(
            (path) => {
              const { entityName } = getEntityNameAndPropertyPath(path);
              const entity = entityTree.getEntityByName(entityName);
              if (!entity) return false;
              return PathUtils.isDataPath(path, entity);
            },
          );
          if (isEmpty(dataPathsThatDependOnAsyncFn)) continue;
          asyncJSFunctionsInDataFields[asyncFn] = dataPathsThatDependOnAsyncFn;
        }

        const incomingDeps = this.dependencyMap.getIncomingDependencies(path);
        pathsToLint.push(...asyncDeps, ...incomingDeps);
      }
      this.dependencyMap.removeNodes(allDeletedPaths);
    }

    this.cachedEntityTree = entityTree;
    return {
      pathsToLint,
      entityTree,
      asyncJSFunctionsInDataFields,
    };
  }
}

function convertArrayToObject(arr: string[]) {
  return arr.reduce((acc, item) => {
    return { ...acc, [item]: true } as const;
  }, {} as Record<string, true>);
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

export const lintService = new LintService();
