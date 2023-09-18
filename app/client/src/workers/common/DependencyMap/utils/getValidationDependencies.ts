import { isWidget } from "@appsmith/workers/Evaluation/evaluationUtils";
import type {
  DataTreeEntity,
  DataTreeEntityConfig,
  WidgetEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import type { DependencyMap } from "utils/DynamicBindingUtils";

const DATA_DERIVED_PROPERTY_PLACEHOLDER = "*";

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
        const propertyPathsSplitArray = propertyPath.split(".");
        const dependencyArray = validationConfig.dependentPaths.map((path) => {
          const pathSplitArray = path.split(".");
          /**
           * Below logic add support for data derived paths in validation dependencies
           * dependentPaths: ["primaryColumns.*.computedValue"]
           *
           * Here, items.*.value is a data derived path and we need to replace * with the actual value resulting in "primaryColumns.columnName.computedValue" as dependency.
           */
          const index = pathSplitArray.indexOf(
            DATA_DERIVED_PROPERTY_PLACEHOLDER,
          );
          if (index > -1) {
            // replace * in pathSplitArray with same position value in propertyPathsSplitArray
            for (let i = 0; i < pathSplitArray.length; i++) {
              if (pathSplitArray[i] === DATA_DERIVED_PROPERTY_PLACEHOLDER) {
                pathSplitArray[i] = propertyPathsSplitArray[i];
              }
            }
            return `${entityName}.${pathSplitArray.join(".")}`;
          }
          return `${entityName}.${path}`;
        });
        validationDependency[`${entityName}.${propertyPath}`] = dependencyArray;
      }
    },
  );

  return validationDependency;
}
