import { isWidget } from "@appsmith/workers/Evaluation/evaluationUtils";
import type {
  WidgetEntity,
  WidgetEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import type { DependencyMap } from "utils/DynamicBindingUtils";

export function getValidationDependencies(
  entity: WidgetEntity,
  entityName: string,
  entityConfig: WidgetEntityConfig,
): DependencyMap {
  const validationDependency: DependencyMap = {};
  if (isWidget(entity)) {
    const { validationPaths } = entityConfig;

    Object.entries(validationPaths).forEach(
      ([propertyPath, validationConfig]) => {
        if (validationConfig.dependentPaths) {
          const dependencyArray = validationConfig.dependentPaths.map(
            (path) => `${entityName}.${path}`,
          );
          validationDependency[`${entityName}.${propertyPath}`] =
            dependencyArray;
        }
      },
    );
  }
  return validationDependency;
}
