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
  getEntityNameAndPropertyPath,
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
import { extractInfoFromBinding, extractInfoFromIdentifiers } from "./utils";
import DataTreeEvaluator from "workers/DataTreeEvaluator";
import { flatten, difference, uniq } from "lodash";

interface CreateDependencyMap {
  dependencyMap: DependencyMap;
  triggerFieldDependencyMap: DependencyMap;
  /** Keeps track of all unused Identifiers present in bindings throughout the page.
   *  We keep this list so that we don't have to traverse the entire dataTree when
   *  a new entity or path is added to the datatree in order to determine if an old binding has become valid
   *  because an entity or path is newly added.
   * */
  unusedIdentifiers: DependencyMap;
}

export function createDependencyMap(
  dataTreeEvalRef: DataTreeEvaluator,
  unEvalTree: DataTree,
): CreateDependencyMap {
  let dependencyMap: DependencyMap = {};
  let triggerFieldDependencyMap: DependencyMap = {};
  const unusedIdentifiers: DependencyMap = {};
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
        const { references, unreferencedIdentifiers } = extractInfoFromBinding(
          path,
          dataTreeEvalRef.allKeys,
        );
        // To keep the list as minimal as possible, only paths with unreferenced Identifiers
        // are stored.
        if (unreferencedIdentifiers.length) {
          unusedIdentifiers[key] = unreferencedIdentifiers;
        }
        return references;
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
    const newDep = triggerFieldDependencyMap[key].map((path) => {
      try {
        const { references, unreferencedIdentifiers } = extractInfoFromBinding(
          path,
          dataTreeEvalRef.allKeys,
        );
        // To keep the list as minimal as possible, only paths with unreferenced Identifiers
        // are stored.
        if (unreferencedIdentifiers.length) {
          unusedIdentifiers[key] = unreferencedIdentifiers;
        }
        return references;
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
    triggerFieldDependencyMap[key] = flatten(newDep);
  });
  dependencyMap = makeParentsDependOnChildren(
    dependencyMap,
    dataTreeEvalRef.allKeys,
  );
  return { dependencyMap, triggerFieldDependencyMap, unusedIdentifiers };
}

interface UpdateDependencyMap {
  dependenciesOfRemovedPaths: string[];
  removedPaths: string[];
  /** Some paths do not need to go through evaluation, but require linting
   *  For example:
   *  1. For changes in paths that trigger fields depend on, the triggerFields need to be "linted" but not evaluated.
   *  2. Paths containing unreferenced identifiers - Eg. for binding {{Api1.unknown}} in button.text, although Api1.unknown
   *     is not a valid reference, when Api1 is deleted button.text needs to be linted
   */
  extraPathsToLint: string[];
}
export const updateDependencyMap = ({
  dataTreeEvalRef,
  translatedDiffs,
  unEvalDataTree,
}: {
  dataTreeEvalRef: DataTreeEvaluator;
  translatedDiffs: Array<DataTreeDiff>;
  unEvalDataTree: DataTree;
}): UpdateDependencyMap => {
  const diffCalcStart = performance.now();
  let didUpdateDependencyMap = false;
  let didUpdateTriggerDependencyMap = false;
  const dependenciesOfRemovedPaths: Array<string> = [];
  const removedPaths: Array<string> = [];
  let didUpdateUnusedIdentifiers = false;
  const extraPathsToLint: Array<string> = [];

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
              didUpdateUnusedIdentifiers = true;
              // The entity might already have some dependencies,
              // so we just want to update those
              Object.entries(entityDependencyMap).forEach(
                ([entityDependent, entityDependencies]) => {
                  const newDep = entityDependencies.map((path) => {
                    try {
                      const {
                        references,
                        unreferencedIdentifiers,
                      } = extractInfoFromBinding(path, dataTreeEvalRef.allKeys);

                      if (unreferencedIdentifiers.length) {
                        dataTreeEvalRef.unusedIdentifiersList[
                          dataTreeDiff.payload.propertyPath
                        ] = unreferencedIdentifiers;
                      } else {
                        delete dataTreeEvalRef.unusedIdentifiersList[
                          dataTreeDiff.payload.propertyPath
                        ];
                      }

                      return references;
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

                  if (dataTreeEvalRef.dependencyMap[entityDependent]) {
                    dataTreeEvalRef.dependencyMap[
                      entityDependent
                    ] = dataTreeEvalRef.dependencyMap[entityDependent].concat(
                      flatten(newDep),
                    );
                  } else {
                    dataTreeEvalRef.dependencyMap[entityDependent] = flatten(
                      newDep,
                    );
                  }
                },
              );
            }
          }
          // Either a new entity or a new property path has been added. Go through the list of unreferenced identifiers and
          // find out if a new dependency has to be created because the property path used in the binding just became
          // eligible (a previously invalid identifier has become valid because a new entity/path got added).

          const possibleNewlyValidIdentifiersMap: DependencyMap = {};
          Object.keys(dataTreeEvalRef.unusedIdentifiersList).forEach((path) => {
            dataTreeEvalRef.unusedIdentifiersList[path].forEach(
              (identifier) => {
                if (
                  isChildPropertyPath(
                    dataTreeDiff.payload.propertyPath,
                    identifier,
                  )
                ) {
                  if (!dataTreeEvalRef.dependencyMap[identifier]) {
                    extraPathsToLint.push(path);
                  }

                  possibleNewlyValidIdentifiersMap[
                    identifier
                  ] = possibleNewlyValidIdentifiersMap[identifier]
                    ? uniq([
                        ...possibleNewlyValidIdentifiersMap[identifier],
                        path,
                      ])
                    : [path];
                }
              },
            );
          });

          // We have found some bindings which are related to the new property path and hence should be added to the
          // global dependency map
          if (Object.keys(possibleNewlyValidIdentifiersMap).length) {
            didUpdateDependencyMap = true;
            didUpdateUnusedIdentifiers = true;
            Object.keys(possibleNewlyValidIdentifiersMap).forEach(
              (identifier) => {
                const { references } = extractInfoFromIdentifiers(
                  [identifier],
                  dataTreeEvalRef.allKeys,
                );

                possibleNewlyValidIdentifiersMap[identifier].forEach((path) => {
                  const {
                    entityName,
                    propertyPath,
                  } = getEntityNameAndPropertyPath(path);
                  const entity = unEvalDataTree[entityName];
                  if (references.length) {
                    if (
                      isWidget(entity) &&
                      isPathADynamicTrigger(entity, propertyPath)
                    ) {
                      didUpdateTriggerDependencyMap = true;
                      dataTreeEvalRef.triggerFieldDependencyMap[path] = uniq([
                        ...dataTreeEvalRef.triggerFieldDependencyMap[path],
                        ...references,
                      ]);
                    } else {
                      dataTreeEvalRef.dependencyMap[path] = uniq([
                        ...dataTreeEvalRef.dependencyMap[path],
                        ...references,
                      ]);
                    }

                    if (dataTreeEvalRef.unusedIdentifiersList[path]) {
                      const newUnusedIdentifiers = dataTreeEvalRef.unusedIdentifiersList[
                        path
                      ].filter((item) => identifier !== item);

                      if (newUnusedIdentifiers.length) {
                        dataTreeEvalRef.unusedIdentifiersList[
                          path
                        ] = newUnusedIdentifiers;
                      } else {
                        delete dataTreeEvalRef.unusedIdentifiersList[path];
                      }
                    }
                  }
                });
              },
            );
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
              didUpdateUnusedIdentifiers = true;
              delete dataTreeEvalRef.dependencyMap[widgetDep];
              delete dataTreeEvalRef.unusedIdentifiersList[widgetDep];
            });
          }
          // Either an existing entity or an existing property path has been deleted. Update the global dependency map
          // by removing the bindings from the same.
          Object.keys(dataTreeEvalRef.dependencyMap).forEach(
            (dependencyPath) => {
              didUpdateDependencyMap = true;
              didUpdateUnusedIdentifiers = true;
              if (
                isChildPropertyPath(
                  dataTreeDiff.payload.propertyPath,
                  dependencyPath,
                )
              ) {
                delete dataTreeEvalRef.dependencyMap[dependencyPath];
                delete dataTreeEvalRef.unusedIdentifiersList[dependencyPath];
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
                if (toRemove.length) {
                  dataTreeEvalRef.unusedIdentifiersList[
                    dependencyPath
                  ] = toRemove;
                }
                if (dataTreeEvalRef.unusedIdentifiersList[dependencyPath]) {
                  dataTreeEvalRef.unusedIdentifiersList[dependencyPath].forEach(
                    (unusedIdentifier) => {
                      if (
                        isChildPropertyPath(
                          dataTreeDiff.payload.propertyPath,
                          unusedIdentifier,
                        )
                      ) {
                        extraPathsToLint.push(dependencyPath);
                      }
                    },
                  );
                }
              }
            },
          );
          Object.keys(dataTreeEvalRef.triggerFieldDependencyMap).forEach(
            (dependencyPath) => {
              didUpdateDependencyMap = true;
              didUpdateUnusedIdentifiers = true;
              if (
                isChildPropertyPath(
                  dataTreeDiff.payload.propertyPath,
                  dependencyPath,
                )
              ) {
                delete dataTreeEvalRef.triggerFieldDependencyMap[
                  dependencyPath
                ];
                delete dataTreeEvalRef.unusedIdentifiersList[dependencyPath];
              } else {
                const toRemove: Array<string> = [];
                dataTreeEvalRef.triggerFieldDependencyMap[
                  dependencyPath
                ].forEach((dependantPath) => {
                  if (
                    isChildPropertyPath(
                      dataTreeDiff.payload.propertyPath,
                      dependantPath,
                    )
                  ) {
                    toRemove.push(dependantPath);
                  }
                });
                dataTreeEvalRef.triggerFieldDependencyMap[
                  dependencyPath
                ] = difference(
                  dataTreeEvalRef.triggerFieldDependencyMap[dependencyPath],
                  toRemove,
                );
                if (toRemove.length) {
                  dataTreeEvalRef.unusedIdentifiersList[
                    dependencyPath
                  ] = toRemove;
                }
                if (dataTreeEvalRef.unusedIdentifiersList[dependencyPath]) {
                  dataTreeEvalRef.unusedIdentifiersList[dependencyPath].forEach(
                    (unusedIdentifier) => {
                      if (
                        isChildPropertyPath(
                          dataTreeDiff.payload.propertyPath,
                          unusedIdentifier,
                        )
                      ) {
                        extraPathsToLint.push(dependencyPath);
                      }
                    },
                  );
                }
              }
            },
          );

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
              didUpdateUnusedIdentifiers = true;

              const { jsSnippets } = getDynamicBindings(
                dataTreeDiff.payload.value,
                entity,
              );
              const correctSnippets = jsSnippets.filter(
                (jsSnippet) => !!jsSnippet,
              );

              const newDep = correctSnippets.map((path) => {
                try {
                  const {
                    references,
                    unreferencedIdentifiers,
                  } = extractInfoFromBinding(path, dataTreeEvalRef.allKeys);
                  if (unreferencedIdentifiers.length) {
                    dataTreeEvalRef.unusedIdentifiersList[
                      dataTreeDiff.payload.propertyPath
                    ] = unreferencedIdentifiers;
                  } else {
                    delete dataTreeEvalRef.unusedIdentifiersList[
                      dataTreeDiff.payload.propertyPath
                    ];
                  }

                  return references;
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

              // We found a new dynamic binding for this property path. We update the dependency map by overwriting the
              // dependencies for this property path with the newly found dependencies
              if (newDep.length) {
                dataTreeEvalRef.dependencyMap[fullPropertyPath] = flatten(
                  newDep,
                );
              } else {
                // The dependency on this property path has been removed. Delete this property path from the global
                // dependency map
                delete dataTreeEvalRef.dependencyMap[fullPropertyPath];
                delete dataTreeEvalRef.unusedIdentifiersList[fullPropertyPath];
              }
              if (isAction(entity) || isJSAction(entity)) {
                // Actions have a defined dependency map that should always be maintained
                if (entityPropertyPath in entity.dependencyMap) {
                  const entityDependenciesName = entity.dependencyMap[
                    entityPropertyPath
                  ].map((dep) => `${entityName}.${dep}`);

                  const newDep = entityDependenciesName.map((path) => {
                    try {
                      const {
                        references,
                        unreferencedIdentifiers,
                      } = extractInfoFromBinding(path, dataTreeEvalRef.allKeys);

                      if (unreferencedIdentifiers.length) {
                        dataTreeEvalRef.unusedIdentifiersList[
                          dataTreeDiff.payload.propertyPath
                        ] = unreferencedIdentifiers;
                      } else {
                        delete dataTreeEvalRef.unusedIdentifiersList[
                          dataTreeDiff.payload.propertyPath
                        ];
                      }

                      return references;
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

                  // Now assign these existing dependent paths to the property path in dependencyMap
                  if (fullPropertyPath in dataTreeEvalRef.dependencyMap) {
                    dataTreeEvalRef.dependencyMap[
                      fullPropertyPath
                    ] = dataTreeEvalRef.dependencyMap[fullPropertyPath].concat(
                      flatten(newDep),
                    );
                  } else {
                    dataTreeEvalRef.dependencyMap[fullPropertyPath] = flatten(
                      newDep,
                    );
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
              didUpdateUnusedIdentifiers = true;
              delete dataTreeEvalRef.dependencyMap[fullPropertyPath];
              delete dataTreeEvalRef.unusedIdentifiersList[fullPropertyPath];
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

            const newDep = entityDependencies.map((path) => {
              try {
                const {
                  references,
                  unreferencedIdentifiers,
                } = extractInfoFromBinding(path, dataTreeEvalRef.allKeys);

                if (unreferencedIdentifiers.length) {
                  dataTreeEvalRef.unusedIdentifiersList[
                    dataTreeDiff.payload.propertyPath
                  ] = unreferencedIdentifiers;
                } else {
                  delete dataTreeEvalRef.unusedIdentifiersList[
                    dataTreeDiff.payload.propertyPath
                  ];
                }

                return references;
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

            dataTreeEvalRef.triggerFieldDependencyMap[
              dataTreeDiff.payload.propertyPath
            ] = flatten(newDep);

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

  if (didUpdateUnusedIdentifiers) {
    dataTreeEvalRef.unusedIdentifiersInverseList = dataTreeEvalRef.getInverseIdentifierList();
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
    dependenciesOfRemovedPaths,
    removedPaths,
    extraPathsToLint,
  };
};
