import type { DataTreeDiff } from "@appsmith/workers/Evaluation/evaluationUtils";
import {
  getAllPaths,
  DataTreeDiffEvent,
  isWidget,
  isAction,
  isJSAction,
  makeParentsDependOnChildren,
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
import type { DependencyMap } from "utils/DynamicBindingUtils";
import {
  isChildPropertyPath,
  getPropertyPath,
  isPathADynamicBinding,
  getDynamicBindings,
  isPathDynamicTrigger,
  getEvalErrorPath,
} from "utils/DynamicBindingUtils";
import {
  extractInfoFromBindings,
  extractInfoFromReferences,
  isADynamicTriggerPath,
  listEntityDependencies,
  listEntityPathDependencies,
  listTriggerFieldDependencies,
  listValidationDependencies,
  updateMap,
} from "./utils";
import { difference, isEmpty, set, uniq } from "lodash";
import { isWidgetActionOrJsObject } from "../DataTreeEvaluator/utils";
import { asyncJsFunctionInDataFields } from "workers/Evaluation/JSObject/asyncJSFunctionBoundToDataField";
import { dataTreeEvaluator } from "workers/Evaluation/handlers/evalTree";

interface CreateDependencyMap {
  dependencyMap: DependencyMap;
  triggerFieldDependencyMap: DependencyMap;
  /** Keeps track of all invalid references present in bindings throughout the page.
   *  We keep this list so that we don't have to traverse the entire dataTree when
   *  a new entity or path is added to the datatree in order to determine if an old invalid reference has become valid
   *  because an entity or path is newly added.
   * */
  invalidReferencesMap: DependencyMap;
  validationDependencyMap: DependencyMap;
}

interface UpdateDependencyMap {
  dependenciesOfRemovedPaths: string[];
  pathsToClearErrorsFor: any[];
  removedPaths: string[];
  /** Some paths do not need to go through evaluation, but require linting
   *  For example:
   *  1. For changes in paths that trigger fields depend on, the triggerFields need to be "linted" but not evaluated.
   *  2. Paths containing invalid references - Eg. for binding {{Api1.unknown}} in button.text, although Api1.unknown
   *     is not a valid reference, when Api1 is deleted button.text needs to be linted
   */
  extraPathsToLint: string[];
}

type SortedDependencies = Array<string>;

class DependencyMapClass {
  /**
   * dependencyMap: Maintains map of <PATH, list of paths that re-evaluates on the evaluation of the PATH>
   */
  dependencyMap: DependencyMap = {};
  sortedDependencies: SortedDependencies = [];
  inverseDependencyMap: DependencyMap = {};
  triggerFieldDependencyMap: DependencyMap = {};
  /**  Keeps track of all invalid references in bindings throughout the Application
   * Eg. For binding {{unknownEntity.name + Api1.name}} in Button1.text, where Api1 is present in dataTree but unknownEntity is not,
   * the map has a key-value pair of
   * {
   *  "Button1.text": [unknownEntity.name]
   * }
   */
  invalidReferencesMap: DependencyMap = {};
  /**
   * Maintains dependency of paths to re-validate on evaluation of particular property path.
   */
  validationDependencyMap: DependencyMap = {};
  sortedValidationDependencies: SortedDependencies = [];
  inverseValidationDependencyMap: DependencyMap = {};

  create(unEvalTree: DataTree, configTree: ConfigTree): CreateDependencyMap {
    if (!dataTreeEvaluator)
      return {
        dependencyMap: {},
        triggerFieldDependencyMap: {},
        invalidReferencesMap: {},
        validationDependencyMap: {},
      };

    const { allKeys, errors: errorsState } = dataTreeEvaluator;

    Object.keys(configTree).forEach((entityName) => {
      const entity = unEvalTree[entityName];
      const entityConfig = configTree[entityName];
      if (isAction(entity) || isWidget(entity) || isJSAction(entity)) {
        const entityListedDependencies = listEntityDependencies(
          entity,
          entityName,
          allKeys,
          unEvalTree,
          configTree,
        );
        this.dependencyMap = {
          ...this.dependencyMap,
          ...entityListedDependencies,
        };
      }

      if (isWidget(entity)) {
        // only widgets have trigger paths
        this.triggerFieldDependencyMap = {
          ...this.triggerFieldDependencyMap,
          ...listTriggerFieldDependencies(
            entity,
            entityName,
            entityConfig as WidgetEntityConfig,
          ),
        };
        // only widgets have validation paths
        this.validationDependencyMap = {
          ...this.validationDependencyMap,
          ...listValidationDependencies(
            entity,
            entityName,
            entityConfig as WidgetEntityConfig,
          ),
        };
      }
    });

    Object.keys(this.dependencyMap).forEach((key) => {
      const { errors, invalidReferences, validReferences } =
        extractInfoFromBindings(this.dependencyMap[key], allKeys);
      this.dependencyMap[key] = validReferences;

      updateMap(this.invalidReferencesMap, key, invalidReferences, {
        deleteOnEmpty: true,
        replaceValue: true,
      });

      asyncJsFunctionInDataFields.update(
        key,
        validReferences,
        unEvalTree,
        configTree,
      );
      errors.forEach((error) => {
        errorsState.push(error);
      });
    });

    // extract references from bindings in trigger fields
    Object.keys(this.triggerFieldDependencyMap).forEach((key) => {
      const { errors, invalidReferences, validReferences } =
        extractInfoFromBindings(this.triggerFieldDependencyMap[key], allKeys);
      this.triggerFieldDependencyMap[key] = validReferences;
      // To keep invalidReferencesMap as minimal as possible, only paths with invalid references
      // are stored.
      if (invalidReferences.length) {
        this.invalidReferencesMap[key] = invalidReferences;
      }
      errors.forEach((error) => {
        errorsState.push(error);
      });
    });

    this.dependencyMap = makeParentsDependOnChildren(
      this.dependencyMap,
      allKeys,
    );

    return {
      dependencyMap: this.dependencyMap,
      triggerFieldDependencyMap: this.triggerFieldDependencyMap,
      invalidReferencesMap: this.invalidReferencesMap,
      validationDependencyMap: this.validationDependencyMap,
    };
  }

  update({
    configTree,
    translatedDiffs,
    unEvalDataTree,
  }: {
    translatedDiffs: Array<DataTreeDiff>;
    unEvalDataTree: DataTree;
    configTree: ConfigTree;
  }): UpdateDependencyMap {
    const diffCalcStart = performance.now();
    let didUpdateDependencyMap = false;
    let didUpdateValidationDependencyMap = false;
    const dependenciesOfRemovedPaths: Array<string> = [];
    const removedPaths: Array<string> = [];
    let extraPathsToLint: string[] = [];
    const pathsToClearErrorsFor: any[] = [];

    if (!dataTreeEvaluator)
      return {
        dependenciesOfRemovedPaths,
        extraPathsToLint,
        pathsToClearErrorsFor,
        removedPaths,
      };

    const { evalProps, oldConfigTree, oldUnEvalTree } = dataTreeEvaluator;

    let { allKeys, errors: dataTreeEvalErrors } = dataTreeEvaluator;

    // This is needed for NEW and DELETE events below.
    // In worst case, it tends to take ~12.5% of entire diffCalc (8 ms out of 67ms for 132 array of NEW)
    // TODO: Optimise by only getting paths of changed node
    allKeys = getAllPaths(unEvalDataTree);
    // Transform the diff library events to Appsmith evaluator events

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
            if (isWidgetActionOrJsObject(entity)) {
              if (
                !isDynamicLeaf(unEvalDataTree, fullPropertyPath, configTree)
              ) {
                const entityDependencyMap = listEntityDependencies(
                  entity,
                  entityName,
                  allKeys,
                  unEvalDataTree,
                  configTree,
                );
                if (!isEmpty(entityDependencyMap)) {
                  didUpdateDependencyMap = true;
                  // The entity might already have some dependencies,
                  // so we just want to update those
                  Object.entries(entityDependencyMap).forEach(
                    ([entityDependent, entityDependencies]) => {
                      const {
                        errors: extractDependencyErrors,
                        invalidReferences,
                        validReferences,
                      } = extractInfoFromBindings(entityDependencies, allKeys);
                      // Update dependencyMap
                      updateMap(
                        this.dependencyMap,
                        entityDependent,
                        validReferences,
                      );
                      // Update invalidReferencesMap
                      updateMap(
                        this.invalidReferencesMap,
                        entityDependent,
                        invalidReferences,
                        { deleteOnEmpty: true, replaceValue: true },
                      );
                      // Update asyncJSFunctionsInDatafieldsMap
                      const updatedAsyncJSFunctions =
                        asyncJsFunctionInDataFields.update(
                          entityDependent,
                          validReferences,
                          unEvalDataTree,
                          configTree,
                        );

                      extraPathsToLint = extraPathsToLint.concat(
                        updatedAsyncJSFunctions,
                      );

                      dataTreeEvalErrors = dataTreeEvalErrors.concat(
                        extractDependencyErrors,
                      );
                    },
                  );
                }
                if (isWidget(entity)) {
                  // For widgets,
                  // we need to update the triggerField dependencyMap and validation dependencyMap
                  const triggerFieldDependencies = listTriggerFieldDependencies(
                    entity,
                    entityName,
                    entityConfig as WidgetEntityConfig,
                  );
                  Object.entries(triggerFieldDependencies).forEach(
                    ([triggerFieldDependent, triggerFieldDependencies]) => {
                      const {
                        errors: extractDependencyErrors,
                        invalidReferences,
                        validReferences,
                      } = extractInfoFromBindings(
                        triggerFieldDependencies,
                        allKeys,
                      );
                      // Update triggerfield dependencyMap
                      updateMap(
                        this.triggerFieldDependencyMap,
                        triggerFieldDependent,
                        validReferences,
                      );
                      // Update invalidReferencesMap
                      updateMap(
                        this.invalidReferencesMap,
                        triggerFieldDependent,
                        invalidReferences,
                        { deleteOnEmpty: true, replaceValue: true },
                      );
                      // update errors
                      dataTreeEvalErrors = dataTreeEvalErrors.concat(
                        extractDependencyErrors,
                      );
                    },
                  );
                  // update validation dependencies
                  this.validationDependencyMap = {
                    ...this.validationDependencyMap,
                    ...listValidationDependencies(
                      entity,
                      entityName,
                      entityConfig as WidgetEntityConfig,
                    ),
                  };
                  didUpdateValidationDependencyMap = true;
                }
              } else {
                didUpdateDependencyMap = true;
                const { dependencies: entityPathDependencies, isTrigger } =
                  listEntityPathDependencies(
                    entity,
                    fullPropertyPath,
                    entityConfig,
                  );
                if (isTrigger) {
                  // Trigger fields shouldn't depend on anything, in the dependencyMap
                  this.dependencyMap[fullPropertyPath] = [];
                  const {
                    errors: extractDependencyErrors,
                    invalidReferences,
                    validReferences,
                  } = extractInfoFromBindings(entityPathDependencies, allKeys);
                  // Update trigger dependencyMap
                  updateMap(
                    this.triggerFieldDependencyMap,
                    fullPropertyPath,
                    validReferences,
                  );
                  // Update invalidReferencesMap
                  updateMap(
                    this.invalidReferencesMap,
                    fullPropertyPath,
                    invalidReferences,
                    { replaceValue: true, deleteOnEmpty: true },
                  );
                  // update errors
                  dataTreeEvalErrors = dataTreeEvalErrors.concat(
                    extractDependencyErrors,
                  );
                } else {
                  didUpdateDependencyMap = true;
                  const {
                    errors: extractDependencyErrors,
                    invalidReferences,
                    validReferences,
                  } = extractInfoFromBindings(entityPathDependencies, allKeys);
                  // Update dependencyMap
                  updateMap(
                    this.dependencyMap,
                    fullPropertyPath,
                    validReferences,
                  );
                  // Update invalidReferencesMap
                  updateMap(
                    this.invalidReferencesMap,
                    fullPropertyPath,
                    invalidReferences,
                    { replaceValue: true, deleteOnEmpty: true },
                  );
                  dataTreeEvalErrors = dataTreeEvalErrors.concat(
                    extractDependencyErrors,
                  );
                }
                if (isWidget(entity)) {
                  // update validation dependencies
                  this.validationDependencyMap = {
                    ...this.validationDependencyMap,
                    ...listValidationDependencies(
                      entity,
                      entityName,
                      entityConfig as WidgetEntityConfig,
                    ),
                  };
                  didUpdateValidationDependencyMap = true;
                }
              }
            }
            // Either a new entity or a new property path has been added. Go through the list of invalid references and
            // find out if a new dependency has to be created because the property path used in the binding just became
            // eligible (a previously invalid reference has become valid because a new entity/path got added).

            const newlyValidReferencesMap: DependencyMap = {};
            Object.keys(this.invalidReferencesMap).forEach((path) => {
              this.invalidReferencesMap[path].forEach((invalidReference) => {
                if (isChildPropertyPath(fullPropertyPath, invalidReference)) {
                  updateMap(newlyValidReferencesMap, invalidReference, [path]);
                  if (!this.dependencyMap[invalidReference]) {
                    extraPathsToLint.push(path);
                  }
                }
              });
            });

            // We have found some bindings which are related to the new property path and hence should be added to the
            // global dependency map
            if (!isEmpty(newlyValidReferencesMap)) {
              didUpdateDependencyMap = true;
              Object.keys(newlyValidReferencesMap).forEach(
                (newlyValidReference) => {
                  const { validReferences } = extractInfoFromReferences(
                    [newlyValidReference],
                    allKeys,
                  );
                  newlyValidReferencesMap[newlyValidReference].forEach(
                    (fullPath) => {
                      const { entityName, propertyPath } =
                        getEntityNameAndPropertyPath(fullPath);
                      const entity = unEvalDataTree[entityName];
                      const entityConfig = configTree[entityName];
                      if (validReferences.length) {
                        // For trigger paths, update the triggerfield dependency map
                        // For other paths, update the dependency map
                        updateMap(
                          isADynamicTriggerPath(
                            entity,
                            propertyPath,
                            entityConfig as WidgetEntityConfig,
                          )
                            ? this.triggerFieldDependencyMap
                            : this.dependencyMap,
                          fullPath,
                          validReferences,
                        );
                        // Update asyncJSMap
                        const updatedAsyncJSFunctions =
                          asyncJsFunctionInDataFields.update(
                            fullPath,
                            validReferences,
                            unEvalDataTree,
                            configTree,
                          );
                        extraPathsToLint = extraPathsToLint.concat(
                          updatedAsyncJSFunctions,
                        );

                        // Since the previously invalid reference has become valid,
                        // remove it from the invalidReferencesMap
                        if (this.invalidReferencesMap[fullPath]) {
                          const newInvalidReferences =
                            this.invalidReferencesMap[fullPath].filter(
                              (invalidReference) =>
                                invalidReference !== newlyValidReference,
                            );
                          updateMap(
                            this.invalidReferencesMap,
                            fullPath,
                            newInvalidReferences,
                            { replaceValue: true, deleteOnEmpty: true },
                          );
                        }
                      }
                    },
                  );
                },
              );
            }

            // Add trigger paths that depend on the added path/entity to "extrapathstolint"
            Object.keys(this.triggerFieldDependencyMap).forEach(
              (triggerPath) => {
                this.triggerFieldDependencyMap[triggerPath].forEach(
                  (triggerPathDependency) => {
                    if (
                      isChildPropertyPath(
                        fullPropertyPath,
                        triggerPathDependency,
                      )
                    ) {
                      extraPathsToLint.push(triggerPath);
                    }
                  },
                );
              },
            );
            break;
          }
          case DataTreeDiffEvent.DELETE: {
            // Add to removedPaths as they have been deleted from the evalTree
            removedPaths.push(fullPropertyPath);
            // If an existing entity was deleted, remove all the bindings from the global dependency map

            /**There are certain cases where the child paths of the entity could have errors and
             *  need them to be cleared post evaluations. Therefore we store all the paths that are
             * removed on deleting the entity and use that reference to clear the error logs post evaluation*/
            if (isWidget(entity)) {
              const propertyPaths = [fullPropertyPath];

              if (this.dependencyMap[fullPropertyPath]) {
                propertyPaths.push(...this.dependencyMap[fullPropertyPath]);
              }

              pathsToClearErrorsFor.push({
                widgetId: entity?.widgetId,
                paths: propertyPaths,
              });
            }

            if (
              isWidgetActionOrJsObject(entity) &&
              fullPropertyPath === entityName
            ) {
              const entityDependencies = listEntityDependencies(
                entity,
                entityName,
                allKeys,
                unEvalDataTree,
                oldConfigTree,
              );
              Object.keys(entityDependencies).forEach((widgetDep) => {
                didUpdateDependencyMap = true;
                delete this.dependencyMap[widgetDep];
                delete this.invalidReferencesMap[widgetDep];
              });

              if (isWidget(entity)) {
                const triggerFieldDependencies = listTriggerFieldDependencies(
                  entity,
                  entityName,
                  entityConfig as WidgetEntityConfig,
                );
                Object.keys(triggerFieldDependencies).forEach((triggerDep) => {
                  delete this.triggerFieldDependencyMap[triggerDep];
                  delete this.invalidReferencesMap[triggerDep];
                });

                // remove validation dependencies
                const validationDependencies = listValidationDependencies(
                  entity,
                  entityName,
                  entityConfig as WidgetEntityConfig,
                );
                Object.keys(validationDependencies).forEach((validationDep) => {
                  delete this.validationDependencyMap[validationDep];
                });
                didUpdateValidationDependencyMap = true;
              }
            }

            // Either an existing entity or an existing property path has been deleted. Update the global dependency map
            // by removing the bindings from the same.
            Object.keys(this.dependencyMap).forEach((dependencyPath) => {
              didUpdateDependencyMap = true;
              if (isChildPropertyPath(fullPropertyPath, dependencyPath)) {
                delete this.dependencyMap[dependencyPath];
                delete this.invalidReferencesMap[dependencyPath];
              } else {
                const toRemove: Array<string> = [];
                this.dependencyMap[dependencyPath].forEach((dependantPath) => {
                  if (isChildPropertyPath(fullPropertyPath, dependantPath)) {
                    dependenciesOfRemovedPaths.push(dependencyPath);
                    toRemove.push(dependantPath);
                  }
                });
                this.dependencyMap[dependencyPath] = difference(
                  this.dependencyMap[dependencyPath],
                  toRemove,
                );
                // If we find any invalid reference (untracked in the dependency map) for this path,
                // which is a child of the deleted path, add it to the of paths to lint.
                // Example scenario => For {{Api1.unknown}} in button.text, if Api1 is deleted, we need to lint button.text
                // Although, "Api1.unknown" is not a valid reference

                if (this.invalidReferencesMap[dependencyPath]) {
                  this.invalidReferencesMap[dependencyPath].forEach(
                    (invalidReference) => {
                      if (
                        isChildPropertyPath(fullPropertyPath, invalidReference)
                      ) {
                        extraPathsToLint.push(dependencyPath);
                      }
                    },
                  );
                }

                // Since we are removing previously valid references,
                // We also update the invalidReferenceMap for this path
                if (toRemove.length) {
                  updateMap(
                    this.invalidReferencesMap,
                    dependencyPath,
                    toRemove,
                  );
                }
              }
            });
            Object.keys(this.triggerFieldDependencyMap).forEach(
              (dependencyPath) => {
                if (isChildPropertyPath(fullPropertyPath, dependencyPath)) {
                  delete this.triggerFieldDependencyMap[dependencyPath];
                  delete this.invalidReferencesMap[dependencyPath];
                } else {
                  const toRemove: Array<string> = [];
                  this.triggerFieldDependencyMap[dependencyPath].forEach(
                    (dependantPath) => {
                      if (
                        isChildPropertyPath(fullPropertyPath, dependantPath)
                      ) {
                        toRemove.push(dependantPath);
                      }
                    },
                  );
                  this.triggerFieldDependencyMap[dependencyPath] = difference(
                    this.triggerFieldDependencyMap[dependencyPath],
                    toRemove,
                  );
                  if (toRemove.length) {
                    updateMap(
                      this.invalidReferencesMap,
                      dependencyPath,
                      toRemove,
                    );
                  }
                  if (this.invalidReferencesMap[dependencyPath]) {
                    this.invalidReferencesMap[dependencyPath].forEach(
                      (invalidReference) => {
                        if (
                          isChildPropertyPath(
                            fullPropertyPath,
                            invalidReference,
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

            // update asyncJsFunctionInDataFields
            const updatedAsyncJSFunctions =
              asyncJsFunctionInDataFields.handlePathDeletion(
                fullPropertyPath,
                unEvalDataTree,
                configTree,
              );
            extraPathsToLint = extraPathsToLint.concat(updatedAsyncJSFunctions);

            break;
          }
          case DataTreeDiffEvent.EDIT: {
            // We only care if the difference is in dynamic bindings since static values do not need
            // an evaluation.
            if (isWidgetActionOrJsObject(entity) && typeof value === "string") {
              const entity: ActionEntity | WidgetEntity | JSActionEntity =
                unEvalDataTree[entityName] as
                  | ActionEntity
                  | WidgetEntity
                  | JSActionEntity;
              const entityConfig = configTree[entityName];
              const fullPropertyPath = dataTreeDiff.payload.propertyPath;

              const entityPropertyPath = getPropertyPath(fullPropertyPath);
              const isADynamicBindingPath = isPathADynamicBinding(
                entityConfig,
                entityPropertyPath,
              );
              if (isADynamicBindingPath) {
                didUpdateDependencyMap = true;

                const { jsSnippets } = getDynamicBindings(value, entity);
                const correctSnippets = jsSnippets.filter(
                  (jsSnippet) => !!jsSnippet,
                );
                const {
                  errors: extractDependencyErrors,
                  invalidReferences,
                  validReferences,
                } = extractInfoFromBindings(correctSnippets, allKeys);
                updateMap(
                  this.invalidReferencesMap,
                  fullPropertyPath,
                  invalidReferences,
                  { replaceValue: true, deleteOnEmpty: true },
                );

                dataTreeEvalErrors = dataTreeEvalErrors.concat(
                  extractDependencyErrors,
                );
                // update asyncFunctionInSyncfieldsMap
                const updatedAsyncJSFunctions =
                  asyncJsFunctionInDataFields.handlePathEdit(
                    fullPropertyPath,
                    validReferences,
                    unEvalDataTree,
                    this.inverseDependencyMap,
                    configTree,
                  );
                extraPathsToLint = extraPathsToLint.concat(
                  updatedAsyncJSFunctions,
                );
                // We found a new dynamic binding for this property path. We update the dependency map by overwriting the
                // dependencies for this property path with the newly found dependencies

                if (correctSnippets.length) {
                  this.dependencyMap[fullPropertyPath] = validReferences;
                } else {
                  // The dependency on this property path has been removed. Delete this property path from the global
                  // dependency map
                  delete this.dependencyMap[fullPropertyPath];
                }
                if (isAction(entity) || isJSAction(entity)) {
                  // Actions have a defined dependency map that should always be maintained
                  if (entityPropertyPath in entityConfig.dependencyMap) {
                    const entityDependenciesName = entityConfig.dependencyMap[
                      entityPropertyPath
                    ].map((dep: string) => `${entityName}.${dep}`);

                    const { errors, invalidReferences, validReferences } =
                      extractInfoFromBindings(entityDependenciesName, allKeys);
                    updateMap(
                      this.invalidReferencesMap,
                      fullPropertyPath,
                      invalidReferences,
                      { replaceValue: true, deleteOnEmpty: true },
                    );

                    errors.forEach((error) => {
                      dataTreeEvalErrors.push(error);
                    });

                    // Now assign these existing dependent paths to the property path in dependencyMap
                    if (fullPropertyPath in this.dependencyMap) {
                      this.dependencyMap[fullPropertyPath] =
                        this.dependencyMap[fullPropertyPath].concat(
                          validReferences,
                        );
                    } else {
                      this.dependencyMap[fullPropertyPath] = validReferences;
                    }
                  }
                }
              }
              // If the whole binding was removed, then the value at this path would be a string without any bindings.
              // In this case, if the path exists in the dependency map and is a bindingPath, then remove it.
              else if (
                entityConfig.bindingPaths[entityPropertyPath] &&
                fullPropertyPath in this.dependencyMap
              ) {
                didUpdateDependencyMap = true;
                delete this.dependencyMap[fullPropertyPath];
                delete this.invalidReferencesMap[fullPropertyPath];
                // update asyncFunctionInSyncfieldsMap
                const updatedAsyncJSFunctions =
                  asyncJsFunctionInDataFields.handlePathEdit(
                    fullPropertyPath,
                    [],
                    unEvalDataTree,
                    this.inverseDependencyMap,
                    configTree,
                  );
                extraPathsToLint = extraPathsToLint.concat(
                  updatedAsyncJSFunctions,
                );
              }
            }
            if (
              isWidget(entity) &&
              isPathDynamicTrigger(
                entityConfig,
                getPropertyPath(fullPropertyPath),
              )
            ) {
              const { jsSnippets } = getDynamicBindings(
                dataTreeDiff.payload.value || "",
                entity,
              );
              const entityDependencies = jsSnippets.filter(
                (jsSnippet) => !!jsSnippet,
              );

              const {
                errors: extractDependencyErrors,
                invalidReferences,
                validReferences,
              } = extractInfoFromBindings(entityDependencies, allKeys);

              dataTreeEvalErrors = dataTreeEvalErrors.concat(
                extractDependencyErrors,
              );
              updateMap(
                this.invalidReferencesMap,
                fullPropertyPath,
                invalidReferences,
                {
                  replaceValue: true,
                  deleteOnEmpty: true,
                },
              );
              updateMap(
                this.triggerFieldDependencyMap,
                fullPropertyPath,
                validReferences,
                { replaceValue: true },
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
    if (didUpdateDependencyMap) {
      this.dependencyMap = makeParentsDependOnChildren(
        this.dependencyMap,
        allKeys,
      );
    }
    const subDepCalcEnd = performance.now();
    const updateChangedDependenciesStart = performance.now();
    // If the global dependency map has changed, re-calculate the sort order for all entities and the
    // global inverse dependency map
    if (didUpdateDependencyMap) {
      // This is being called purely to test for new circular dependencies that might have been added
      this.sortedDependencies = dataTreeEvaluator.sortDependencies(
        this.dependencyMap,
        translatedDiffs,
      );
      this.inverseDependencyMap = dataTreeEvaluator.getInverseDependencyTree();
    }

    if (didUpdateValidationDependencyMap) {
      // This is being called purely to test for new circular dependencies that might have been added
      this.sortedValidationDependencies = dataTreeEvaluator.sortDependencies(
        this.validationDependencyMap,
        translatedDiffs,
      );

      this.inverseValidationDependencyMap =
        dataTreeEvaluator.getInverseDependencyTree({
          dependencyMap: this.validationDependencyMap,
          sortedDependencies: this.sortedValidationDependencies,
        });
    }

    /** We need this in order clear out the paths that could have errors when a property is deleted */
    if (pathsToClearErrorsFor.length) {
      pathsToClearErrorsFor.forEach((error) => {
        error.paths.forEach((path: string) => {
          set(evalProps, getEvalErrorPath(path), []);
        });
      });
    }

    const updateChangedDependenciesStop = performance.now();
    dataTreeEvaluator.logs.push({
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
      extraPathsToLint: uniq(extraPathsToLint),
    };
  }
}

export const dependencyMapObj = new DependencyMapClass();
