import {
  DataTreeDiff,
  getAllPaths,
  DataTreeDiffEvent,
  isWidget,
  isAction,
  isJSAction,
  makeParentsDependOnChildren,
  isDynamicLeaf,
  isValidEntity,
} from "workers/evaluationUtils";
import {
  DataTree,
  DataTreeAction,
  DataTreeWidget,
  DataTreeJSAction,
} from "entities/DataTree/dataTreeFactory";
import {
  DependencyMap,
  isChildPropertyPath,
  getPropertyPath,
  isPathADynamicBinding,
  getDynamicBindings,
  EvalErrorTypes,
  isPathADynamicTrigger,
} from "utils/DynamicBindingUtils";
import {
  extractReferencesFromBinding,
  getEntityReferencesFromPropertyBindings,
} from "./utils";
import DataTreeEvaluator from "workers/DataTreeEvaluator";
import { flatten, difference, uniq } from "lodash";

export function createDependencyMap(
  dataTreeEvalRef: DataTreeEvaluator,
  unEvalTree: DataTree,
): { dependencyMap: DependencyMap; triggerFieldDependencyMap: DependencyMap } {
  let dependencyMap: DependencyMap = {};
  let triggerFieldDependencyMap: DependencyMap = {};
  Object.keys(unEvalTree).forEach((entityName) => {
    const entity = unEvalTree[entityName];
    if (isAction(entity) || isWidget(entity) || isJSAction(entity)) {
      const entityListedDependencies = dataTreeEvalRef.listEntityDependencies(
        entity,
        entityName,
      );
      dependencyMap = { ...dependencyMap, ...entityListedDependencies };
    }
    if (isWidget(entity)) {
      // only widgets have trigger paths
      triggerFieldDependencyMap = {
        ...triggerFieldDependencyMap,
        ...dataTreeEvalRef.listTriggerFieldDependencies(entity, entityName),
      };
    }
  });
  Object.keys(dependencyMap).forEach((key) => {
    const newDep = dependencyMap[key].map((path) => {
      try {
        return extractReferencesFromBinding(path, dataTreeEvalRef.allKeys);
      } catch (error) {
        dataTreeEvalRef.errors.push({
          type: EvalErrorTypes.EXTRACT_DEPENDENCY_ERROR,
          message: (error as Error).message,
          context: {
            script: path,
          },
        });
        return [];
      }
    });

    dependencyMap[key] = flatten(newDep);
  });

  // extract references from bindings
  Object.keys(triggerFieldDependencyMap).forEach((key) => {
    triggerFieldDependencyMap[key] = getEntityReferencesFromPropertyBindings(
      triggerFieldDependencyMap[key],
      dataTreeEvalRef,
    );
  });
  dependencyMap = makeParentsDependOnChildren(
    dependencyMap,
    dataTreeEvalRef.allKeys,
  );
  return { dependencyMap, triggerFieldDependencyMap };
}

export const updateDependencyMap = ({
  dataTreeEvalRef,
  translatedDiffs,
  unEvalDataTree,
}: {
  dataTreeEvalRef: DataTreeEvaluator;
  translatedDiffs: Array<DataTreeDiff>;
  unEvalDataTree: DataTree;
}) => {
  const diffCalcStart = performance.now();
  let didUpdateDependencyMap = false;
  let triggerPathsToLint: string[] = [];
  let didUpdateTriggerDependencyMap = false;
  const dependenciesOfRemovedPaths: Array<string> = [];
  const removedPaths: Array<string> = [];

  // This is needed for NEW and DELETE events below.
  // In worst case, it tends to take ~12.5% of entire diffCalc (8 ms out of 67ms for 132 array of NEW)
  // TODO: Optimise by only getting paths of changed node
  dataTreeEvalRef.allKeys = getAllPaths(unEvalDataTree);
  // Transform the diff library events to Appsmith evaluator events
  translatedDiffs.forEach((dataTreeDiff) => {
    const entityName = dataTreeDiff.payload.propertyPath.split(".")[0];
    let entity = unEvalDataTree[entityName];
    if (dataTreeDiff.event === DataTreeDiffEvent.DELETE) {
      entity = dataTreeEvalRef.oldUnEvalTree[entityName];
    }
    const entityType = isValidEntity(entity) ? entity.ENTITY_TYPE : "noop";

    if (entityType !== "noop") {
      switch (dataTreeDiff.event) {
        case DataTreeDiffEvent.NEW: {
          // If a new entity/property was added, add all the internal bindings for this entity to the global dependency map
          if (
            (isWidget(entity) || isAction(entity) || isJSAction(entity)) &&
            !isDynamicLeaf(unEvalDataTree, dataTreeDiff.payload.propertyPath)
          ) {
            const entityDependencyMap: DependencyMap = dataTreeEvalRef.listEntityDependencies(
              entity,
              entityName,
            );
            if (Object.keys(entityDependencyMap).length) {
              didUpdateDependencyMap = true;
              // The entity might already have some dependencies,
              // so we just want to update those
              Object.entries(entityDependencyMap).forEach(
                ([entityDependent, entityDependencies]) => {
                  if (dataTreeEvalRef.dependencyMap[entityDependent]) {
                    dataTreeEvalRef.dependencyMap[
                      entityDependent
                    ] = dataTreeEvalRef.dependencyMap[entityDependent].concat(
                      entityDependencies,
                    );
                  } else {
                    dataTreeEvalRef.dependencyMap[
                      entityDependent
                    ] = entityDependencies;
                  }
                },
              );
            }
          }
          // Either a new entity or a new property path has been added. Go through existing dynamic bindings and
          // find out if a new dependency has to be created because the property path used in the binding just became
          // eligible
          const possibleReferencesInOldBindings: DependencyMap = dataTreeEvalRef.getPropertyPathReferencesInExistingBindings(
            unEvalDataTree,
            dataTreeDiff.payload.propertyPath,
          );
          // We have found some bindings which are related to the new property path and hence should be added to the
          // global dependency map
          if (Object.keys(possibleReferencesInOldBindings).length) {
            didUpdateDependencyMap = true;
            Object.assign(
              dataTreeEvalRef.dependencyMap,
              possibleReferencesInOldBindings,
            );
          }
          // When a new Entity is added, check if a new dependency has been created because the property path used in the binding just became valid
          if (entityName === dataTreeDiff.payload.propertyPath) {
            const possibleTriggerFieldReferences = dataTreeEvalRef.getTriggerFieldReferencesInExistingBindings(
              unEvalDataTree,
              entityName,
            );
            if (Object.keys(possibleTriggerFieldReferences).length) {
              didUpdateTriggerDependencyMap = true;
              Object.assign(
                dataTreeEvalRef.triggerFieldDependencyMap,
                possibleTriggerFieldReferences,
              );
              Object.keys(possibleTriggerFieldReferences).forEach(
                (triggerPath) => {
                  triggerPathsToLint.push(triggerPath);
                },
              );
            }
          }
          break;
        }
        case DataTreeDiffEvent.DELETE: {
          // Add to removedPaths as they have been deleted from the evalTree
          removedPaths.push(dataTreeDiff.payload.propertyPath);
          // If an existing widget was deleted, remove all the bindings from the global dependency map
          if (
            (isWidget(entity) || isAction(entity) || isJSAction(entity)) &&
            dataTreeDiff.payload.propertyPath === entityName
          ) {
            const entityDependencies = dataTreeEvalRef.listEntityDependencies(
              entity,
              entityName,
            );
            Object.keys(entityDependencies).forEach((widgetDep) => {
              didUpdateDependencyMap = true;
              delete dataTreeEvalRef.dependencyMap[widgetDep];
            });
          }
          // Either an existing entity or an existing property path has been deleted. Update the global dependency map
          // by removing the bindings from the same.
          Object.keys(dataTreeEvalRef.dependencyMap).forEach(
            (dependencyPath) => {
              didUpdateDependencyMap = true;
              if (
                isChildPropertyPath(
                  dataTreeDiff.payload.propertyPath,
                  dependencyPath,
                )
              ) {
                delete dataTreeEvalRef.dependencyMap[dependencyPath];
              } else {
                const toRemove: Array<string> = [];
                dataTreeEvalRef.dependencyMap[dependencyPath].forEach(
                  (dependantPath) => {
                    if (
                      isChildPropertyPath(
                        dataTreeDiff.payload.propertyPath,
                        dependantPath,
                      )
                    ) {
                      dependenciesOfRemovedPaths.push(dependencyPath);
                      toRemove.push(dependantPath);
                    }
                  },
                );
                dataTreeEvalRef.dependencyMap[dependencyPath] = difference(
                  dataTreeEvalRef.dependencyMap[dependencyPath],
                  toRemove,
                );
              }
            },
          );
          if (entityName === dataTreeDiff.payload.propertyPath) {
            // When deleted entity is referenced in a trigger field, remove deleted entity from it's triggerfieldDependencyMap
            if (
              entityName in dataTreeEvalRef.triggerFieldInverseDependencyMap
            ) {
              triggerPathsToLint = triggerPathsToLint.concat(
                dataTreeEvalRef.triggerFieldInverseDependencyMap[entityName],
              );
              didUpdateTriggerDependencyMap = true;
              dataTreeEvalRef.triggerFieldInverseDependencyMap[
                entityName
              ].forEach((triggerField) => {
                if (!dataTreeEvalRef.triggerFieldDependencyMap[triggerField])
                  return;
                dataTreeEvalRef.triggerFieldDependencyMap[
                  triggerField
                ] = dataTreeEvalRef.triggerFieldDependencyMap[
                  triggerField
                ].filter((field) => field !== entityName);
              });
            }

            // Remove deleted trigger fields from triggerFieldDependencyMap
            if (isWidget(entity)) {
              entity.dynamicTriggerPathList?.forEach((triggerFieldName) => {
                delete dataTreeEvalRef.triggerFieldDependencyMap[
                  `${entityName}.${triggerFieldName.key}`
                ];
                didUpdateTriggerDependencyMap = true;
              });
            }
          }

          break;
        }
        case DataTreeDiffEvent.EDIT: {
          // We only care if the difference is in dynamic bindings since static values do not need
          // an evaluation.
          if (
            (isWidget(entity) || isAction(entity) || isJSAction(entity)) &&
            typeof dataTreeDiff.payload.value === "string"
          ) {
            const entity:
              | DataTreeAction
              | DataTreeWidget
              | DataTreeJSAction = unEvalDataTree[entityName] as
              | DataTreeAction
              | DataTreeWidget
              | DataTreeJSAction;
            const fullPropertyPath = dataTreeDiff.payload.propertyPath;
            const entityPropertyPath = getPropertyPath(fullPropertyPath);
            const isADynamicBindingPath = isPathADynamicBinding(
              entity,
              entityPropertyPath,
            );
            if (isADynamicBindingPath) {
              didUpdateDependencyMap = true;

              const { jsSnippets } = getDynamicBindings(
                dataTreeDiff.payload.value,
                entity,
              );
              const correctSnippets = jsSnippets.filter(
                (jsSnippet) => !!jsSnippet,
              );
              // We found a new dynamic binding for this property path. We update the dependency map by overwriting the
              // dependencies for this property path with the newly found dependencies
              if (correctSnippets.length) {
                dataTreeEvalRef.dependencyMap[
                  fullPropertyPath
                ] = correctSnippets;
              } else {
                // The dependency on this property path has been removed. Delete this property path from the global
                // dependency map
                delete dataTreeEvalRef.dependencyMap[fullPropertyPath];
              }
              if (isAction(entity) || isJSAction(entity)) {
                // Actions have a defined dependency map that should always be maintained
                if (entityPropertyPath in entity.dependencyMap) {
                  const entityDependenciesName = entity.dependencyMap[
                    entityPropertyPath
                  ].map((dep) => `${entityName}.${dep}`);

                  // Filter only the paths which exist in the appsmith world to avoid cyclical dependencies
                  const filteredEntityDependencies = entityDependenciesName.filter(
                    (path) => dataTreeEvalRef.allKeys.hasOwnProperty(path),
                  );

                  // Now assign these existing dependent paths to the property path in dependencyMap
                  if (fullPropertyPath in dataTreeEvalRef.dependencyMap) {
                    dataTreeEvalRef.dependencyMap[
                      fullPropertyPath
                    ] = dataTreeEvalRef.dependencyMap[fullPropertyPath].concat(
                      filteredEntityDependencies,
                    );
                  } else {
                    dataTreeEvalRef.dependencyMap[
                      fullPropertyPath
                    ] = filteredEntityDependencies;
                  }
                }
              }
            }
            // If the whole binding was removed, then the value at this path would be a string without any bindings.
            // In this case, if the path exists in the dependency map and is a bindingPath, then remove it.
            else if (
              entity.bindingPaths[entityPropertyPath] &&
              fullPropertyPath in dataTreeEvalRef.dependencyMap
            ) {
              didUpdateDependencyMap = true;
              delete dataTreeEvalRef.dependencyMap[fullPropertyPath];
            }
          }
          if (
            isWidget(entity) &&
            isPathADynamicTrigger(
              entity,
              getPropertyPath(dataTreeDiff.payload.propertyPath),
            )
          ) {
            const { jsSnippets } = getDynamicBindings(
              dataTreeDiff.payload.value || "",
              entity,
            );
            const entityDependencies = jsSnippets.filter(
              (jsSnippet) => !!jsSnippet,
            );
            const extractedEntityDependencies = getEntityReferencesFromPropertyBindings(
              entityDependencies,
              dataTreeEvalRef,
            );

            dataTreeEvalRef.triggerFieldDependencyMap[
              dataTreeDiff.payload.propertyPath
            ] = extractedEntityDependencies;

            didUpdateTriggerDependencyMap = true;
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
  if (didUpdateDependencyMap) {
    // TODO Optimise
    Object.keys(dataTreeEvalRef.dependencyMap).forEach((key) => {
      dataTreeEvalRef.dependencyMap[key] = uniq(
        flatten(
          dataTreeEvalRef.dependencyMap[key].map((path) => {
            try {
              return extractReferencesFromBinding(
                path,
                dataTreeEvalRef.allKeys,
              );
            } catch (error) {
              dataTreeEvalRef.errors.push({
                type: EvalErrorTypes.EXTRACT_DEPENDENCY_ERROR,
                message: (error as Error).message,
                context: {
                  script: path,
                },
              });
              return [];
            }
          }),
        ),
      );
    });
    dataTreeEvalRef.dependencyMap = makeParentsDependOnChildren(
      dataTreeEvalRef.dependencyMap,
      dataTreeEvalRef.allKeys,
    );
  }
  const subDepCalcEnd = performance.now();
  const updateChangedDependenciesStart = performance.now();
  // If the global dependency map has changed, re-calculate the sort order for all entities and the
  // global inverse dependency map
  if (didUpdateDependencyMap) {
    // This is being called purely to test for new circular dependencies that might have been added
    dataTreeEvalRef.sortedDependencies = dataTreeEvalRef.sortDependencies(
      dataTreeEvalRef.dependencyMap,
      translatedDiffs,
    );
    dataTreeEvalRef.inverseDependencyMap = dataTreeEvalRef.getInverseDependencyTree();
  }
  if (didUpdateTriggerDependencyMap) {
    dataTreeEvalRef.triggerFieldInverseDependencyMap = dataTreeEvalRef.getInverseTriggerDependencyMap();
  }

  const updateChangedDependenciesStop = performance.now();
  dataTreeEvalRef.logs.push({
    diffCalcDeps: (diffCalcEnd - diffCalcStart).toFixed(2),
    subDepCalc: (subDepCalcEnd - subDepCalcStart).toFixed(2),
    updateChangedDependencies: (
      updateChangedDependenciesStop - updateChangedDependenciesStart
    ).toFixed(2),
  });

  return { dependenciesOfRemovedPaths, removedPaths, triggerPathsToLint };
};
