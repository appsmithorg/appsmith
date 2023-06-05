import type { ConfigTree, UnEvalTree } from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import DependencyMap from "entities/DependencyMap";
import { getEntitiesOfType } from "./getEntityOfType";
import type { JSEntity } from "Linting/lib/entity";
import { isJSEntity } from "Linting/lib/entity";
import { createEntityTree } from "./createEntityTree";
import { ParsedJSObjectState, setParsedJSEntities } from "./jsEntity";
import { flatten, mapValues } from "lodash";
import { getAllPaths } from "@appsmith/workers/Evaluation/evaluationUtils";
import { getEntityDependencies } from "./getEntityDependencies";
import { extractIdentifierInfoFromCode as extractReferences } from "@shared/ast";

const dependencyMap = new DependencyMap();

class Linter {
  cachedEntityTree = null;
  lintFirstTree(unEvalTree: UnEvalTree, configTree: ConfigTree) {
    const entityTree = createEntityTree(unEvalTree, configTree);
    const jsActions = getEntitiesOfType<JSEntity>(
      ENTITY_TYPE.JSACTION,
      entityTree,
    );
    const parsedJSActions = ParsedJSObjectState.parseJSEntities(jsActions);
    setParsedJSEntities(entityTree, parsedJSActions);
    const entityTreeWithParsedJS = mapValues(entityTree, (entity) => {
      return isJSEntity(entity)
        ? entity.getParsedEntity()
        : entity.getRawEntity();
    });

    const allPaths = getAllPaths(entityTreeWithParsedJS);
    // Create all nodes
    dependencyMap.addNodes(allPaths);

    // Create dependency map
    for (const entity of Object.values(entityTree)) {
      const entityDependencies = getEntityDependencies(entity);
      if (!entityDependencies) continue;
      for (const [propertyPath, dependenciesInPath] of Object.entries(
        entityDependencies,
      )) {
        const referencesInPropertyPath = flatten(
          dependenciesInPath.map(
            (dependency) => extractReferences(dependency, 2).references,
          ),
        );

        dependencyMap.addDependency(propertyPath, referencesInPropertyPath);
      }
    }
    // MakeParentDependOnChildren skipped
  }
}

export const linter = new Linter();
