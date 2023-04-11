import { extractIdentifierInfoFromCode } from "@shared/ast";
import { getAllPaths, isWidget } from "ce/workers/Evaluation/evaluationUtils";
import type {
  ConfigTree,
  UnEvalTree,
  WidgetEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import DependencyMap from "entities/DependencyMap";
import { flatten } from "lodash";
import { listTriggerFieldDependencies } from "workers/common/DependencyMap/utils";

const triggerFieldDependencyMap = new DependencyMap();

export function lint(unEvalTree: UnEvalTree, configTree: ConfigTree) {
  const entityNames = Object.keys(configTree);
  const allPaths = getAllPaths(unEvalTree);

  triggerFieldDependencyMap.addNodes(allPaths);

  let dependencies: Record<string, string[]> = {};

  for (const entityName of entityNames) {
    const entity = unEvalTree[entityName];
    if (isWidget(entity)) {
      const map = listTriggerFieldDependencies(
        entity,
        entityName,
        configTree[entityName] as WidgetEntityConfig,
      );
      dependencies = { ...dependencies, ...map };
    }
  }

  for (const [key, value] of Object.entries(dependencies)) {
    dependencies[key] = flatten(
      value.map((v) => extractIdentifierInfoFromCode(v, 2).references),
    );
  }

  const dependenciesMap = new Map(Object.entries(dependencies));

  for (const [key, value] of dependenciesMap.entries()) {
    triggerFieldDependencyMap.addDependency(key, value);
  }

  console.log({ triggerFieldDependencyMap });
}
