import type { DataTreeDiff } from "@appsmith/workers/Evaluation/evaluationUtils";
import {
  getAllPaths,
  DataTreeDiffEvent,
  isWidget,
  isValidEntity,
  getEntityNameAndPropertyPath,
  isDynamicLeaf,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type {
  DataTree,
  WidgetEntity,
  ConfigTree,
  WidgetEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import type { ActionEntity, JSActionEntity } from "entities/DataTree/types";
import { getEvalErrorPath } from "utils/DynamicBindingUtils";
import { extractInfoFromBindings } from "./utils";
import type DataTreeEvaluator from "workers/common/DataTreeEvaluator";
import { get, isEmpty, set } from "lodash";
import { isWidgetActionOrJsObject } from "../DataTreeEvaluator/utils";
import DependencyMap from "entities/DependencyMap";
import {
  getEntityDependencies,
  getEntityPathDependencies,
} from "./utils/getEntityDependencies";
import { getValidationDependencies } from "./utils/getValidationDependencies";

interface CreateDependencyMap {
  dependencyMap: DependencyMap;
  validationDependencyMap: DependencyMap;
}

export function createDependencyMap(
  dataTreeEvalRef: DataTreeEvaluator,
  unEvalTree: DataTree,
  configTree: ConfigTree,
): CreateDependencyMap {
  const dependencyMap = new DependencyMap();
  const validationDependencyMap = new DependencyMap();
  dependencyMap.addNodes(dataTreeEvalRef.allKeys);
  validationDependencyMap.addNodes(dataTreeEvalRef.allKeys);

  Object.keys(configTree).forEach((entityName) => {
    const entity = unEvalTree[entityName];
    const entityConfig = configTree[entityName];
    const entityDependencies = getEntityDependencies(entity, entityConfig);

    for (const path of Object.keys(entityDependencies)) {
      const pathDependencies = entityDependencies[path];
      const { errors, references } = extractInfoFromBindings(pathDependencies);
      dependencyMap.addDependency(path, references);
      dataTreeEvalRef.errors.push(...errors);
    }

    if (isWidget(entity)) {
      // only widgets have validation paths
      const validationDependencies = getValidationDependencies(
        entity,
        entityName,
        entityConfig as WidgetEntityConfig,
      );
      for (const path of Object.keys(validationDependencies)) {
        validationDependencyMap.addDependency(
          path,
          validationDependencies[path],
        );
      }
    }
  });

  // TODO => Make parents depend on children

  return {
    dependencyMap,
    validationDependencyMap,
  };
}

interface UpdateDependencyMap {
  dependenciesOfRemovedPaths: string[];
  pathsToClearErrorsFor: string[];
  removedPaths: string[];
}
export const updateDependencyMap = ({
  configTree,
  dataTreeEvalRef,
  translatedDiffs,
  unEvalDataTree,
}: {
  dataTreeEvalRef: DataTreeEvaluator;
  translatedDiffs: Array<DataTreeDiff>;
  unEvalDataTree: DataTree;
  configTree: ConfigTree;
}): UpdateDependencyMap => {
  const diffCalcStart = performance.now();
  const dependenciesOfRemovedPaths: Array<string> = [];
  const removedPaths: Array<string> = [];
  const pathsToClearErrorsFor: any[] = [];
  const {
    dependencyMap,
    oldConfigTree,
    oldUnEvalTree,
    validationDependencyMap,
  } = dataTreeEvalRef;

  let { errors: dataTreeEvalErrors } = dataTreeEvalRef;

  translatedDiffs.forEach((dataTreeDiff) => {
    const {
      event,
      payload: { propertyPath: fullPropertyPath, value },
    } = dataTreeDiff;
    const { entityName } = getEntityNameAndPropertyPath(fullPropertyPath);
    const entityConfig =
      event === DataTreeDiffEvent.DELETE
        ? oldConfigTree[entityName]
        : configTree[entityName];

    const entity =
      event === DataTreeDiffEvent.DELETE
        ? oldUnEvalTree[entityName]
        : unEvalDataTree[entityName];
    const entityType = isValidEntity(entity) ? entity.ENTITY_TYPE : "noop";

    if (entityType !== "noop") {
      switch (event) {
        case DataTreeDiffEvent.NEW: {
          const allAddedPaths = getAllPaths({
            [fullPropertyPath]: get(unEvalDataTree, fullPropertyPath),
          });
          dependencyMap?.addNodes(allAddedPaths);

          if (isWidgetActionOrJsObject(entity)) {
            if (!isDynamicLeaf(unEvalDataTree, fullPropertyPath, configTree)) {
              const entityDependencyMap = getEntityDependencies(
                entity,
                configTree[entityName],
              );
              if (!isEmpty(entityDependencyMap)) {
                // The entity might already have some dependencies,
                // so we just want to update those
                Object.entries(entityDependencyMap).forEach(
                  ([path, pathDependencies]) => {
                    const { errors: extractDependencyErrors, references } =
                      extractInfoFromBindings(pathDependencies);
                    dependencyMap?.addDependency(path, references);
                    dataTreeEvalErrors = dataTreeEvalErrors.concat(
                      extractDependencyErrors,
                    );
                  },
                );
              }
              if (isWidget(entity)) {
                // For widgets,
                // we need to update the validation dependencyMap
                const validationDependencies = getValidationDependencies(
                  entity,
                  entityName,
                  entityConfig as WidgetEntityConfig,
                );
                for (const path of Object.keys(validationDependencies)) {
                  validationDependencyMap?.addDependency(
                    path,
                    validationDependencies[path],
                  );
                }
              }
            } else {
              const entityPathDependencies = getEntityPathDependencies(
                entity,
                entityConfig,
                fullPropertyPath,
              );
              const { errors: extractDependencyErrors, references } =
                extractInfoFromBindings(entityPathDependencies);
              dependencyMap?.addDependency(fullPropertyPath, references);
              dataTreeEvalErrors = dataTreeEvalErrors.concat(
                extractDependencyErrors,
              );

              if (isWidget(entity)) {
                // update validation dependencies
                const validationDependencies = getValidationDependencies(
                  entity,
                  entityName,
                  entityConfig as WidgetEntityConfig,
                );
                for (const path of Object.keys(validationDependencies)) {
                  validationDependencyMap?.addDependency(
                    path,
                    validationDependencies[path],
                  );
                }
              }
            }
          }
          break;
        }
        case DataTreeDiffEvent.DELETE: {
          const allDeletedPaths = getAllPaths({
            [fullPropertyPath]: get(oldUnEvalTree, fullPropertyPath),
          });
          dependencyMap?.removeNodes(allDeletedPaths);
          validationDependencyMap?.removeNodes(allDeletedPaths);
          // Add to removedPaths as they have been deleted from the evalTree
          removedPaths.push(fullPropertyPath);
          // If an existing entity was deleted, remove all the bindings from the global dependency map

          /**There are certain cases where the child paths of the entity could have errors and
           *  need them to be cleared post evaluations. Therefore we store all the paths that are
           * removed on deleting the entity and use that reference to clear the error logs post evaluation*/
          if (isWidget(entity)) {
            pathsToClearErrorsFor.push({
              widgetId: entity?.widgetId,
              paths: [
                fullPropertyPath,
                dependencyMap?.getDirectDependencies(fullPropertyPath),
              ],
            });
          }
          break;
        }
        case DataTreeDiffEvent.EDIT: {
          if (isWidgetActionOrJsObject(entity) && typeof value === "string") {
            const entity: ActionEntity | WidgetEntity | JSActionEntity =
              unEvalDataTree[entityName] as
                | ActionEntity
                | WidgetEntity
                | JSActionEntity;
            const entityConfig = configTree[entityName];
            const fullPropertyPath = dataTreeDiff.payload.propertyPath;

            const entityPathDependencies = getEntityPathDependencies(
              entity,
              entityConfig,
              fullPropertyPath,
            );

            const { errors: extractDependencyErrors, references } =
              extractInfoFromBindings(entityPathDependencies);
            dependencyMap?.addDependency(fullPropertyPath, references);

            dataTreeEvalErrors = dataTreeEvalErrors.concat(
              extractDependencyErrors,
            );
          }
          break;
        }
        default: {
          break;
        }
      }
    }
  });

  const diffCalcEnd = performance.now();
  const subDepCalcStart = performance.now();
  // TODO => Optimize for only when dependencyMap updates
  // TODO => makeParentsDependOnChildren
  // TODO => Sort dependencies to prevent cyclic dependencies
  // TODO => Sort dependencies (validation deps) to prevent cyclic dependencies only when dep changes

  const subDepCalcEnd = performance.now();
  const updateChangedDependenciesStart = performance.now();

  /** We need this in order clear out the paths that could have errors when a property is deleted */
  if (pathsToClearErrorsFor.length) {
    pathsToClearErrorsFor.forEach((error) => {
      error.paths.forEach((path: string) => {
        set(dataTreeEvalRef.evalProps, getEvalErrorPath(path), []);
      });
    });
  }

  const updateChangedDependenciesStop = performance.now();
  dataTreeEvalRef.logs.push({
    diffCalcDeps: (diffCalcEnd - diffCalcStart).toFixed(2),
    subDepCalc: (subDepCalcEnd - subDepCalcStart).toFixed(2),
    updateChangedDependencies: (
      updateChangedDependenciesStop - updateChangedDependenciesStart
    ).toFixed(2),
  });

  return {
    pathsToClearErrorsFor,
    dependenciesOfRemovedPaths,
    removedPaths,
  };
};
