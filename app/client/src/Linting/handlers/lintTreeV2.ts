import type { ConfigTree, UnEvalTree } from "entities/DataTree/dataTreeFactory";
import type { TEntityTree, TEntityTreeWithParsedJS } from "../utils/entityTree";
import { getEntityTreeWithParsedJS } from "../utils/entityTree";
import { createEntityTree } from "../utils/entityTree";
import { flatten, isEmpty } from "lodash";
import { getAllPaths } from "@appsmith/workers/Evaluation/evaluationUtils";

import { sortDependencies } from "../utils/sortDependencies";
import type { Diff } from "deep-diff";
import { diff } from "deep-diff";
import { translateDiffEventToDataTreeDiffEvent } from "../utils/translateEntityTreeDiffs";
import {
  addAppsmithGlobalFnsToDependencyMap,
  createDependency,
  updateDependency,
} from "../utils/lintingDependencyMap";
import { generateSortOrder, getDynamicNodes } from "../utils/generateSortOrder";
import { AppsmithFunctionsWithFields } from "components/editorComponents/ActionCreator/constants";

let cachedEntityTree: TEntityTree = {};

function initializeLinting() {
  isEmpty(cachedEntityTree) &&
    addAppsmithGlobalFnsToDependencyMap(AppsmithFunctionsWithFields);
}

export function lintTreeV2(unEvalTree: UnEvalTree, configTree: ConfigTree) {
  initializeLinting();
  return isEmpty(cachedEntityTree)
    ? lintFirstTree(unEvalTree, configTree)
    : lintUpdatedTree(unEvalTree, configTree);
}

function preProcessTree(unEvalTree: UnEvalTree, configTree: ConfigTree) {
  const entityTree = createEntityTree(unEvalTree, configTree);
  const entityTreeWithParsedJS = getEntityTreeWithParsedJS(entityTree);
  const allPaths = getAllPaths(entityTreeWithParsedJS);

  return { entityTree, entityTreeWithParsedJS, allPaths };
}

function lintFirstTree(unEvalTree: UnEvalTree, configTree: ConfigTree) {
  const { allPaths, entityTree } = preProcessTree(unEvalTree, configTree);
  const dependencies = createDependency(entityTree, allPaths);
  const sortedDependencies = sortDependencies(dependencies);
  const lintOrder = getDynamicNodes(sortedDependencies, entityTree);
  cachedEntityTree = entityTree;
  return {
    lintOrder,
    entityTree,
  };
}
function lintUpdatedTree(unEvalTree: UnEvalTree, configTree: ConfigTree) {
  const { allPaths, entityTree, entityTreeWithParsedJS } = preProcessTree(
    unEvalTree,
    configTree,
  );

  const cachedEntityTreeWithParsedJS =
    getEntityTreeWithParsedJS(cachedEntityTree);
  const entityTreeDiff: Diff<TEntityTreeWithParsedJS>[] =
    diff(cachedEntityTreeWithParsedJS, entityTreeWithParsedJS) || [];
  const translatedDiffs = flatten(
    entityTreeDiff.map((diff) =>
      translateDiffEventToDataTreeDiffEvent(diff, entityTree),
    ),
  );
  updateDependency(
    translatedDiffs,
    entityTree,
    cachedEntityTree,
    entityTreeWithParsedJS,
    allPaths,
  );
  const sortOrder = generateSortOrder(
    translatedDiffs,
    entityTreeWithParsedJS,
    entityTree,
  );
  return {
    lintOrder: sortOrder,
    entityTree,
  };
}
