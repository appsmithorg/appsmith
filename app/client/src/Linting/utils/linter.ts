import type { ConfigTree, UnEvalTree } from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { getEntitiesOfType } from "./getEntityOfType";
import type { JSEntity } from "Linting/lib/entity";
import type { TEntityTree } from "./entityTree";
import { getEntityTreeWithParsedJS } from "./entityTree";
import { createEntityTree } from "./entityTree";
import { ParsedJSEntities, setParsedJSEntities } from "./jsEntity";
import { flatten, isEmpty } from "lodash";
import { getAllPaths } from "@appsmith/workers/Evaluation/evaluationUtils";

import { sortDependencies } from "./sortDependencies";
import type { Diff } from "deep-diff";
import { diff } from "deep-diff";
import { translateDiffEventToDataTreeDiffEvent } from "./translateEntityTreeDiffs";
import {
  addAppsmithGlobalFnsToDependencyMap,
  createDependency,
  updateDependency,
} from "./dependencyMap";
import { generateSortOrder, getDynamicNodes } from "./generateSortOrder";
import { AppsmithFunctionsWithFields } from "components/editorComponents/ActionCreator/constants";

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
  constructor() {
    addAppsmithGlobalFnsToDependencyMap(AppsmithFunctionsWithFields);
  }
  lintTree(unEvalTree: UnEvalTree, configTree: ConfigTree) {
    return isEmpty(this.cachedEntityTree)
      ? this.lintFirstTree(unEvalTree, configTree)
      : this.lintUpdatedTree(unEvalTree, configTree);
  }
  private lintFirstTree(unEvalTree: UnEvalTree, configTree: ConfigTree) {
    const { allPaths, entityTree } = this.setup(unEvalTree, configTree);
    const dependencies = createDependency(entityTree, allPaths);
    const sortedDependencies = sortDependencies(dependencies);
    const lintOrder = getDynamicNodes(sortedDependencies, entityTree);
    this.cachedEntityTree = entityTree;
    return {
      lintOrder,
      entityTree,
    };
  }

  private lintUpdatedTree(unEvalTree: UnEvalTree, configTree: ConfigTree) {
    const { allPaths, entityTree, entityTreeWithParsedJS } = this.setup(
      unEvalTree,
      configTree,
    );
    const cachedEntityTree = this.cachedEntityTree;
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
  private setup(unEvalTree: UnEvalTree, configTree: ConfigTree) {
    const entityTree = createEntityTree(unEvalTree, configTree);
    const jsActions = getEntitiesOfType<JSEntity>(
      ENTITY_TYPE.JSACTION,
      entityTree,
    );
    const parsedJSEntities = ParsedJSEntities.parseJSEntities(jsActions);
    setParsedJSEntities(entityTree, parsedJSEntities);
    const entityTreeWithParsedJS = getEntityTreeWithParsedJS(entityTree);
    const allPaths = getAllPaths(entityTreeWithParsedJS);

    return { entityTree, entityTreeWithParsedJS, allPaths };
  }
}

export const linter = new Linter();
