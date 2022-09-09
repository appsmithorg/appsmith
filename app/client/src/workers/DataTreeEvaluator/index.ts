import {
  DependencyMap,
  EvalError,
  EvalErrorTypes,
  EvaluationError,
  getDynamicBindings,
  getEntityDynamicBindingPathList,
  getEvalErrorPath,
  getEvalValuePath,
  isChildPropertyPath,
  isPathADynamicBinding,
  isPathADynamicTrigger,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import { WidgetTypeConfigMap } from "utils/WidgetFactory";
import {
  DataTree,
  DataTreeAction,
  DataTreeEntity,
  DataTreeJSAction,
  DataTreeWidget,
  ENTITY_TYPE,
  EvaluationSubstitutionType,
  PrivateWidgets,
} from "entities/DataTree/dataTreeFactory";
import {
  addDependantsOfNestedPropertyPaths,
  addErrorToEntityProperty,
  convertPathToString,
  CrashingError,
  DataTreeDiff,
  getEntityNameAndPropertyPath,
  getImmediateParentsOfPropertyPaths,
  getValidatedTree,
  isAction,
  isDynamicLeaf,
  isJSAction,
  isWidget,
  removeFunctions,
  translateDiffEventToDataTreeDiffEvent,
  trimDependantChangePaths,
  validateWidgetProperty,
  validateActionProperty,
  addWidgetPropertyDependencies,
  overrideWidgetProperties,
  isValidEntity,
  getAllPaths,
} from "workers/evaluationUtils";
import _ from "lodash";
import { applyChange, Diff, diff } from "deep-diff";
import toposort from "toposort";
import {
  EXECUTION_PARAM_KEY,
  EXECUTION_PARAM_REFERENCE_REGEX,
  THIS_DOT_PARAMS_KEY,
} from "constants/AppsmithActionConstants/ActionConstants";
import { DATA_BIND_REGEX } from "constants/BindingsConstants";
import evaluateSync, {
  EvalResult,
  EvaluateContext,
  evaluateAsync,
} from "workers/evaluate";
import { substituteDynamicBindingWithValues } from "workers/evaluationSubstitution";
import {
  Severity,
  SourceEntity,
  ENTITY_TYPE as CONSOLE_ENTITY_TYPE,
} from "entities/AppsmithConsole";
import { error as logError } from "loglevel";
import { JSUpdate } from "utils/JSPaneUtils";

import {
  ActionValidationConfigMap,
  ValidationConfig,
} from "constants/PropertyControlConstants";
import { klona } from "klona/full";
import { EvalMetaUpdates } from "./types";
import {
  extractReferencesFromBinding,
  getEntityReferencesFromPropertyBindings,
} from "workers/DependencyMap/utils";
import {
  updateDependencyMap,
  createDependencyMap,
} from "workers/DependencyMap";
import {
  getJSEntities,
  getUpdatedLocalUnEvalTreeAfterJSUpdates,
  parseJSActions,
} from "workers/JSObject";
import { lintTree } from "workers/Lint";
import { UserLogObject } from "workers/UserLog";

export default class DataTreeEvaluator {
  dependencyMap: DependencyMap = {};
  sortedDependencies: Array<string> = [];
  inverseDependencyMap: DependencyMap = {};
  widgetConfigMap: WidgetTypeConfigMap = {};
  evalTree: DataTree = {};
  allKeys: Record<string, true> = {};
  privateWidgets: PrivateWidgets = {};
  oldUnEvalTree: DataTree = {};
  errors: EvalError[] = [];
  resolvedFunctions: Record<string, any> = {};
  currentJSCollectionState: Record<string, any> = {};
  logs: unknown[] = [];
  userLogs: UserLogObject[] = [];
  allActionValidationConfig?: {
    [actionId: string]: ActionValidationConfigMap;
  };
  triggerFieldDependencyMap: DependencyMap = {};
  triggerFieldInverseDependencyMap: DependencyMap = {};
  public hasCyclicalDependency = false;
  constructor(
    widgetConfigMap: WidgetTypeConfigMap,
    allActionValidationConfig?: {
      [actionId: string]: ActionValidationConfigMap;
    },
  ) {
    this.allActionValidationConfig = allActionValidationConfig;
    this.widgetConfigMap = widgetConfigMap;
  }

  /**
   * This method takes unEvalTree as input and does following
   * 1. parseJSActions and updates JS
   * 2. Creates dependencyMap, sorted dependencyMap
   * 3. Generates inverseDependencyTree
   * 4. Finally, evaluates the unEvalTree and returns that with JSUpdates
   *
   * @param {DataTree} unEvalTree
   * @return {*}
   * @memberof DataTreeEvaluator
   */
  createFirstTree(unEvalTree: DataTree) {
    const totalStart = performance.now();
    // cloneDeep will make sure not to omit key which has value as undefined.
    let localUnEvalTree = klona(unEvalTree);
    let jsUpdates: Record<string, JSUpdate> = {};
    //parse js collection to get functions
    //save current state of js collection action and variables to be added to uneval tree
    //save functions in resolveFunctions (as functions) to be executed as functions are not allowed in evalTree
    //and functions are saved in dataTree as strings
    const parsedCollections = parseJSActions(this, localUnEvalTree);
    jsUpdates = parsedCollections.jsUpdates;
    localUnEvalTree = getUpdatedLocalUnEvalTreeAfterJSUpdates(
      jsUpdates,
      localUnEvalTree,
    );
    // set All keys
    this.allKeys = getAllPaths(localUnEvalTree);
    // Create dependency map
    const createDependencyStart = performance.now();
    const { dependencyMap, triggerFieldDependencyMap } = createDependencyMap(
      this,
      localUnEvalTree,
    );
    this.dependencyMap = dependencyMap;
    this.triggerFieldDependencyMap = triggerFieldDependencyMap;
    const createDependencyEnd = performance.now();
    // Sort
    const sortDependenciesStart = performance.now();
    this.sortedDependencies = this.sortDependencies(this.dependencyMap);
    const sortDependenciesEnd = performance.now();
    // Inverse
    this.inverseDependencyMap = this.getInverseDependencyTree();
    this.triggerFieldInverseDependencyMap = this.getInverseTriggerDependencyMap();
    // Evaluate
    const evaluateStart = performance.now();
    const { evalMetaUpdates, evaluatedTree } = this.evaluateTree(
      localUnEvalTree,
      this.resolvedFunctions,
      this.sortedDependencies,
    );
    const evaluateEnd = performance.now();
    // Validate Widgets
    const validateStart = performance.now();
    this.evalTree = getValidatedTree(evaluatedTree);
    const validateEnd = performance.now();

    this.oldUnEvalTree = klona(localUnEvalTree);
    // Lint
    const lintStart = performance.now();
    lintTree({
      unEvalTree: localUnEvalTree,
      evalTree: this.evalTree,
      sortedDependencies: this.sortedDependencies,
      triggerPathsToLint: [],
    });
    const lintStop = performance.now();
    const totalEnd = performance.now();
    const timeTakenForFirstTree = {
      total: (totalEnd - totalStart).toFixed(2),
      createDependencies: (createDependencyEnd - createDependencyStart).toFixed(
        2,
      ),
      sortDependencies: (sortDependenciesEnd - sortDependenciesStart).toFixed(
        2,
      ),
      evaluate: (evaluateEnd - evaluateStart).toFixed(2),
      validate: (validateEnd - validateStart).toFixed(2),
      dependencies: {
        map: JSON.parse(JSON.stringify(this.dependencyMap)),
        inverseMap: JSON.parse(JSON.stringify(this.inverseDependencyMap)),
        sortedList: JSON.parse(JSON.stringify(this.sortedDependencies)),
        triggerFieldMap: JSON.parse(
          JSON.stringify(this.triggerFieldDependencyMap),
        ),
        triggerFieldInverseMap: JSON.parse(
          JSON.stringify(this.triggerFieldInverseDependencyMap),
        ),
      },
      lint: (lintStop - lintStart).toFixed(2),
    };
    this.logs.push({ timeTakenForFirstTree });
    return {
      evalTree: this.evalTree,
      jsUpdates,
      evalMetaUpdates,
    };
  }

  isJSObjectFunction(dataTree: DataTree, jsObjectName: string, key: string) {
    const entity = dataTree[jsObjectName];
    if (isJSAction(entity)) {
      return entity.meta.hasOwnProperty(key);
    }
    return false;
  }

  updateLocalUnEvalTree(dataTree: DataTree) {
    //add functions and variables to unevalTree
    Object.keys(this.currentJSCollectionState).forEach((update) => {
      const updates = this.currentJSCollectionState[update];
      if (!!dataTree[update]) {
        Object.keys(updates).forEach((key) => {
          const data = _.get(dataTree, `${update}.${key}.data`, undefined);
          if (this.isJSObjectFunction(dataTree, update, key)) {
            _.set(dataTree, `${update}.${key}`, new String(updates[key]));
            _.set(dataTree, `${update}.${key}.data`, data);
          } else {
            _.set(dataTree, `${update}.${key}`, updates[key]);
          }
        });
      }
    });
  }

  updateDataTree(
    unEvalTree: DataTree,
  ): {
    evaluationOrder: string[];
    unEvalUpdates: DataTreeDiff[];
    jsUpdates: Record<string, JSUpdate>;
    evalMetaUpdates: EvalMetaUpdates;
  } {
    let localUnEvalTree = Object.assign({}, unEvalTree);
    const totalStart = performance.now();
    let jsUpdates: Record<string, JSUpdate> = {};
    // Calculate diff
    const diffCheckTimeStart = performance.now();
    //update uneval tree from previously saved current state of collection
    this.updateLocalUnEvalTree(localUnEvalTree);
    //get difference in js collection body to be parsed
    const oldUnEvalTreeJSCollections = getJSEntities(this.oldUnEvalTree);
    const localUnEvalTreeJSCollection = getJSEntities(localUnEvalTree);
    const jsDifferences: Diff<
      Record<string, DataTreeJSAction>,
      Record<string, DataTreeJSAction>
    >[] = diff(oldUnEvalTreeJSCollections, localUnEvalTreeJSCollection) || [];
    const jsTranslatedDiffs = _.flatten(
      jsDifferences.map((diff) =>
        translateDiffEventToDataTreeDiffEvent(diff, localUnEvalTree),
      ),
    );
    //save parsed functions in resolveJSFunctions, update current state of js collection
    const parsedCollections = parseJSActions(
      this,
      localUnEvalTree,
      jsTranslatedDiffs,
      this.oldUnEvalTree,
    );

    jsUpdates = parsedCollections.jsUpdates;
    //update local data tree if js body has updated (remove/update/add js functions or variables)
    localUnEvalTree = getUpdatedLocalUnEvalTreeAfterJSUpdates(
      jsUpdates,
      localUnEvalTree,
    );

    const differences: Diff<DataTree, DataTree>[] =
      diff(this.oldUnEvalTree, localUnEvalTree) || [];
    // Since eval tree is listening to possible events that don't cause differences
    // We want to check if no diffs are present and bail out early
    if (differences.length === 0) {
      return {
        evaluationOrder: [],
        unEvalUpdates: [],
        jsUpdates: {},
        evalMetaUpdates: [],
      };
    }
    //find all differences which can lead to updating of dependency map
    const translatedDiffs = _.flatten(
      differences.map((diff) =>
        translateDiffEventToDataTreeDiffEvent(diff, localUnEvalTree),
      ),
    );
    this.logs.push({
      differences,
      translatedDiffs,
    });
    const diffCheckTimeStop = performance.now();
    // Check if dependencies have changed
    const updateDependenciesStart = performance.now();

    // Find all the paths that have changed as part of the difference and update the
    // global dependency map if an existing dynamic binding has now become legal
    const {
      dependenciesOfRemovedPaths,
      removedPaths,
      triggerPathsToLint,
    } = updateDependencyMap({
      dataTreeEvalRef: this,
      translatedDiffs,
      unEvalDataTree: localUnEvalTree,
    });

    const updateDependenciesStop = performance.now();

    this.applyDifferencesToEvalTree(differences);

    const calculateSortOrderStart = performance.now();

    const subTreeSortOrder: string[] = this.calculateSubTreeSortOrder(
      differences,
      dependenciesOfRemovedPaths,
      removedPaths,
      localUnEvalTree,
    );

    const calculateSortOrderStop = performance.now();

    // Evaluate
    const evalStart = performance.now();

    // Remove anything from the sort order that is not a dynamic leaf since only those need evaluation
    const evaluationOrder = subTreeSortOrder.filter((propertyPath) => {
      // We are setting all values from our uneval tree to the old eval tree we have
      // So that the actual uneval value can be evaluated
      if (isDynamicLeaf(localUnEvalTree, propertyPath)) {
        const unEvalPropValue = _.get(localUnEvalTree, propertyPath);
        const evalPropValue = _.get(this.evalTree, propertyPath);
        if (!_.isFunction(evalPropValue)) {
          _.set(this.evalTree, propertyPath, unEvalPropValue);
        }
        return true;
      }
      return false;
    });

    this.logs.push({
      sortedDependencies: this.sortedDependencies,
      inverse: this.inverseDependencyMap,
      updatedDependencyMap: this.dependencyMap,
      evaluationOrder: evaluationOrder,
    });

    // Remove any deleted paths from the eval tree
    removedPaths.forEach((removedPath) => {
      _.unset(this.evalTree, removedPath);
    });
    const { evalMetaUpdates, evaluatedTree: newEvalTree } = this.evaluateTree(
      this.evalTree,
      this.resolvedFunctions,
      evaluationOrder,
    );
    const evalStop = performance.now();

    // TODO: For some reason we are passing some reference which are getting mutated.
    // Need to check why big api responses are getting split between two eval runs
    this.oldUnEvalTree = klona(localUnEvalTree);

    // Lint
    const lintStart = performance.now();
    lintTree({
      unEvalTree: localUnEvalTree,
      evalTree: newEvalTree,
      sortedDependencies: evaluationOrder,
      triggerPathsToLint,
    });
    const lintStop = performance.now();

    const totalEnd = performance.now();
    this.evalTree = newEvalTree;
    const timeTakenForSubTreeEval = {
      total: (totalEnd - totalStart).toFixed(2),
      findDifferences: (diffCheckTimeStop - diffCheckTimeStart).toFixed(2),
      updateDependencies: (
        updateDependenciesStop - updateDependenciesStart
      ).toFixed(2),
      calculateSortOrder: (
        calculateSortOrderStop - calculateSortOrderStart
      ).toFixed(2),
      evaluate: (evalStop - evalStart).toFixed(2),
      lint: (lintStop - lintStart).toFixed(2),
    };
    this.logs.push({ timeTakenForSubTreeEval });

    return {
      evaluationOrder,
      unEvalUpdates: translatedDiffs,
      jsUpdates,
      evalMetaUpdates,
    };
  }

  getCompleteSortOrder(
    changes: Array<string>,
    inverseMap: DependencyMap,
  ): Array<string> {
    let finalSortOrder: Array<string> = [];
    let computeSortOrder = true;
    // Initialize parents with the current sent of property paths that need to be evaluated
    let parents = changes;
    let subSortOrderArray: Array<string>;
    while (computeSortOrder) {
      // Get all the nodes that would be impacted by the evaluation of the nodes in parents array in sorted order
      subSortOrderArray = this.getEvaluationSortOrder(parents, inverseMap);

      // Add all the sorted nodes in the final list
      finalSortOrder = [...finalSortOrder, ...subSortOrderArray];

      parents = getImmediateParentsOfPropertyPaths(subSortOrderArray);
      // If we find parents of the property paths in the sorted array, we should continue finding all the nodes dependent
      // on the parents
      computeSortOrder = parents.length > 0;
    }

    // Remove duplicates from this list. Since we explicitly walk down the tree and implicitly (by fetching parents) walk
    // up the tree, there are bound to be many duplicates.
    const uniqueKeysInSortOrder = new Set(finalSortOrder);

    // if a property path evaluation gets triggered by diff top order changes
    // this could lead to incorrect sort order in spite of the bfs traversal
    const sortOrderPropertyPaths: string[] = [];
    this.sortedDependencies.forEach((path) => {
      if (uniqueKeysInSortOrder.has(path)) {
        sortOrderPropertyPaths.push(path);
        // remove from the uniqueKeysInSortOrder
        uniqueKeysInSortOrder.delete(path);
      }
    });
    // Add any remaining paths in the uniqueKeysInSortOrder
    const completeSortOrder = [
      ...Array.from(uniqueKeysInSortOrder),
      ...sortOrderPropertyPaths,
    ];

    //Trim this list to now remove the property paths which are simply entity names
    const finalSortOrderArray: Array<string> = [];
    completeSortOrder.forEach((propertyPath) => {
      const lastIndexOfDot = propertyPath.lastIndexOf(".");
      // Only do this for property paths and not the entity themselves
      if (lastIndexOfDot !== -1) {
        finalSortOrderArray.push(propertyPath);
      }
    });

    return finalSortOrderArray;
  }

  getEvaluationSortOrder(
    changes: Array<string>,
    inverseMap: DependencyMap,
  ): Array<string> {
    const sortOrder: Array<string> = [...changes];
    let iterator = 0;
    while (iterator < sortOrder.length) {
      // Find all the nodes who are to be evaluated when sortOrder[iterator] changes
      const newNodes = inverseMap[sortOrder[iterator]];

      // If we find more nodes that would be impacted by the evaluation of the node being investigated
      // we add these to the sort order.
      if (newNodes) {
        newNodes.forEach((toBeEvaluatedNode) => {
          // Only add the nodes if they haven't been already added for evaluation in the list. Since we are doing
          // breadth first traversal, we should be safe in not changing the evaluation order and adding this now at this
          // point instead of the previous index found.
          if (!sortOrder.includes(toBeEvaluatedNode)) {
            sortOrder.push(toBeEvaluatedNode);
          }
        });
      }
      iterator++;
    }
    return sortOrder;
  }

  getPrivateWidgets(dataTree: DataTree): PrivateWidgets {
    let privateWidgets: PrivateWidgets = {};
    Object.keys(dataTree).forEach((entityName) => {
      const entity = dataTree[entityName];
      if (isWidget(entity) && !_.isEmpty(entity.privateWidgets)) {
        privateWidgets = {
          ...privateWidgets,
          ...entity.privateWidgets,
        };
      }
    });
    return privateWidgets;
  }

  listEntityDependencies(
    entity: DataTreeWidget | DataTreeAction | DataTreeJSAction,
    entityName: string,
  ): DependencyMap {
    let dependencies: DependencyMap = {};

    if (isWidget(entity)) {
      // Adding the dynamic triggers in the dependency list as they need linting whenever updated
      // we don't make it dependent on anything else
      if (entity.dynamicTriggerPathList) {
        Object.values(entity.dynamicTriggerPathList).forEach(({ key }) => {
          dependencies[`${entityName}.${key}`] = [];
        });
      }
      const widgetDependencies = addWidgetPropertyDependencies({
        entity,
        entityName,
      });

      dependencies = {
        ...dependencies,
        ...widgetDependencies,
      };
    }

    if (isAction(entity) || isJSAction(entity)) {
      Object.entries(entity.dependencyMap).forEach(
        ([path, entityDependencies]) => {
          const actionDependentPaths: Array<string> = [];
          const mainPath = `${entityName}.${path}`;
          // Only add dependencies for paths which exist at the moment in appsmith world
          if (this.allKeys.hasOwnProperty(mainPath)) {
            // Only add dependent paths which exist in the data tree. Skip all the other paths to avoid creating
            // a cyclical dependency.
            entityDependencies.forEach((dependentPath) => {
              const completePath = `${entityName}.${dependentPath}`;
              if (this.allKeys.hasOwnProperty(completePath)) {
                actionDependentPaths.push(completePath);
              }
            });
            dependencies[mainPath] = actionDependentPaths;
          }
        },
      );
    }
    if (isJSAction(entity)) {
      // making functions dependent on their function body entities
      if (entity.reactivePaths) {
        Object.keys(entity.reactivePaths).forEach((propertyPath) => {
          const existingDeps =
            dependencies[`${entityName}.${propertyPath}`] || [];
          const unevalPropValue = _.get(entity, propertyPath);
          const unevalPropValueString =
            !!unevalPropValue && unevalPropValue.toString();
          const { jsSnippets } = getDynamicBindings(
            unevalPropValueString,
            entity,
          );
          dependencies[`${entityName}.${propertyPath}`] = existingDeps.concat(
            jsSnippets.filter((jsSnippet) => !!jsSnippet),
          );
        });
      }
    }

    if (isAction(entity) || isWidget(entity)) {
      // add the dynamic binding paths to the dependency map
      const dynamicBindingPathList = getEntityDynamicBindingPathList(entity);
      if (dynamicBindingPathList.length) {
        dynamicBindingPathList.forEach((dynamicPath) => {
          const propertyPath = dynamicPath.key;
          const unevalPropValue = _.get(entity, propertyPath);
          const { jsSnippets } = getDynamicBindings(unevalPropValue);
          const existingDeps =
            dependencies[`${entityName}.${propertyPath}`] || [];
          dependencies[`${entityName}.${propertyPath}`] = existingDeps.concat(
            jsSnippets.filter((jsSnippet) => !!jsSnippet),
          );
        });
      }
    }

    return dependencies;
  }

  listTriggerFieldDependencies(
    entity: DataTreeWidget,
    entityName: string,
  ): DependencyMap {
    const triggerFieldDependency: DependencyMap = {};
    if (isWidget(entity)) {
      const dynamicTriggerPathlist = entity.dynamicTriggerPathList;
      if (dynamicTriggerPathlist && dynamicTriggerPathlist.length) {
        dynamicTriggerPathlist.forEach((dynamicPath) => {
          const propertyPath = dynamicPath.key;
          const unevalPropValue = _.get(entity, propertyPath);
          const { jsSnippets } = getDynamicBindings(unevalPropValue);
          const existingDeps =
            triggerFieldDependency[`${entityName}.${propertyPath}`] || [];
          triggerFieldDependency[
            `${entityName}.${propertyPath}`
          ] = existingDeps.concat(
            jsSnippets.filter((jsSnippet) => !!jsSnippet),
          );
        });
      }
    }
    return triggerFieldDependency;
  }
  evaluateTree(
    oldUnevalTree: DataTree,
    resolvedFunctions: Record<string, any>,
    sortedDependencies: Array<string>,
  ): {
    evaluatedTree: DataTree;
    evalMetaUpdates: EvalMetaUpdates;
  } {
    const tree = klona(oldUnevalTree);
    const evalMetaUpdates: EvalMetaUpdates = [];
    try {
      const evaluatedTree = sortedDependencies.reduce(
        (currentTree: DataTree, fullPropertyPath: string) => {
          const { entityName, propertyPath } = getEntityNameAndPropertyPath(
            fullPropertyPath,
          );
          const entity = currentTree[entityName] as
            | DataTreeWidget
            | DataTreeAction;
          const unEvalPropertyValue = _.get(
            currentTree as any,
            fullPropertyPath,
          );

          const isADynamicBindingPath =
            (isAction(entity) || isWidget(entity) || isJSAction(entity)) &&
            isPathADynamicBinding(entity, propertyPath);
          const isATriggerPath =
            isWidget(entity) && isPathADynamicTrigger(entity, propertyPath);
          let evalPropertyValue;
          const requiresEval =
            isADynamicBindingPath &&
            !isATriggerPath &&
            (isDynamicValue(unEvalPropertyValue) || isJSAction(entity));
          if (propertyPath) {
            _.set(currentTree, getEvalErrorPath(fullPropertyPath), []);
          }
          if (requiresEval) {
            const evaluationSubstitutionType =
              entity.reactivePaths[propertyPath] ||
              EvaluationSubstitutionType.TEMPLATE;

            const contextData: EvaluateContext = {};
            if (isAction(entity)) {
              contextData.thisContext = {
                params: {},
              };
            }
            try {
              evalPropertyValue = this.getDynamicValue(
                unEvalPropertyValue,
                currentTree,
                resolvedFunctions,
                evaluationSubstitutionType,
                contextData,
                undefined,
                fullPropertyPath,
              );
            } catch (error) {
              this.errors.push({
                type: EvalErrorTypes.EVAL_PROPERTY_ERROR,
                message: (error as Error).message,
                context: {
                  propertyPath: fullPropertyPath,
                },
              });
              evalPropertyValue = undefined;
            }
          } else {
            evalPropertyValue = unEvalPropertyValue;
          }
          if (isWidget(entity) && !isATriggerPath) {
            if (propertyPath) {
              let parsedValue = this.validateAndParseWidgetProperty({
                fullPropertyPath,
                widget: entity,
                currentTree,
                evalPropertyValue,
                unEvalPropertyValue,
              });
              const overwriteObj = overrideWidgetProperties({
                entity,
                propertyPath,
                value: parsedValue,
                currentTree,
                evalMetaUpdates,
              });

              if (overwriteObj && overwriteObj.overwriteParsedValue) {
                parsedValue = overwriteObj.newValue;
              }
              return _.set(currentTree, fullPropertyPath, parsedValue);
            }
            return _.set(currentTree, fullPropertyPath, evalPropertyValue);
          } else if (isATriggerPath) {
            return currentTree;
          } else if (isAction(entity)) {
            if (this.allActionValidationConfig) {
              const configProperty = propertyPath.replace(
                "config",
                "actionConfiguration",
              );
              const validationConfig =
                !!this.allActionValidationConfig[entity.actionId] &&
                this.allActionValidationConfig[entity.actionId][configProperty];
              if (!!validationConfig && !_.isEmpty(validationConfig)) {
                this.validateActionProperty(
                  fullPropertyPath,
                  entity,
                  currentTree,
                  evalPropertyValue,
                  unEvalPropertyValue,
                  validationConfig,
                );
              }
            }
            const safeEvaluatedValue = removeFunctions(evalPropertyValue);
            _.set(
              currentTree,
              getEvalValuePath(fullPropertyPath),
              safeEvaluatedValue,
            );
            _.set(currentTree, fullPropertyPath, evalPropertyValue);
            return currentTree;
          } else if (isJSAction(entity)) {
            const variableList: Array<string> =
              _.get(entity, "variables") || [];
            if (variableList.indexOf(propertyPath) > -1) {
              const currentEvaluatedValue = _.get(
                currentTree,
                getEvalValuePath(fullPropertyPath, {
                  isPopulated: true,
                  fullPath: true,
                }),
              );
              if (!currentEvaluatedValue) {
                _.set(
                  currentTree,
                  getEvalValuePath(fullPropertyPath, {
                    isPopulated: true,
                    fullPath: true,
                  }),
                  evalPropertyValue,
                );
                _.set(currentTree, fullPropertyPath, evalPropertyValue);
              } else {
                _.set(currentTree, fullPropertyPath, currentEvaluatedValue);
              }
            }
            return currentTree;
          } else {
            return _.set(currentTree, fullPropertyPath, evalPropertyValue);
          }
        },
        tree,
      );
      return { evaluatedTree, evalMetaUpdates };
    } catch (error) {
      this.errors.push({
        type: EvalErrorTypes.EVAL_TREE_ERROR,
        message: (error as Error).message,
      });
      return { evaluatedTree: tree, evalMetaUpdates };
    }
  }

  setAllActionValidationConfig(allActionValidationConfig: {
    [actionId: string]: ActionValidationConfigMap;
  }): void {
    this.allActionValidationConfig = allActionValidationConfig;
  }

  sortDependencies(
    dependencyMap: DependencyMap,
    diffs?: (DataTreeDiff | DataTreeDiff[])[],
  ): Array<string> {
    const dependencyTree: Array<[string, string]> = [];
    Object.keys(dependencyMap).forEach((key: string) => {
      if (dependencyMap[key].length) {
        dependencyMap[key].forEach((dep) => dependencyTree.push([key, dep]));
      } else {
        // Set no dependency
        dependencyTree.push([key, ""]);
      }
    });

    try {
      // sort dependencies and remove empty dependencies
      return toposort(dependencyTree)
        .reverse()
        .filter((d) => !!d);
    } catch (error) {
      // Cyclic dependency found. Extract all node and entity type
      const cyclicNodes = (error as Error).message.match(
        new RegExp('Cyclic dependency, node was:"(.*)"'),
      );

      const node = cyclicNodes?.length ? cyclicNodes[1] : "";

      let entityType = "UNKNOWN";
      const entityName = node.split(".")[0];
      const entity = _.get(this.oldUnEvalTree, entityName);
      if (entity && isWidget(entity)) {
        entityType = entity.type;
      } else if (entity && isAction(entity)) {
        entityType = entity.pluginType;
      } else if (entity && isJSAction(entity)) {
        entityType = entity.ENTITY_TYPE;
      }
      this.errors.push({
        type: EvalErrorTypes.CYCLICAL_DEPENDENCY_ERROR,
        message: "Cyclic dependency found while evaluating.",
        context: {
          node,
          entityType,
          dependencyMap,
          diffs,
        },
      });
      logError("CYCLICAL DEPENDENCY MAP", dependencyMap);
      this.hasCyclicalDependency = true;
      throw new CrashingError((error as Error).message);
    }
  }

  getDynamicValue(
    dynamicBinding: string,
    data: DataTree,
    resolvedFunctions: Record<string, any>,
    evaluationSubstitutionType: EvaluationSubstitutionType,
    contextData?: EvaluateContext,
    callBackData?: Array<any>,
    fullPropertyPath?: string,
  ) {
    // Get the {{binding}} bound values
    let entity: DataTreeEntity | undefined = undefined;
    let propertyPath: string;
    if (fullPropertyPath) {
      const entityName = fullPropertyPath.split(".")[0];
      propertyPath = fullPropertyPath.split(".")[1];
      entity = data[entityName];
    }
    // Get the {{binding}} bound values
    const { jsSnippets, stringSegments } = getDynamicBindings(
      dynamicBinding,
      entity,
    );
    if (stringSegments.length) {
      // Get the Data Tree value of those "binding "paths
      const values = jsSnippets.map((jsSnippet, index) => {
        const toBeSentForEval =
          entity && isJSAction(entity) && propertyPath === "body"
            ? jsSnippet.replace(/export default/g, "")
            : jsSnippet;
        if (jsSnippet) {
          const result = this.evaluateDynamicBoundValue(
            toBeSentForEval,
            data,
            resolvedFunctions,
            !!entity && isJSAction(entity),
            contextData,
            callBackData,
            fullPropertyPath?.includes("body") ||
              !toBeSentForEval.includes("console."),
          );
          if (fullPropertyPath && result.errors.length) {
            addErrorToEntityProperty(result.errors, data, fullPropertyPath);
          }
          // if there are any console outputs found from the evaluation, extract them and add them to the logs array
          if (
            !!entity &&
            !!result.logs &&
            result.logs.length > 0 &&
            !propertyPath.includes("body")
          ) {
            let type = CONSOLE_ENTITY_TYPE.WIDGET;
            let id = "";

            // extracting the id and type of the entity from the entity for logs object
            if (isWidget(entity)) {
              type = CONSOLE_ENTITY_TYPE.WIDGET;
              id = entity.widgetId;
            } else if (isAction(entity)) {
              type = CONSOLE_ENTITY_TYPE.ACTION;
              id = entity.actionId;
            } else if (isJSAction(entity)) {
              type = CONSOLE_ENTITY_TYPE.JSACTION;
              id = entity.actionId;
            }

            // This is the object that will help to associate the log with the origin entity
            const source: SourceEntity = {
              type,
              name: fullPropertyPath?.split(".")[0] || "Widget",
              id,
            };
            this.userLogs.push({
              logObject: result.logs,
              source,
            });
          }
          return result.result;
        } else {
          return stringSegments[index];
        }
      });

      // We don't need to substitute template of the result if only one binding exists
      // But it should not be of prepared statements since that does need a string
      if (
        stringSegments.length === 1 &&
        evaluationSubstitutionType !== EvaluationSubstitutionType.PARAMETER
      ) {
        return values[0];
      }
      try {
        // else return a combined value according to the evaluation type
        return substituteDynamicBindingWithValues(
          dynamicBinding,
          stringSegments,
          values,
          evaluationSubstitutionType,
        );
      } catch (error) {
        if (fullPropertyPath) {
          addErrorToEntityProperty(
            [
              {
                raw: dynamicBinding,
                errorType: PropertyEvaluationErrorType.PARSE,
                errorMessage: (error as Error).message,
                severity: Severity.ERROR,
              },
            ],
            data,
            fullPropertyPath,
          );
        }
        return undefined;
      }
    }
    return undefined;
  }

  async evaluateTriggers(
    userScript: string,
    dataTree: DataTree,
    requestId: string,
    resolvedFunctions: Record<string, any>,
    callbackData: Array<unknown>,
    context?: EvaluateContext,
  ) {
    const { jsSnippets } = getDynamicBindings(userScript);
    return evaluateAsync(
      jsSnippets[0] || userScript,
      dataTree,
      requestId,
      resolvedFunctions,
      context,
      callbackData,
    );
  }

  // Paths are expected to have "{name}.{path}" signature
  // Also returns any action triggers found after evaluating value
  evaluateDynamicBoundValue(
    js: string,
    data: DataTree,
    resolvedFunctions: Record<string, any>,
    createGlobalData: boolean,
    contextData?: EvaluateContext,
    callbackData?: Array<any>,
    skipUserLogsOperations = false,
  ): EvalResult {
    try {
      return evaluateSync(
        js,
        data,
        resolvedFunctions,
        createGlobalData,
        contextData,
        callbackData,
        skipUserLogsOperations,
      );
    } catch (error) {
      return {
        result: undefined,
        errors: [
          {
            errorType: PropertyEvaluationErrorType.PARSE,
            raw: js,
            severity: Severity.ERROR,
            errorMessage: (error as Error).message,
          },
        ],
      };
    }
  }

  validateAndParseWidgetProperty({
    currentTree,
    evalPropertyValue,
    fullPropertyPath,
    unEvalPropertyValue,
    widget,
  }: {
    fullPropertyPath: string;
    widget: DataTreeWidget;
    currentTree: DataTree;
    evalPropertyValue: any;
    unEvalPropertyValue: string;
  }): any {
    const { propertyPath } = getEntityNameAndPropertyPath(fullPropertyPath);
    if (isPathADynamicTrigger(widget, propertyPath)) {
      // TODO find a way to validate triggers
      return unEvalPropertyValue;
    }
    const validation = widget.validationPaths[propertyPath];

    const { isValid, messages, parsed, transformed } = validateWidgetProperty(
      validation,
      evalPropertyValue,
      widget,
      propertyPath,
    );

    const evaluatedValue = isValid
      ? parsed
      : _.isUndefined(transformed)
      ? evalPropertyValue
      : transformed;
    const safeEvaluatedValue = removeFunctions(evaluatedValue);
    _.set(
      widget,
      getEvalValuePath(fullPropertyPath, {
        isPopulated: false,
        fullPath: false,
      }),
      safeEvaluatedValue,
    );
    if (!isValid) {
      const evalErrors: EvaluationError[] =
        messages?.map((message) => {
          return {
            raw: unEvalPropertyValue,
            errorMessage: message || "",
            errorType: PropertyEvaluationErrorType.VALIDATION,
            severity: Severity.ERROR,
          };
        }) ?? [];
      addErrorToEntityProperty(evalErrors, currentTree, fullPropertyPath);
    }

    return parsed;
  }

  // validates the user input saved as action property based on a validationConfig
  validateActionProperty(
    fullPropertyPath: string,
    action: DataTreeAction,
    currentTree: DataTree,
    evalPropertyValue: any,
    unEvalPropertyValue: string,
    validationConfig: ValidationConfig,
  ) {
    if (evalPropertyValue && validationConfig) {
      // runs VALIDATOR function and returns errors
      const { isValid, messages } = validateActionProperty(
        validationConfig,
        evalPropertyValue,
      );
      if (!isValid) {
        const evalErrors: EvaluationError[] =
          messages?.map((message) => {
            return {
              raw: unEvalPropertyValue,
              errorMessage: message || "",
              errorType: PropertyEvaluationErrorType.VALIDATION,
              severity: Severity.ERROR,
            };
          }) ?? [];
        // saves error in dataTree at fullPropertyPath
        // Later errors can consumed by the forms and debugger
        addErrorToEntityProperty(evalErrors, currentTree, fullPropertyPath);
      }
    }
  }

  applyDifferencesToEvalTree(differences: Diff<any, any>[]) {
    for (const d of differences) {
      if (!Array.isArray(d.path) || d.path.length === 0) continue; // Null check for typescript
      // Apply the changes into the evalTree so that it gets the latest changes
      applyChange(this.evalTree, undefined, d);
    }
  }

  calculateSubTreeSortOrder(
    differences: Diff<any, any>[],
    dependenciesOfRemovedPaths: Array<string>,
    removedPaths: Array<string>,
    unEvalTree: DataTree,
  ) {
    const changePaths: Set<string> = new Set(dependenciesOfRemovedPaths);
    for (const d of differences) {
      if (!Array.isArray(d.path) || d.path.length === 0) continue; // Null check for typescript
      changePaths.add(convertPathToString(d.path));
      // If this is a property path change, simply add for evaluation and move on
      if (!isDynamicLeaf(unEvalTree, convertPathToString(d.path))) {
        // A parent level property has been added or deleted
        /**
         * We want to add all pre-existing dynamic and static bindings in dynamic paths of this entity to get evaluated and validated.
         * Example:
         * - Table1.tableData = {{Api1.data}}
         * - Api1 gets created.
         * - This function gets called with a diff {path:["Api1"]}
         * We want to add `Api.data` to changedPaths so that `Table1.tableData` can be discovered below.
         */
        const entityName = d.path[0];
        const entity = unEvalTree[entityName];
        if (!entity) {
          continue;
        }
        if (!isAction(entity) && !isWidget(entity) && !isJSAction(entity)) {
          continue;
        }
        let entityDynamicBindingPaths: string[] = [];
        if (isAction(entity)) {
          const entityDynamicBindingPathList = getEntityDynamicBindingPathList(
            entity,
          );
          entityDynamicBindingPaths = entityDynamicBindingPathList.map(
            (path) => {
              return path.key;
            },
          );
        }
        const parentPropertyPath = convertPathToString(d.path);
        Object.keys(entity.reactivePaths).forEach((relativePath) => {
          const childPropertyPath = `${entityName}.${relativePath}`;
          // Check if relative path has dynamic binding
          if (
            entityDynamicBindingPaths &&
            entityDynamicBindingPaths.length &&
            entityDynamicBindingPaths.includes(relativePath)
          ) {
            changePaths.add(childPropertyPath);
          }
          if (isChildPropertyPath(parentPropertyPath, childPropertyPath)) {
            changePaths.add(childPropertyPath);
          }
        });
      }
    }

    // If a nested property path has changed and someone (say x) is dependent on the parent of the said property,
    // x must also be evaluated. For example, the following relationship exists in dependency map:
    // <  "Input1.defaultText" : ["Table1.selectedRow.email"] >
    // If Table1.selectedRow has changed, then Input1.defaultText must also be evaluated because Table1.selectedRow.email
    // is a nested property of Table1.selectedRow
    const changePathsWithNestedDependants = addDependantsOfNestedPropertyPaths(
      Array.from(changePaths),
      this.inverseDependencyMap,
    );

    const trimmedChangedPaths = trimDependantChangePaths(
      changePathsWithNestedDependants,
      this.dependencyMap,
    );

    // Now that we have all the root nodes which have to be evaluated, recursively find all the other paths which
    // would get impacted because they are dependent on the said root nodes and add them in order
    const completeSortOrder = this.getCompleteSortOrder(
      trimmedChangedPaths,
      this.inverseDependencyMap,
    );
    // Remove any paths that do not exist in the data tree anymore
    return _.difference(completeSortOrder, removedPaths);
  }
  getInverseTriggerDependencyMap(): DependencyMap {
    const inverseTree: DependencyMap = {};
    Object.keys(this.triggerFieldDependencyMap).forEach((triggerField) => {
      this.triggerFieldDependencyMap[triggerField].forEach((field) => {
        if (inverseTree[field]) {
          inverseTree[field].push(triggerField);
        } else {
          inverseTree[field] = [triggerField];
        }
      });
    });
    return inverseTree;
  }

  getInverseDependencyTree(): DependencyMap {
    const inverseDag: DependencyMap = {};
    this.sortedDependencies.forEach((propertyPath) => {
      const incomingEdges: Array<string> = this.dependencyMap[propertyPath];
      if (incomingEdges) {
        incomingEdges.forEach((edge) => {
          const node = inverseDag[edge];
          if (node) {
            node.push(propertyPath);
          } else {
            inverseDag[edge] = [propertyPath];
          }
        });
      }
    });
    return inverseDag;
  }

  // TODO: create the lookup dictionary once
  // Response from listEntityDependencies only needs to change if the entity itself changed.
  // Check if it is possible to make a flat structure with O(1) or at least O(m) lookup instead of O(n*m)
  getPropertyPathReferencesInExistingBindings(
    dataTree: DataTree,
    propertyPath: string,
  ) {
    const possibleRefs: DependencyMap = {};
    Object.keys(dataTree).forEach((entityName) => {
      const entity = dataTree[entityName];
      if (
        isValidEntity(entity) &&
        (entity.ENTITY_TYPE === ENTITY_TYPE.ACTION ||
          entity.ENTITY_TYPE === ENTITY_TYPE.JSACTION ||
          entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET)
      ) {
        const entityPropertyBindings = this.listEntityDependencies(
          entity,
          entityName,
        );
        Object.keys(entityPropertyBindings).forEach((path) => {
          const propertyBindings = entityPropertyBindings[path];
          const references = _.flatten(
            propertyBindings.map((binding) => {
              {
                try {
                  return extractReferencesFromBinding(binding, this.allKeys);
                } catch (error) {
                  this.errors.push({
                    type: EvalErrorTypes.EXTRACT_DEPENDENCY_ERROR,
                    message: (error as Error).message,
                    context: {
                      script: binding,
                    },
                  });
                  return [];
                }
              }
            }),
          );
          references.forEach((value) => {
            if (isChildPropertyPath(propertyPath, value)) {
              possibleRefs[path] = propertyBindings;
            }
          });
        });
      }
    });
    return possibleRefs;
  }

  getTriggerFieldReferencesInExistingBindings(
    dataTree: DataTree,
    entityNamePath: string,
  ) {
    const possibleRefs: DependencyMap = {};
    Object.keys(dataTree).forEach((entityName) => {
      const entity = dataTree[entityName];
      if (isWidget(entity)) {
        let entityPropertyBindings: DependencyMap = {};
        entityPropertyBindings = {
          ...entityPropertyBindings,
          ...this.listTriggerFieldDependencies(entity, entityName),
        };
        Object.keys(entityPropertyBindings).forEach((path) => {
          const propertyBindings = entityPropertyBindings[path];
          const references = getEntityReferencesFromPropertyBindings(
            propertyBindings,
            this,
          );
          if (references.includes(entityNamePath)) {
            possibleRefs[path] = references;
          }
        });
      }
    });
    return possibleRefs;
  }

  evaluateActionBindings(
    bindings: string[],
    executionParams?: Record<string, unknown> | string,
  ) {
    // We might get execution params as an object or as a string.
    // If the user has added a proper object (valid case) it will be an object
    // If they have not added any execution params or not an object
    // it would be a string (invalid case)
    let evaluatedExecutionParams: Record<string, any> = {};
    if (executionParams && _.isObject(executionParams)) {
      evaluatedExecutionParams = this.getDynamicValue(
        `{{${JSON.stringify(executionParams)}}}`,
        this.evalTree,
        this.resolvedFunctions,
        EvaluationSubstitutionType.TEMPLATE,
      );
    }

    return bindings.map((binding) => {
      // Replace any reference of 'this.params' to 'executionParams' (backwards compatibility)
      // also helps with dealing with IIFE which are normal functions (not arrow)
      // because normal functions won't retain 'this' context (when executed elsewhere)
      const replacedBinding = binding.replace(
        EXECUTION_PARAM_REFERENCE_REGEX,
        EXECUTION_PARAM_KEY,
      );
      return this.getDynamicValue(
        `{{${replacedBinding}}}`,
        this.evalTree,
        this.resolvedFunctions,
        EvaluationSubstitutionType.TEMPLATE,
        // params can be accessed via "this.params" or "executionParams"
        {
          thisContext: {
            [THIS_DOT_PARAMS_KEY]: evaluatedExecutionParams,
          },
          globalContext: {
            [EXECUTION_PARAM_KEY]: evaluatedExecutionParams,
          },
        },
      );
    });
  }

  clearErrors() {
    this.errors = [];
  }
  clearLogs() {
    this.logs = [];
    this.userLogs = [];
  }
}

// TODO cryptic comment below. Dont know if we still need this. Duplicate function
// referencing DATA_BIND_REGEX fails for the value "{{Table1.tableData[Table1.selectedRowIndex]}}" if you run it multiple times and don't recreate
const isDynamicValue = (value: string): boolean => DATA_BIND_REGEX.test(value);
