import EntityFactory from "Linting/lib/entity";
import type { LintTreeRequestPayload } from "Linting/types";
import { JSObjectUtils } from "Linting/utils/JSObjectUtils";
import { PathUtils } from "Linting/utils/PathUtils";
import { extractReferencesFromPath } from "Linting/utils/getEntityDependencies";
import { getLintErrorsFromTree } from "Linting/utils/lintTree";
import {
  convertPathToString,
  getAllPaths,
  isJSAction,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type { DiffArray, DiffDeleted, DiffEdit, DiffNew } from "deep-diff";
import { diff } from "deep-diff";
import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeFactory";
import DependencyMap from "entities/DependencyMap";

let dataTreeCache: DataTree | null = null;
let configTreeCache: ConfigTree | null = null;

const lintingDependencyMap = new DependencyMap();

export function lintTreeV2(data: LintTreeRequestPayload) {
  const { configTree, unevalTree } = data;
  preProcessUnevalTreeForLinting(unevalTree);
  const isFirstTree = !dataTreeCache || !configTreeCache;
  const paths = isFirstTree
    ? lintPathsForFirstTree(unevalTree, configTree)
    : lintPathsForUpdateTree(unevalTree, configTree);
  dataTreeCache = unevalTree;
  configTreeCache = configTree;
  if (!paths.length) return {};

  const { errors, updatedJSEntities } = getLintErrorsFromTree({
    pathsToLint: paths,
    unEvalTree: unevalTree,
    jsPropertiesState: {},
    cloudHosting: true,
    asyncJSFunctionsInDataFields: {},
    configTree,
  });
  return { errors, updatedJSEntities };
}

function preProcessUnevalTreeForLinting(unEvalTree: DataTree) {
  const entityNames = Object.keys(unEvalTree || {});
  for (const entityName of entityNames) {
    const rawEntity = unEvalTree[entityName];
    if (!isJSAction(rawEntity)) continue;
    const { body } = rawEntity;
    if (dataTreeCache) {
      const cachedEntity = dataTreeCache[entityName];
      if (isJSAction(cachedEntity) && cachedEntity.body === body) {
        unEvalTree[entityName] = cachedEntity;
        continue;
      }
    }
    const kvPairs = JSObjectUtils.getKeyValuePairs(body);
    if (!kvPairs) continue;
    for (const [key, value] of kvPairs) {
      rawEntity[key] = value;
    }
  }
}

function lintPathsForFirstTree(unevalTree: DataTree, configTree: ConfigTree) {
  const paths = new Set<string>();
  const allNodes = getAllPaths(unevalTree);
  const entityNames = Object.keys(unevalTree || {});
  for (const entityName of entityNames) {
    const rawEntity = unevalTree[entityName];
    const entity = EntityFactory.getEntity(rawEntity, configTree[entityName]);
    const pathsToLint = PathUtils.getPathsToLint(entity);
    for (const path of pathsToLint) {
      const references = extractReferencesFromPath(entity, path, allNodes);
      lintingDependencyMap.addNodes({ [path]: true });
      lintingDependencyMap.addDependency(path, references);
      paths.add(path);
    }
  }
  return Array.from(paths);
}

function lintPathsForUpdateTree(unevalTree: DataTree, configTree: ConfigTree) {
  if (!dataTreeCache) return [];
  if (!configTreeCache) return [];

  const allNodes = getAllPaths(unevalTree);
  const paths = new Set<string>();
  const entityNames = Array.from(
    new Set([
      ...Object.keys(unevalTree || {}),
      ...Object.keys(dataTreeCache || {}),
    ]),
  );

  const differences = diff(dataTreeCache, unevalTree);
  if (!differences?.length) return [];
  const differencesGroupedByEntity: Record<
    string,
    {
      additions: DiffNew<DataTree>[];
      deletions: DiffDeleted<DataTree>[];
      edits: (DiffEdit<DataTree> | DiffArray<DataTree>)[];
    }
  > = {};

  for (const difference of differences) {
    const entityName = difference?.path?.[0];
    differencesGroupedByEntity[entityName] =
      differencesGroupedByEntity[entityName] || {};
    if (difference.kind === "E" || difference.kind === "A") {
      differencesGroupedByEntity[entityName].edits =
        differencesGroupedByEntity[entityName].edits || [];
      differencesGroupedByEntity[entityName].edits.push(difference);
    } else if (difference.kind === "N") {
      differencesGroupedByEntity[entityName].additions =
        differencesGroupedByEntity[entityName].additions || [];
      differencesGroupedByEntity[entityName].additions.push(difference);
    } else {
      differencesGroupedByEntity[entityName].deletions =
        differencesGroupedByEntity[entityName].deletions || [];
      differencesGroupedByEntity[entityName].deletions.push(difference);
    }
  }

  for (const entityName of entityNames) {
    const entity = unevalTree.hasOwnProperty(entityName)
      ? EntityFactory.getEntity(unevalTree[entityName], configTree[entityName])
      : EntityFactory.getEntity(
          dataTreeCache[entityName],
          configTreeCache[entityName],
        );
    const pathsToLint = PathUtils.getPathsToLint(entity);

    const {
      additions = [],
      deletions = [],
      edits = [],
    } = differencesGroupedByEntity[entityName] || {};

    for (const edit of edits) {
      const pathString = convertPathToString(edit?.path || []);
      if (!pathString) continue;
      if (!pathsToLint.includes(pathString)) continue;
      const references = extractReferencesFromPath(
        entity,
        pathString,
        allNodes,
      );
      lintingDependencyMap.addDependency(pathString, references);
      paths.add(pathString);
    }

    for (const addition of additions) {
      const pathString = convertPathToString(addition?.path || []);
      if (!pathString) continue;
      lintingDependencyMap.addNodes(
        pathsToLint.reduce((acc, p) => {
          acc[p] = true;
          return acc;
        }, {} as Record<string, true>),
      );
      const incomingNodes = pathsToLint.flatMap((n) =>
        lintingDependencyMap.getIncomingDependencies(n),
      );
      incomingNodes.forEach((n) => paths.add(n));
      pathsToLint.forEach((n) => paths.add(n));
    }

    for (const deletion of deletions) {
      const pathString = convertPathToString(deletion?.path || []);
      if (!pathString) continue;
      lintingDependencyMap.removeNodes(
        pathsToLint.reduce((acc, p) => {
          acc[p] = true;
          return acc;
        }, {} as Record<string, true>),
      );
      const incomingNodes = pathsToLint.flatMap((n) =>
        lintingDependencyMap.getIncomingDependencies(n),
      );
      incomingNodes.forEach((n) => paths.add(n));
    }
  }
  return Array.from(paths);
}
