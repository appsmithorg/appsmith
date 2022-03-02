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
  DataTreeObjectEntity,
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
  DataTreeDiffEvent,
  getAllPaths,
  getEntityNameAndPropertyPath,
  getImmediateParentsOfPropertyPaths,
  getValidatedTree,
  isAction,
  isDynamicLeaf,
  isJSAction,
  isWidget,
  makeParentsDependOnChildren,
  removeFunctions,
  translateDiffEventToDataTreeDiffEvent,
  trimDependantChangePaths,
  validateWidgetProperty,
  validateActionProperty,
  getParams,
  updateJSCollectionInDataTree,
  removeFunctionsAndVariableJSCollection,
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
  createGlobalData,
  EvalResult,
  EvaluateContext,
  EvaluationScriptType,
  getScriptToEval,
  evaluateAsync,
  isFunctionAsync,
} from "workers/evaluate";
import { substituteDynamicBindingWithValues } from "workers/evaluationSubstitution";
import { Severity } from "entities/AppsmithConsole";
import { getLintingErrors } from "workers/lint";
import { error as logError } from "loglevel";
import { extractIdentifiersFromCode } from "workers/ast";
import { JSUpdate } from "utils/JSPaneUtils";
import {
  addWidgetPropertyDependencies,
  overrideWidgetProperties,
} from "./evaluationUtils";
import {
  ActionValidationConfigMap,
  ValidationConfig,
} from "constants/PropertyControlConstants";
const clone = require("rfdc/default");
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
  logs: any[] = [];
  allActionValidationConfig?: { [actionId: string]: ActionValidationConfigMap };
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
    let localUnEvalTree = clone(unEvalTree);
    let jsUpdates: Record<string, JSUpdate> = {};
    //parse js collection to get functions
    //save current state of js collection action and variables to be added to uneval tree
    //save functions in resolveFunctions (as functions) to be executed as functions are not allowed in evalTree
    //and functions are saved in dataTree as strings
    const parsedCollections = this.parseJSActions(localUnEvalTree);
    jsUpdates = parsedCollections.jsUpdates;
    localUnEvalTree = this.getUpdatedLocalUnEvalTreeAfterJSUpdates(
      jsUpdates,
      localUnEvalTree,
    );
    // Create dependency map
    const createDependencyStart = performance.now();
    this.dependencyMap = this.createDependencyMap(localUnEvalTree);
    const createDependencyEnd = performance.now();
    // Sort
    const sortDependenciesStart = performance.now();
    this.sortedDependencies = this.sortDependencies(this.dependencyMap);
    const sortDependenciesEnd = performance.now();
    // Inverse
    this.inverseDependencyMap = this.getInverseDependencyTree();
    // Evaluate
    const evaluateStart = performance.now();
    const evaluatedTree = this.evaluateTree(
      localUnEvalTree,
      this.resolvedFunctions,
      this.sortedDependencies,
    );
    const evaluateEnd = performance.now();
    // Validate Widgets
    const validateStart = performance.now();
    this.evalTree = getValidatedTree(evaluatedTree);
    const validateEnd = performance.now();

    this.oldUnEvalTree = clone(localUnEvalTree);
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
      },
    };
    this.logs.push({ timeTakenForFirstTree });
    return { evalTree: this.evalTree, jsUpdates: jsUpdates };
  }

  updateLocalUnEvalTree(dataTree: DataTree) {
    //add functions and variables to unevalTree
    Object.keys(this.currentJSCollectionState).forEach((update) => {
      const updates = this.currentJSCollectionState[update];
      if (!!dataTree[update]) {
        Object.keys(updates).forEach((key) => {
          _.set(dataTree, `${update}.${key}`, updates[key]);
        });
      }
    });
  }

  getUpdatedLocalUnEvalTreeAfterJSUpdates(
    jsUpdates: Record<string, JSUpdate>,
    localUnEvalTree: DataTree,
  ) {
    if (!_.isEmpty(jsUpdates)) {
      Object.keys(jsUpdates).forEach((jsEntity) => {
        const entity = localUnEvalTree[jsEntity];
        const parsedBody = jsUpdates[jsEntity].parsedBody;
        if (isJSAction(entity)) {
          if (!!parsedBody) {
            //add/delete/update functions from dataTree
            localUnEvalTree = updateJSCollectionInDataTree(
              parsedBody,
              entity,
              localUnEvalTree,
            );
          } else {
            //if parse error remove functions and variables from dataTree
            localUnEvalTree = removeFunctionsAndVariableJSCollection(
              localUnEvalTree,
              entity,
            );
          }
        }
      });
    }
    return localUnEvalTree;
  }

  updateDataTree(
    unEvalTree: DataTree,
  ): {
    evaluationOrder: string[];
    unEvalUpdates: DataTreeDiff[];
    jsUpdates: Record<string, JSUpdate>;
  } {
    let localUnEvalTree = Object.assign({}, unEvalTree);
    const totalStart = performance.now();
    let jsUpdates: Record<string, JSUpdate> = {};
    // Calculate diff
    const diffCheckTimeStart = performance.now();
    //update uneval tree from previously saved current state of collection
    this.updateLocalUnEvalTree(localUnEvalTree);
    //get difference in js collection body to be parsed
    const oldUnEvalTreeJSCollections = this.getJSEntities(this.oldUnEvalTree);
    const localUnEvalTreeJSCollection = this.getJSEntities(localUnEvalTree);
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
    const parsedCollections = this.parseJSActions(
      localUnEvalTree,
      jsTranslatedDiffs,
      this.oldUnEvalTree,
    );

    jsUpdates = parsedCollections.jsUpdates;
    //update local data tree if js body has updated (remove/update/add js functions or variables)
    localUnEvalTree = this.getUpdatedLocalUnEvalTreeAfterJSUpdates(
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
      };
    }
    const translatedDiffs = _.flatten(
      differences.map((diff) =>
        translateDiffEventToDataTreeDiffEvent(diff, localUnEvalTree),
      ),
    );
    this.logs.push({ differences, translatedDiffs });
    const diffCheckTimeStop = performance.now();
    // Check if dependencies have changed
    const updateDependenciesStart = performance.now();

    this.logs.push({ differences: clone(differences), translatedDiffs });

    // Find all the paths that have changed as part of the difference and update the
    // global dependency map if an existing dynamic binding has now become legal
    const {
      dependenciesOfRemovedPaths,
      removedPaths,
    } = this.updateDependencyMap(translatedDiffs, localUnEvalTree);
    const updateDependenciesStop = performance.now();

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
    const newEvalTree = this.evaluateTree(
      this.evalTree,
      this.resolvedFunctions,
      evaluationOrder,
    );
    const evalStop = performance.now();

    const evalTreeDiffsStart = performance.now();

    const evalTreeDiffsStop = performance.now();

    const totalEnd = performance.now();
    // TODO: For some reason we are passing some reference which are getting mutated.
    // Need to check why big api responses are getting split between two eval runs
    this.oldUnEvalTree = clone(localUnEvalTree);
    this.evalTree = newEvalTree;
    const timeTakenForSubTreeEval = {
      total: (totalEnd - totalStart).toFixed(2),
      findDifferences: (diffCheckTimeStop - diffCheckTimeStart).toFixed(2),
      findEvalDifferences: (evalTreeDiffsStop - evalTreeDiffsStart).toFixed(2),
      updateDependencies: (
        updateDependenciesStop - updateDependenciesStart
      ).toFixed(2),
      calculateSortOrder: (
        calculateSortOrderStop - calculateSortOrderStart
      ).toFixed(2),
      evaluate: (evalStop - evalStart).toFixed(2),
    };
    this.logs.push({ timeTakenForSubTreeEval });
    return {
      evaluationOrder,
      unEvalUpdates: translatedDiffs,
      jsUpdates: jsUpdates,
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

  createDependencyMap(unEvalTree: DataTree): DependencyMap {
    let dependencyMap: DependencyMap = {};
    this.allKeys = getAllPaths(unEvalTree);
    Object.keys(unEvalTree).forEach((entityName) => {
      const entity = unEvalTree[entityName];
      if (isAction(entity) || isWidget(entity) || isJSAction(entity)) {
        const entityListedDependencies = this.listEntityDependencies(
          entity,
          entityName,
        );
        dependencyMap = { ...dependencyMap, ...entityListedDependencies };
      }
    });
    Object.keys(dependencyMap).forEach((key) => {
      dependencyMap[key] = _.flatten(
        dependencyMap[key].map((path) => {
          try {
            return extractReferencesFromBinding(path, this.allKeys);
          } catch (e) {
            this.errors.push({
              type: EvalErrorTypes.EXTRACT_DEPENDENCY_ERROR,
              message: e.message,
              context: {
                script: path,
              },
            });
            return [];
          }
        }),
      );
    });
    dependencyMap = makeParentsDependOnChildren(dependencyMap);
    return dependencyMap;
  }

  getPrivateWidgets(dataTree: DataTree): PrivateWidgets {
    let privateWidgets: PrivateWidgets = {};
    Object.keys(dataTree).forEach((entityName) => {
      const entity = dataTree[entityName];
      if (isWidget(entity) && !_.isEmpty(entity.privateWidgets)) {
        privateWidgets = { ...privateWidgets, ...entity.privateWidgets };
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
      if (entity.bindingPaths) {
        Object.keys(entity.bindingPaths).forEach((propertyPath) => {
          const existingDeps =
            dependencies[`${entityName}.${propertyPath}`] || [];
          const jsSnippets = [_.get(entity, propertyPath)];
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

  evaluateTree(
    oldUnevalTree: DataTree,
    resolvedFunctions: Record<string, any>,
    sortedDependencies: Array<string>,
  ): DataTree {
    const tree = clone(oldUnevalTree);
    try {
      return sortedDependencies.reduce(
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

          const isABindingPath =
            (isAction(entity) || isWidget(entity) || isJSAction(entity)) &&
            isPathADynamicBinding(entity, propertyPath);
          const isATriggerPath =
            isWidget(entity) && isPathADynamicTrigger(entity, propertyPath);
          let evalPropertyValue;
          const requiresEval =
            isABindingPath &&
            !isATriggerPath &&
            (isDynamicValue(unEvalPropertyValue) || isJSAction(entity));
          if (propertyPath) {
            _.set(currentTree, getEvalErrorPath(fullPropertyPath), []);
          }
          if (requiresEval) {
            const evaluationSubstitutionType =
              entity.bindingPaths[propertyPath] ||
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
            } catch (e) {
              this.errors.push({
                type: EvalErrorTypes.EVAL_PROPERTY_ERROR,
                message: e.message,
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
              const overwriteObj = overrideWidgetProperties(
                entity,
                propertyPath,
                parsedValue,
                currentTree,
              );

              if (overwriteObj && overwriteObj.overwriteParsedValue) {
                parsedValue = overwriteObj.newValue;
              }
              return _.set(currentTree, fullPropertyPath, parsedValue);
            }
            return _.set(currentTree, fullPropertyPath, evalPropertyValue);
          } else if (isATriggerPath) {
            const errors = this.lintTriggerPath(
              evalPropertyValue,
              entity,
              currentTree,
            );
            addErrorToEntityProperty(errors, currentTree, fullPropertyPath);
            return currentTree;
          } else if (isAction(entity)) {
            if (this.allActionValidationConfig) {
              const configProperty = propertyPath.replace(
                "config",
                "actionConfiguration",
              );
              const validationConfig = this.allActionValidationConfig[
                entity.actionId
              ][configProperty];
              this.validateActionProperty(
                fullPropertyPath,
                entity,
                currentTree,
                evalPropertyValue,
                unEvalPropertyValue,
                validationConfig,
              );
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
            return currentTree;
          } else {
            return _.set(currentTree, fullPropertyPath, evalPropertyValue);
          }
        },
        tree,
      );
    } catch (e) {
      this.errors.push({
        type: EvalErrorTypes.EVAL_TREE_ERROR,
        message: e.message,
      });
      return tree;
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
    } catch (e) {
      // Cyclic dependency found. Extract all node and entity type
      const node = e.message.match(
        new RegExp('Cyclic dependency, node was:"(.*)"'),
      )[1];

      let entityType = "UNKNOWN";
      const entityName = node.split(".")[0];
      const entity = _.get(this.oldUnEvalTree, entityName);
      if (entity && isWidget(entity)) {
        entityType = entity.type;
      } else if (entity && isAction(entity)) {
        entityType = entity.pluginType;
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
      throw new CrashingError(e.message);
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
          );
          if (fullPropertyPath && result.errors.length) {
            addErrorToEntityProperty(result.errors, data, fullPropertyPath);
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
      } catch (e) {
        if (fullPropertyPath) {
          addErrorToEntityProperty(
            [
              {
                raw: dynamicBinding,
                errorType: PropertyEvaluationErrorType.PARSE,
                errorMessage: e.message,
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
  ) {
    const { jsSnippets } = getDynamicBindings(userScript);
    return evaluateAsync(
      jsSnippets[0] || userScript,
      dataTree,
      requestId,
      resolvedFunctions,
      {},
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
  ): EvalResult {
    try {
      return evaluateSync(
        js,
        data,
        resolvedFunctions,
        createGlobalData,
        contextData,
        callbackData,
      );
    } catch (e) {
      return {
        result: undefined,
        errors: [
          {
            errorType: PropertyEvaluationErrorType.PARSE,
            raw: js,
            severity: Severity.ERROR,
            errorMessage: e.message,
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
    );

    const evaluatedValue = isValid
      ? parsed
      : _.isUndefined(transformed)
      ? evalPropertyValue
      : transformed;
    const safeEvaluatedValue = removeFunctions(evaluatedValue);
    _.set(
      widget,
      getEvalValuePath(fullPropertyPath, false),
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

  saveResolvedFunctionsAndJSUpdates(
    entity: DataTreeJSAction,
    jsUpdates: Record<string, any>,
    unEvalDataTree: DataTree,
    entityName: string,
  ) {
    const regex = new RegExp(/^export default[\s]*?({[\s\S]*?})/);
    const correctFormat = regex.test(entity.body);
    if (correctFormat) {
      const body = entity.body.replace(/export default/g, "");
      try {
        const { result } = evaluateSync(body, unEvalDataTree, {}, true);
        delete this.resolvedFunctions[`${entityName}`];
        delete this.currentJSCollectionState[`${entityName}`];
        if (result) {
          const actions: any = [];
          const variables: any = [];
          Object.keys(result).forEach((unEvalFunc) => {
            const unEvalValue = result[unEvalFunc];
            if (typeof unEvalValue === "function") {
              const params = getParams(unEvalValue);
              const functionString = unEvalValue.toString();
              _.set(
                this.resolvedFunctions,
                `${entityName}.${unEvalFunc}`,
                unEvalValue,
              );
              _.set(
                this.currentJSCollectionState,
                `${entityName}.${unEvalFunc}`,
                functionString,
              );
              actions.push({
                name: unEvalFunc,
                body: functionString,
                arguments: params,
                value: unEvalValue,
              });
            } else {
              variables.push({
                name: unEvalFunc,
                value: result[unEvalFunc],
              });
              _.set(
                this.currentJSCollectionState,
                `${entityName}.${unEvalFunc}`,
                unEvalValue,
              );
            }
          });

          const modifiedActions = actions.map((action: any) => {
            return {
              name: action.name,
              body: action.body,
              arguments: action.arguments,
              isAsync: isFunctionAsync(
                action.value,
                unEvalDataTree,
                this.resolvedFunctions,
              ),
            };
          });

          const parsedBody = {
            body: entity.body,
            actions: modifiedActions,
            variables,
          };
          _.set(jsUpdates, `${entityName}`, {
            parsedBody,
            id: entity.actionId,
          });
        } else {
          _.set(jsUpdates, `${entityName}`, {
            parsedBody: undefined,
            id: entity.actionId,
          });
        }
      } catch (e) {
        const errors = {
          type: EvalErrorTypes.PARSE_JS_ERROR,
          context: {
            entity: entity,
            propertyPath: entity.name + ".body",
          },
          message: e.message,
        };
        this.errors.push(errors);
      }
    } else {
      const errors = {
        type: EvalErrorTypes.PARSE_JS_ERROR,
        context: {
          entity: entity,
          propertyPath: entity.name + ".body",
        },
        message: "Start object with export default",
      };
      this.errors.push(errors);
    }
    return jsUpdates;
  }

  parseJSActions(
    unEvalDataTree: DataTree,
    differences?: DataTreeDiff[],
    oldUnEvalTree?: DataTree,
  ) {
    let jsUpdates = {};
    if (!!differences && !!oldUnEvalTree) {
      differences.forEach((diff) => {
        const { entityName, propertyPath } = getEntityNameAndPropertyPath(
          diff.payload.propertyPath,
        );
        const entity = unEvalDataTree[entityName];
        if (diff.event === DataTreeDiffEvent.DELETE) {
          const deletedEntity = oldUnEvalTree[entityName];
          if (!isJSAction(deletedEntity)) {
            return;
          }
          if (
            this.currentJSCollectionState &&
            this.currentJSCollectionState[diff.payload.propertyPath]
          ) {
            delete this.currentJSCollectionState[diff.payload.propertyPath];
          }
          if (
            this.resolvedFunctions &&
            this.resolvedFunctions[diff.payload.propertyPath]
          ) {
            delete this.resolvedFunctions[diff.payload.propertyPath];
          }
        }
        if (!isJSAction(entity)) {
          return false;
        }
        if (
          (diff.event === DataTreeDiffEvent.EDIT && propertyPath === "body") ||
          (diff.event === DataTreeDiffEvent.NEW && propertyPath === "")
        ) {
          jsUpdates = this.saveResolvedFunctionsAndJSUpdates(
            entity,
            jsUpdates,
            unEvalDataTree,
            entityName,
          );
        }
      });
    } else {
      Object.keys(unEvalDataTree).forEach((entityName) => {
        const entity = unEvalDataTree[entityName];
        if (!isJSAction(entity)) {
          return;
        }
        jsUpdates = this.saveResolvedFunctionsAndJSUpdates(
          entity,
          jsUpdates,
          unEvalDataTree,
          entityName,
        );
      });
    }
    return { jsUpdates };
  }

  getJSEntities(dataTree: DataTree) {
    const jsCollections: Record<string, DataTreeJSAction> = {};
    Object.keys(dataTree).forEach((key: string) => {
      const entity = dataTree[key];
      if (isJSAction(entity)) {
        jsCollections[entity.name] = entity;
      }
    });
    return jsCollections;
  }

  updateDependencyMap(
    translatedDiffs: Array<DataTreeDiff>,
    unEvalDataTree: DataTree,
  ): {
    dependenciesOfRemovedPaths: Array<string>;
    removedPaths: Array<string>;
  } {
    const diffCalcStart = performance.now();
    let didUpdateDependencyMap = false;
    const dependenciesOfRemovedPaths: Array<string> = [];
    const removedPaths: Array<string> = [];

    // This is needed for NEW and DELETE events below.
    // In worst case, it tends to take ~12.5% of entire diffCalc (8 ms out of 67ms for 132 array of NEW)
    // TODO: Optimise by only getting paths of changed node
    this.allKeys = getAllPaths(unEvalDataTree);
    // Transform the diff library events to Appsmith evaluator events
    translatedDiffs.forEach((dataTreeDiff) => {
      const entityName = dataTreeDiff.payload.propertyPath.split(".")[0];
      let entity = unEvalDataTree[entityName];
      if (dataTreeDiff.event === DataTreeDiffEvent.DELETE) {
        entity = this.oldUnEvalTree[entityName];
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
              const entityDependencyMap: DependencyMap = this.listEntityDependencies(
                entity,
                entityName,
              );
              if (Object.keys(entityDependencyMap).length) {
                didUpdateDependencyMap = true;
                // The entity might already have some dependencies,
                // so we just want to update those
                Object.entries(entityDependencyMap).forEach(
                  ([entityDependent, entityDependencies]) => {
                    if (this.dependencyMap[entityDependent]) {
                      this.dependencyMap[entityDependent] = this.dependencyMap[
                        entityDependent
                      ].concat(entityDependencies);
                    } else {
                      this.dependencyMap[entityDependent] = entityDependencies;
                    }
                  },
                );
              }
            }
            // Either a new entity or a new property path has been added. Go through existing dynamic bindings and
            // find out if a new dependency has to be created because the property path used in the binding just became
            // eligible
            const possibleReferencesInOldBindings: DependencyMap = this.getPropertyPathReferencesInExistingBindings(
              unEvalDataTree,
              dataTreeDiff.payload.propertyPath,
            );
            // We have found some bindings which are related to the new property path and hence should be added to the
            // global dependency map
            if (Object.keys(possibleReferencesInOldBindings).length) {
              didUpdateDependencyMap = true;
              Object.assign(
                this.dependencyMap,
                possibleReferencesInOldBindings,
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
              const entityDependencies = this.listEntityDependencies(
                entity,
                entityName,
              );
              Object.keys(entityDependencies).forEach((widgetDep) => {
                didUpdateDependencyMap = true;
                delete this.dependencyMap[widgetDep];
              });
            }
            // Either an existing entity or an existing property path has been deleted. Update the global dependency map
            // by removing the bindings from the same.
            Object.keys(this.dependencyMap).forEach((dependencyPath) => {
              didUpdateDependencyMap = true;
              if (
                isChildPropertyPath(
                  dataTreeDiff.payload.propertyPath,
                  dependencyPath,
                )
              ) {
                delete this.dependencyMap[dependencyPath];
              } else {
                const toRemove: Array<string> = [];
                this.dependencyMap[dependencyPath].forEach((dependantPath) => {
                  if (
                    isChildPropertyPath(
                      dataTreeDiff.payload.propertyPath,
                      dependantPath,
                    )
                  ) {
                    dependenciesOfRemovedPaths.push(dependencyPath);
                    toRemove.push(dependantPath);
                  }
                });
                this.dependencyMap[dependencyPath] = _.difference(
                  this.dependencyMap[dependencyPath],
                  toRemove,
                );
              }
            });
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
              const entityPropertyPath = fullPropertyPath.substring(
                fullPropertyPath.indexOf(".") + 1,
              );
              const isABindingPath = isPathADynamicBinding(
                entity,
                entityPropertyPath,
              );
              if (isABindingPath) {
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
                  this.dependencyMap[fullPropertyPath] = correctSnippets;
                } else {
                  // The dependency on this property path has been removed. Delete this property path from the global
                  // dependency map
                  delete this.dependencyMap[fullPropertyPath];
                }
                if (isAction(entity) || isJSAction(entity)) {
                  // Actions have a defined dependency map that should always be maintained
                  if (entityPropertyPath in entity.dependencyMap) {
                    const entityDependenciesName = entity.dependencyMap[
                      entityPropertyPath
                    ].map((dep) => `${entityName}.${dep}`);

                    // Filter only the paths which exist in the appsmith world to avoid cyclical dependencies
                    const filteredEntityDependencies = entityDependenciesName.filter(
                      (path) => this.allKeys.hasOwnProperty(path),
                    );

                    // Now assign these existing dependent paths to the property path in dependencyMap
                    if (fullPropertyPath in this.dependencyMap) {
                      this.dependencyMap[fullPropertyPath] = this.dependencyMap[
                        fullPropertyPath
                      ].concat(filteredEntityDependencies);
                    } else {
                      this.dependencyMap[
                        fullPropertyPath
                      ] = filteredEntityDependencies;
                    }
                  }
                }
              }
              // If the whole binding was removed then the value
              // at this path would be "".
              // In this case if the path exists in the dependency map
              // remove it.
              else if (fullPropertyPath in this.dependencyMap) {
                delete this.dependencyMap[fullPropertyPath];
              }
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
      Object.keys(this.dependencyMap).forEach((key) => {
        this.dependencyMap[key] = _.uniq(
          _.flatten(
            this.dependencyMap[key].map((path) => {
              try {
                return extractReferencesFromBinding(path, this.allKeys);
              } catch (e) {
                this.errors.push({
                  type: EvalErrorTypes.EXTRACT_DEPENDENCY_ERROR,
                  message: e.message,
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
      this.dependencyMap = makeParentsDependOnChildren(this.dependencyMap);
    }
    const subDepCalcEnd = performance.now();
    const updateChangedDependenciesStart = performance.now();
    // If the global dependency map has changed, re-calculate the sort order for all entities and the
    // global inverse dependency map
    if (didUpdateDependencyMap) {
      // This is being called purely to test for new circular dependencies that might have been added
      this.sortedDependencies = this.sortDependencies(
        this.dependencyMap,
        translatedDiffs,
      );
      this.inverseDependencyMap = this.getInverseDependencyTree();
    }

    const updateChangedDependenciesStop = performance.now();
    this.logs.push({
      diffCalcDeps: (diffCalcEnd - diffCalcStart).toFixed(2),
      subDepCalc: (subDepCalcEnd - subDepCalcStart).toFixed(2),
      updateChangedDependencies: (
        updateChangedDependenciesStop - updateChangedDependenciesStart
      ).toFixed(2),
    });

    return { dependenciesOfRemovedPaths, removedPaths };
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
      // Apply the changes into the evalTree so that it gets the latest changes
      applyChange(this.evalTree, undefined, d);

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
        if (!isAction(entity) && !isWidget(entity)) {
          continue;
        }
        const parentPropertyPath = convertPathToString(d.path);
        Object.keys(entity.bindingPaths).forEach((relativePath) => {
          const childPropertyPath = `${entityName}.${relativePath}`;
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
                } catch (e) {
                  this.errors.push({
                    type: EvalErrorTypes.EXTRACT_DEPENDENCY_ERROR,
                    message: e.message,
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
          thisContext: { [THIS_DOT_PARAMS_KEY]: evaluatedExecutionParams },
          globalContext: { [EXECUTION_PARAM_KEY]: evaluatedExecutionParams },
        },
      );
    });
  }

  clearErrors() {
    this.errors = [];
  }

  clearLogs() {
    this.logs = [];
  }

  private lintTriggerPath(
    userScript: string,
    entity: DataTreeEntity,
    currentTree: DataTree,
  ) {
    const { jsSnippets } = getDynamicBindings(userScript, entity);
    const script = getScriptToEval(
      jsSnippets[0],
      EvaluationScriptType.TRIGGERS,
    );
    const GLOBAL_DATA = createGlobalData(
      currentTree,
      this.resolvedFunctions,
      true,
    );

    return getLintingErrors(
      script,
      GLOBAL_DATA,
      jsSnippets[0],
      EvaluationScriptType.TRIGGERS,
    );
  }
}

export const extractReferencesFromBinding = (
  script: string,
  allPaths: Record<string, true>,
): string[] => {
  const references: Set<string> = new Set<string>();
  const identifiers = extractIdentifiersFromCode(script);

  identifiers.forEach((identifier: string) => {
    // If the identifier exists directly, add it and return
    if (allPaths.hasOwnProperty(identifier)) {
      references.add(identifier);
      return;
    }
    const subpaths = _.toPath(identifier);
    let current = "";
    // We want to keep going till we reach top level, but not add top level
    // Eg: Input1.text should not depend on entire Table1 unless it explicitly asked for that.
    // This is mainly to avoid a lot of unnecessary evals, if we feel this is wrong
    // we can remove the length requirement, and it will still work
    while (subpaths.length > 1) {
      current = convertPathToString(subpaths);
      // We've found the dep, add it and return
      if (allPaths.hasOwnProperty(current)) {
        references.add(current);
        return;
      }
      subpaths.pop();
    }
  });
  return Array.from(references);
};

// TODO cryptic comment below. Dont know if we still need this. Duplicate function
// referencing DATA_BIND_REGEX fails for the value "{{Table1.tableData[Table1.selectedRowIndex]}}" if you run it multiple times and don't recreate
const isDynamicValue = (value: string): boolean => DATA_BIND_REGEX.test(value);

function isValidEntity(entity: DataTreeEntity): entity is DataTreeObjectEntity {
  if (!_.isObject(entity)) {
    return false;
  }
  return "ENTITY_TYPE" in entity;
}
