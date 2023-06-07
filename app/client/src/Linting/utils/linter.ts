import type { ConfigTree, UnEvalTree } from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { getEntitiesOfType } from "./getEntityOfType";
import type { JSEntity } from "Linting/lib/entity";
import type { TEntityTree } from "./entityTree";
import { getEntityTreeWithParsedJS } from "./entityTree";
import { createEntityTree } from "./entityTree";
import { ParsedJSObjectState, setParsedJSEntities } from "./jsEntity";
import { flatten, isEmpty } from "lodash";
import { getAllPaths } from "@appsmith/workers/Evaluation/evaluationUtils";

import { sortDependencies } from "./sortDependencies";
import type { Diff } from "deep-diff";
import { diff } from "deep-diff";
import { translateDiffEventToDataTreeDiffEvent } from "./translateEntityTreeDiffs";
import {
  createDependency,
  dependencyMap,
  updateDependency,
} from "./dependencyMap";

type TLintTree = (
  unEvalTree: UnEvalTree,
  configTree: ConfigTree,
) => {
  lintOrder: string[];
  entityTree: TEntityTree;
};

type TLinter = {
  lintTree: TLintTree;
};

export type TEntityTreeWithParsedJS = ReturnType<
  typeof getEntityTreeWithParsedJS
>;

class Linter implements TLinter {
  cachedEntityTree: TEntityTree = {};
  lintTree(unEvalTree: UnEvalTree, configTree: ConfigTree) {
    return isEmpty(this.cachedEntityTree)
      ? this.lintFirstTree(unEvalTree, configTree)
      : this.lintUpdatedTree(unEvalTree, configTree);
  }
  lintFirstTree(unEvalTree: UnEvalTree, configTree: ConfigTree) {
    const entityTree = createEntityTree(unEvalTree, configTree);
    const jsActions = getEntitiesOfType<JSEntity>(
      ENTITY_TYPE.JSACTION,
      entityTree,
    );
    const parsedJSActions = ParsedJSObjectState.parseJSEntities(jsActions);
    setParsedJSEntities(entityTree, parsedJSActions);
    const entityTreeWithParsedJS = getEntityTreeWithParsedJS(entityTree);

    const allPaths = getAllPaths(entityTreeWithParsedJS);

    createDependency(entityTree, allPaths);

    // MakeParentDependOnChildren skipped

    // sort dependencies
    const sortedDependencies = sortDependencies(
      dependencyMap.getDependencies(),
    );

    // Cache tree
    this.cachedEntityTree = entityTree;

    return {
      lintOrder: sortedDependencies,
      entityTree,
    };
  }

  lintUpdatedTree(unEvalTree: UnEvalTree, configTree: ConfigTree) {
    const entityTree = createEntityTree(unEvalTree, configTree);
    const cachedEntityTree = this.cachedEntityTree;
    const jsActions = getEntitiesOfType<JSEntity>(
      ENTITY_TYPE.JSACTION,
      entityTree,
    );
    const parsedJSActions = ParsedJSObjectState.parseJSEntities(jsActions);
    setParsedJSEntities(entityTree, parsedJSActions);
    const entityTreeWithParsedJS = getEntityTreeWithParsedJS(entityTree);
    const cachedEntityTreeWithParsedJS =
      getEntityTreeWithParsedJS(cachedEntityTree);
    // Calculate diff
    const entityTreeDiff: Diff<TEntityTreeWithParsedJS>[] =
      diff(cachedEntityTreeWithParsedJS, entityTreeWithParsedJS) || [];

    // Translate diffs
    const translatedDiffs = flatten(
      entityTreeDiff.map((diff) =>
        translateDiffEventToDataTreeDiffEvent(diff, entityTree),
      ),
    );

    // Update dependency
    const allPaths = getAllPaths(entityTreeWithParsedJS);

    updateDependency(
      translatedDiffs,
      entityTree,
      cachedEntityTree,
      entityTreeWithParsedJS,
      allPaths,
    );

    return {
      lintOrder: [],
      entityTree: {},
    };
  }
}

export const linter = new Linter();
