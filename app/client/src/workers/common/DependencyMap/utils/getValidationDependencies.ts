import { isWidget } from "@appsmith/workers/Evaluation/evaluationUtils";
import type {
  DataTreeEntity,
  DataTreeEntityConfig,
  WidgetEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import type { DependencyMap } from "utils/DynamicBindingUtils";

export function getValidationDependencies(
  entity: DataTreeEntity,
  entityName: string,
  entityConfig: DataTreeEntityConfig,
): DependencyMap {
  const validationDependency: DependencyMap = {};
  if (!isWidget(entity)) return validationDependency;

  const { validationPaths } = entityConfig as WidgetEntityConfig;

  Object.entries(validationPaths).forEach(
    ([propertyPath, validationConfig]) => {
      if (validationConfig.dependentPaths) {
        const dependencyArray = validationConfig.dependentPaths.map(
          (path) => `${entityName}.${path}`,
        );
        validationDependency[`${entityName}.${propertyPath}`] = dependencyArray;
      }
    },
  );

  return validationDependency;
}
