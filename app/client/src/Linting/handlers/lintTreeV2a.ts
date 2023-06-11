import EntityFactory from "Linting/lib/entity";
import type { LintTreeRequestPayload } from "Linting/types";
import { JSObjectUtils } from "Linting/utils/JSObjectUtils";
import { PathUtils } from "Linting/utils/PathUtils";
import { extractReferencesFromPath } from "Linting/utils/getEntityDependencies";
import { getLintErrorsFromTree } from "Linting/utils/lintTree";
import {
  convertPathToString,
  getAllPaths,
  getEntityNameAndPropertyPath,
  isJSAction,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import { diff } from "deep-diff";
import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeFactory";
import DependencyMap from "entities/DependencyMap";
import { partition } from "lodash";

let dataTreeCache: DataTree | null = null;
let configTreeCache: ConfigTree | null = null;

const lintingDependencyMap = new DependencyMap();

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

export function lintTreeV2(data: LintTreeRequestPayload) {
  const { configTree, unevalTree } = data;
  preProcessUnevalTreeForLinting(unevalTree);
  const paths: string[] = [];
  if (!dataTreeCache || !configTreeCache) {
    dataTreeCache = unevalTree;
    configTreeCache = configTree;
    const allNodes = getAllPaths(unevalTree);
    const entityNames = Object.keys(unevalTree || {});

    for (const entityName of entityNames) {
      const rawEntity = unevalTree[entityName];
      const entity = EntityFactory.getEntity(rawEntity, configTree[entityName]);
      const reactivePaths = PathUtils.getReactivePaths(entity);
      for (const path of reactivePaths) {
        const references = extractReferencesFromPath(entity, path, allNodes);
        lintingDependencyMap.addNodes({ [path]: true });
        lintingDependencyMap.addDependency(path, references);
        paths.push(path);
      }
      const triggerPaths = PathUtils.getTriggerPaths(entity);
      for (const path of triggerPaths) {
        const references = extractReferencesFromPath(entity, path, allNodes);
        lintingDependencyMap.addNodes({ [path]: true });
        lintingDependencyMap.addDependency(path, references);
        paths.push(path);
      }
    }

    console.log("After 1st Tree", { paths, nodes: lintingDependencyMap.nodes });
  } else {
    const allNodes = getAllPaths(unevalTree);
    lintingDependencyMap.addNodes(allNodes);
    const differences = diff(dataTreeCache, unevalTree);

    if (!differences?.length) return {};

    const [edits, others] = partition(
      differences,
      (diff) => diff.kind === "E" || diff.kind === "A",
    );
    const [additions, deletions] = partition(
      others,
      (diff) => diff.kind === "N",
    );

    console.log({ edits, additions, deletions });

    for (const edit of edits) {
      const pathString = convertPathToString(edit?.path || []);
      if (!pathString) continue;
      const { entityName } = getEntityNameAndPropertyPath(pathString);
      const entity = EntityFactory.getEntity(
        unevalTree[entityName],
        configTree[entityName],
      );
      const reactivePaths = PathUtils.getReactivePaths(entity);
      const triggerPaths = PathUtils.getTriggerPaths(entity);
      if (
        !reactivePaths.includes(pathString) &&
        !triggerPaths.includes(pathString)
      ) {
        if (!reactivePaths.some((p) => pathString.startsWith(p))) continue;
      }

      const references = extractReferencesFromPath(
        entity,
        pathString,
        allNodes,
      );
      lintingDependencyMap.addDependency(pathString, references);
      paths.push(pathString);
    }

    console.log("After Edits", { paths });

    for (const addition of additions) {
      const pathString = convertPathToString(addition?.path || []);
      if (!pathString) continue;
      const entityName = addition.path?.[0];
      if (!entityName) continue;
      const entity = EntityFactory.getEntity(
        unevalTree[entityName],
        configTree[entityName],
      );
      const reactivePaths = PathUtils.getReactivePaths(entity);
      const triggerPaths = PathUtils.getTriggerPaths(entity);
      if (
        !reactivePaths.includes(pathString) &&
        !triggerPaths.includes(pathString)
      ) {
        if (!reactivePaths.some((p) => p.startsWith(pathString))) continue;
      }

      lintingDependencyMap.addNodes(
        reactivePaths.reduce((acc, p) => {
          acc[p] = true;
          return acc;
        }, {} as Record<string, true>),
      );
      const incomingNodes = reactivePaths.flatMap((n) =>
        lintingDependencyMap.getIncomingDependencies(n),
      );
      paths.push(...incomingNodes);
    }

    console.log("After Additions", { paths });

    for (const deletion of deletions) {
      const pathString = convertPathToString(deletion?.path || []);
      if (!pathString) continue;
      const entityName = deletion.path?.[0];
      if (!entityName) continue;
      const entity = EntityFactory.getEntity(
        dataTreeCache[entityName],
        configTreeCache[entityName],
      );
      const reactivePaths = PathUtils.getReactivePaths(entity);
      const triggerPaths = PathUtils.getTriggerPaths(entity);
      if (
        !reactivePaths.includes(pathString) &&
        !triggerPaths.includes(pathString)
      ) {
        if (!reactivePaths.some((p) => p.startsWith(pathString))) continue;
      }

      lintingDependencyMap.removeNodes(
        reactivePaths.reduce((acc, p) => {
          acc[p] = true;
          return acc;
        }, {} as Record<string, true>),
      );
      const incomingNodes = reactivePaths.flatMap((n) =>
        lintingDependencyMap.getIncomingDependencies(n),
      );
      paths.push(...incomingNodes);
    }

    console.log("After Deletions", { paths });

    dataTreeCache = unevalTree;
    configTreeCache = configTree;
    console.log("After update Tree", {
      paths,
      nodes: lintingDependencyMap.nodes,
    });
  }
  const { errors, updatedJSEntities } = getLintErrorsFromTree({
    pathsToLint: paths,
    unEvalTree: unevalTree,
    jsPropertiesState: {},
    cloudHosting: true,
    asyncJSFunctionsInDataFields: {},
    configTree,
  });

  console.log("After Linting", { updatedJSEntities, errors });

  return { errors, updatedJSEntities };
}
