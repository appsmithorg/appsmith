import type { ConfigTree, UnEvalTree } from "entities/DataTree/dataTreeFactory";
import type { TEntityTree } from "../utils/entityTree";
import { getEntityTreeWithParsedJS } from "../utils/entityTree";
import { createEntityTree } from "../utils/entityTree";
import { isEmpty, mapValues } from "lodash";
import {
  convertPathToString,
  getEntityNameAndPropertyPath,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import { diff } from "deep-diff";
import {
  addAppsmithGlobalFnsToDependencyMap,
  lintingDependencyMap,
} from "../utils/lintingDependencyMap";
import { AppsmithFunctionsWithFields } from "components/editorComponents/ActionCreator/constants";
import { PathUtils } from "Linting/utils/pathUtils";
import { extractReferencesFromPath } from "Linting/utils/getEntityDependencies";
import { jsActionsInDataField } from "Linting/utils/jsActionsInDataFields";
import { sortDifferencesByType } from "Linting/utils/sortDifferencesByType";
import { getAllPathsFromNode, isDynamicLeaf } from "Linting/utils/entityPath";
import type { LintTreeRequestPayload, LintTreeResponse } from "Linting/types";
import { getLintErrorsFromTree } from "Linting/utils/lintTree";
import { parsedJSEntitiesCache } from "Linting/utils/parseJSEntity";
import type { TJSPropertiesState } from "workers/Evaluation/JSObject/jsPropertiesState";

let cachedEntityTree: TEntityTree = {};

function initializeLinting() {
  if (isEmpty(cachedEntityTree)) {
    addAppsmithGlobalFnsToDependencyMap(AppsmithFunctionsWithFields);
    jsActionsInDataField.initialize();
  }
}

export function lintTreeV2({
  cloudHosting,
  configTree,
  unevalTree: unEvalTree,
}: LintTreeRequestPayload) {
  initializeLinting();
  const { pathsToLint } = isEmpty(cachedEntityTree)
    ? lintFirstTree(unEvalTree as UnEvalTree, configTree)
    : lintUpdatedTree(unEvalTree as UnEvalTree, configTree);
  const lintTreeResponse: LintTreeResponse = {
    errors: {},
    updatedJSEntities: [],
  };

  try {
    const { errors: lintErrors, updatedJSEntities } = getLintErrorsFromTree({
      pathsToLint,
      unEvalTree,
      jsPropertiesState: mapValues(parsedJSEntitiesCache, (parsedJSEntity) =>
        parsedJSEntity.getParsedEntityConfig(),
      ) as TJSPropertiesState,
      cloudHosting,
      asyncJSFunctionsInDataFields: jsActionsInDataField.getMap(),
      configTree,
    });

    lintTreeResponse.errors = lintErrors;
    lintTreeResponse.updatedJSEntities = updatedJSEntities;
  } catch (e) {}
  return lintTreeResponse;
}

function preProcessTree(unEvalTree: UnEvalTree, configTree: ConfigTree) {
  const entityTree = createEntityTree(unEvalTree, configTree);
  const entityTreeWithParsedJS = getEntityTreeWithParsedJS(entityTree);

  return { entityTree, entityTreeWithParsedJS };
}

function lintFirstTree(
  unEvalTree: UnEvalTree,
  configTree: ConfigTree,
): { pathsToLint: string[]; entityTree: TEntityTree } {
  const { entityTree, entityTreeWithParsedJS } = preProcessTree(
    unEvalTree,
    configTree,
  );
  const pathsToLint: Array<string> = [];
  const nodes: Record<string, true> = {};
  const dependencies: Record<string, string[]> = {};

  for (const entity of Object.values(entityTree)) {
    const dynamicPaths = PathUtils.getDynamicPaths(entity);
    for (const path of dynamicPaths) {
      const references = extractReferencesFromPath(
        entity,
        path,
        entityTreeWithParsedJS,
      );
      const updatedPaths = jsActionsInDataField.update(
        path,
        references,
        entityTree,
      );
      nodes[path] = true;
      dependencies[path] = references;
      pathsToLint.push(...updatedPaths, path);
    }
  }

  lintingDependencyMap.addNodes(nodes);
  for (const [path, references] of Object.entries(dependencies)) {
    lintingDependencyMap.addDependency(path, references);
  }

  cachedEntityTree = entityTree;

  return {
    pathsToLint,
    entityTree,
  };
}
function lintUpdatedTree(
  unEvalTree: UnEvalTree,
  configTree: ConfigTree,
): { pathsToLint: string[]; entityTree: TEntityTree } {
  const { entityTree, entityTreeWithParsedJS } = preProcessTree(
    unEvalTree,
    configTree,
  );

  const pathsToLint: string[] = [];
  const cachedEntityTreeWithParsedJS =
    getEntityTreeWithParsedJS(cachedEntityTree);
  const NOOP = {
    pathsToLint: [],
    entityTree,
  };
  const entityTreeDiff = diff(
    cachedEntityTreeWithParsedJS,
    entityTreeWithParsedJS,
  );

  if (!entityTreeDiff) return NOOP;
  const { additions, deletions, edits } = sortDifferencesByType(entityTreeDiff);

  const nodesToAdd: Record<string, true> = {};
  const nodesToRemove: Record<string, true> = {};
  const dependencies: Record<string, string[]> = {};
  const nodesToLintDependants: Record<string, true> = {};

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
    const references = extractReferencesFromPath(
      entity,
      pathString,
      entityTreeWithParsedJS,
    );
    const updatedPaths = jsActionsInDataField.handlePathEdit(
      pathString,
      references,
      entityTree,
    );
    dependencies[pathString] = references;
    nodesToAdd[pathString] = true;
    pathsToLint.push(...updatedPaths, pathString);
  }

  for (const addition of additions) {
    const pathString = convertPathToString(addition?.path || []);
    if (!pathString) continue;
    const { entityName } = getEntityNameAndPropertyPath(pathString);
    if (!entityName) continue;
    const entity = entityTree[entityName];
    if (!entity) continue;

    const allAddedPaths = getAllPathsFromNode(
      pathString,
      entityTreeWithParsedJS,
    );

    for (const path of Object.keys(allAddedPaths)) {
      if (!isDynamicLeaf(entity, path)) continue;
      const references = extractReferencesFromPath(
        entity,
        pathString,
        entityTreeWithParsedJS,
      );
      jsActionsInDataField.update(path, references, entityTree);
      nodesToAdd[path] = true;
      dependencies[path] = references;
      nodesToLintDependants[path] = true;
      pathsToLint.push(path);
    }
  }
  for (const deletion of deletions) {
    const pathString = convertPathToString(deletion?.path || []);
    if (!pathString) continue;
    const { entityName } = getEntityNameAndPropertyPath(pathString);
    if (!entityName) continue;
    const entity = entityTree[entityName];
    if (!entity) continue;

    const allDeletedPaths = getAllPathsFromNode(
      pathString,
      entityTreeWithParsedJS,
    );

    for (const path of Object.keys(allDeletedPaths)) {
      const updatedPaths = jsActionsInDataField.handlePathDeletion(
        path,
        entityTree,
      );
      nodesToRemove[path] = true;
      nodesToLintDependants[path] = true;
      pathsToLint.push(...updatedPaths);
    }
  }

  lintingDependencyMap.addNodes(nodesToAdd);
  lintingDependencyMap.removeNodes(nodesToRemove);
  for (const [path, pathDependencies] of Object.entries(dependencies)) {
    lintingDependencyMap.addDependency(path, pathDependencies);
  }
  for (const path of Object.keys(nodesToLintDependants)) {
    const pathsDependingOnNode =
      lintingDependencyMap.getIncomingDependencies(path);
    pathsToLint.push(...pathsDependingOnNode);
  }
  cachedEntityTree = entityTree;
  return {
    pathsToLint,
    entityTree,
  };
}
