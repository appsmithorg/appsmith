import type { ConfigTree, UnEvalTree } from "entities/DataTree/dataTreeFactory";
import type { TEntityTree } from "../utils/entityTree";
import { getUnevalEntityTree } from "../utils/entityTree";
import { createEntityTree } from "../utils/entityTree";
import { isEmpty, mapValues } from "lodash";
import {
  convertPathToString,
  getAllPaths,
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
import { getAllPathsFromNode } from "Linting/utils/entityPath";
import type { LintTreeRequestPayload, LintTreeResponse } from "Linting/types";
import { getLintErrorsFromTree } from "Linting/utils/lintTree";
import {
  parsedJSEntitiesCache,
  updateTreeWithParsedJS,
} from "Linting/utils/parseJSEntity";
import type { TJSPropertiesState } from "workers/Evaluation/JSObject/jsPropertiesState";
import { isDynamicLeaf } from "Linting/utils/entityPath";

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
    const jsPropertiesState = mapValues(
      parsedJSEntitiesCache,
      (parsedJSEntity) => parsedJSEntity.getParsedEntityConfig(),
    ) as TJSPropertiesState;
    const { errors: lintErrors, updatedJSEntities } = getLintErrorsFromTree({
      pathsToLint,
      unEvalTree: getUnevalEntityTree(cachedEntityTree),
      jsPropertiesState,
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
  updateTreeWithParsedJS(entityTree);
  const unevalEntityTree = getUnevalEntityTree(entityTree);

  return { entityTree, unevalEntityTree };
}

function lintFirstTree(
  unEvalTree: UnEvalTree,
  configTree: ConfigTree,
): { pathsToLint: string[]; entityTree: TEntityTree } {
  const { entityTree, unevalEntityTree } = preProcessTree(
    unEvalTree,
    configTree,
  );
  const pathsToLint: Array<string> = [];
  const allNodes: Record<string, true> = getAllPaths(unevalEntityTree);
  lintingDependencyMap.addNodes(allNodes);

  for (const entity of Object.values(entityTree)) {
    const dynamicPaths = PathUtils.getDynamicPaths(entity);
    for (const path of dynamicPaths) {
      const references = extractReferencesFromPath(
        entity,
        path,
        unevalEntityTree,
      );
      const updatedPaths = jsActionsInDataField.update(
        path,
        references,
        entityTree,
      );

      lintingDependencyMap.addDependency(path, references);
      pathsToLint.push(...updatedPaths, path);
    }
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
  const { entityTree, unevalEntityTree } = preProcessTree(
    unEvalTree,
    configTree,
  );

  const pathsToLint: string[] = [];
  const cachedUnevalEntityTree = getUnevalEntityTree(cachedEntityTree);

  const NOOP = {
    pathsToLint: [],
    entityTree,
  };
  const entityTreeDiff = diff(cachedUnevalEntityTree, unevalEntityTree);

  if (!entityTreeDiff) return NOOP;
  const { additions, deletions, edits } = sortDifferencesByType(entityTreeDiff);

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
      unevalEntityTree,
    );
    lintingDependencyMap.addDependency(pathString, references);
    const updatedPaths = jsActionsInDataField.handlePathEdit(
      pathString,
      references,
      entityTree,
    );
    pathsToLint.push(...updatedPaths, pathString);
  }

  for (const addition of additions) {
    const pathString = convertPathToString(addition?.path || []);
    if (!pathString) continue;
    const { entityName } = getEntityNameAndPropertyPath(pathString);
    if (!entityName) continue;
    const entity = entityTree[entityName];
    if (!entity) continue;

    const allAddedPaths = getAllPathsFromNode(pathString, unevalEntityTree);
    lintingDependencyMap.addNodes(allAddedPaths);
    for (const path of Object.keys(allAddedPaths)) {
      const references = extractReferencesFromPath(
        entity,
        pathString,
        unevalEntityTree,
      );
      if (isDynamicLeaf(entity, path)) {
        lintingDependencyMap.addDependency(path, references);
        pathsToLint.push(path);
      }
      const updatedPaths = jsActionsInDataField.update(
        path,
        references,
        entityTree,
      );
      const incomingDeps = lintingDependencyMap.getIncomingDependencies(path);
      pathsToLint.push(...updatedPaths, ...incomingDeps);
    }
  }
  for (const deletion of deletions) {
    const pathString = convertPathToString(deletion?.path || []);
    if (!pathString) continue;
    const { entityName } = getEntityNameAndPropertyPath(pathString);
    if (!entityName) continue;
    const entity = cachedEntityTree[entityName]; // Use previous tree in a DELETE EVENT
    if (!entity) continue;

    const allDeletedPaths = getAllPathsFromNode(pathString, unevalEntityTree);

    for (const path of Object.keys(allDeletedPaths)) {
      const updatedPaths = jsActionsInDataField.handlePathDeletion(
        path,
        entityTree,
      );
      const incomingDeps = lintingDependencyMap.getIncomingDependencies(path);
      pathsToLint.push(...updatedPaths, ...incomingDeps);
    }
    lintingDependencyMap.removeNodes(allDeletedPaths);
  }

  cachedEntityTree = entityTree;
  return {
    pathsToLint,
    entityTree,
  };
}
