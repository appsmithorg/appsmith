import {
  DependencyMap,
  EvalError,
  EvalErrorTypes,
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
  DataTreeObjectEntity,
  DataTreeWidget,
  ENTITY_TYPE,
  EvaluationSubstitutionType,
} from "entities/DataTree/dataTreeFactory";
import {
  addDependantsOfNestedPropertyPaths,
  addErrorToEntityProperty,
  convertPathToString,
  CrashingError,
  DataTreeDiffEvent,
  getAllPaths,
  getEntityNameAndPropertyPath,
  getImmediateParentsOfPropertyPaths,
  getValidatedTree,
  makeParentsDependOnChildren,
  removeFunctions,
  translateDiffEventToDataTreeDiffEvent,
  trimDependantChangePaths,
  validateWidgetProperty,
} from "workers/evaluationUtils";
import _ from "lodash";
import { applyChange, Diff, diff } from "deep-diff";
import toposort from "toposort";
import equal from "fast-deep-equal/es6";
import {
  EXECUTION_PARAM_KEY,
  EXECUTION_PARAM_REFERENCE_REGEX,
} from "constants/AppsmithActionConstants/ActionConstants";
import { DATA_BIND_REGEX } from "constants/BindingsConstants";
import evaluate, { EvalResult } from "workers/evaluate";
import { substituteDynamicBindingWithValues } from "workers/evaluationSubstitution";
import { Severity } from "entities/AppsmithConsole";

export default class DataTreeEvaluator {
  dependencyMap: DependencyMap = {};
  sortedDependencies: Array<string> = [];
  inverseDependencyMap: DependencyMap = {};
  widgetConfigMap: WidgetTypeConfigMap = {};
  evalTree: DataTree = {};
  allKeys: Record<string, true> = {};
  oldUnEvalTree: DataTree = {};
  errors: EvalError[] = [];
  parsedValueCache: Map<
    string,
    {
      value: any;
      version: number;
    }
  > = new Map();
  logs: any[] = [];

  constructor(widgetConfigMap: WidgetTypeConfigMap) {
    this.widgetConfigMap = widgetConfigMap;
  }

  createFirstTree(unEvalTree: DataTree) {
    const totalStart = performance.now();
    // Create dependency map
    const createDependencyStart = performance.now();
    this.dependencyMap = this.createDependencyMap(unEvalTree);
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
      unEvalTree,
      this.sortedDependencies,
    );
    const evaluateEnd = performance.now();
    // Validate Widgets
    const validateStart = performance.now();
    this.evalTree = getValidatedTree(evaluatedTree);
    const validateEnd = performance.now();

    this.oldUnEvalTree = unEvalTree;
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
    return {
      dataTree: this.evalTree,
      evaluationOrder: this.sortedDependencies,
    };
  }

  isDynamicLeaf(unEvalTree: DataTree, propertyPath: string) {
    const [entityName, ...propPathEls] = _.toPath(propertyPath);
    // Framework feature: Top level items are never leaves
    if (entityName === propertyPath) return false;
    // Ignore if this was a delete op
    if (!(entityName in unEvalTree)) return false;

    const entity = unEvalTree[entityName];
    if (!isAction(entity) && !isWidget(entity)) return false;
    const relativePropertyPath = convertPathToString(propPathEls);
    return relativePropertyPath in entity.bindingPaths;
  }

  updateDataTree(
    unEvalTree: DataTree,
  ): { dataTree: DataTree; evaluationOrder: string[] } {
    const totalStart = performance.now();
    // Calculate diff
    const diffCheckTimeStart = performance.now();
    const differences = diff(this.oldUnEvalTree, unEvalTree) || [];
    // Since eval tree is listening to possible events that dont cause differences
    // We want to check if no diffs are present and bail out early
    if (differences.length === 0) {
      return {
        dataTree: this.evalTree,
        evaluationOrder: [],
      };
    }
    const diffCheckTimeStop = performance.now();
    // Check if dependencies have changed
    const updateDependenciesStart = performance.now();

    // Find all the paths that have changed as part of the difference and update the
    // global dependency map if an existing dynamic binding has now become legal
    const {
      dependenciesOfRemovedPaths,
      removedPaths,
    } = this.updateDependencyMap(differences, unEvalTree);
    const updateDependenciesStop = performance.now();

    const calculateSortOrderStart = performance.now();

    const subTreeSortOrder: string[] = this.calculateSubTreeSortOrder(
      differences,
      dependenciesOfRemovedPaths,
      removedPaths,
      unEvalTree,
    );

    const calculateSortOrderStop = performance.now();

    // Evaluate
    const evalStart = performance.now();

    // Remove anything from the sort order that is not a dynamic leaf since only those need evaluation
    const evaluationOrder = subTreeSortOrder.filter((propertyPath) => {
      // We are setting all values from our uneval tree to the old eval tree we have
      // So that the actual uneval value can be evaluated
      if (this.isDynamicLeaf(unEvalTree, propertyPath)) {
        const unEvalPropValue = _.get(unEvalTree, propertyPath);
        _.set(this.evalTree, propertyPath, unEvalPropValue);
        return true;
      }
      return false;
    });
    this.logs.push({
      evaluationOrder,
      sortedDependencies: this.sortedDependencies,
      inverse: this.inverseDependencyMap,
      updatedDependencyMap: this.dependencyMap,
    });

    // Remove any deleted paths from the eval tree
    removedPaths.forEach((removedPath) => {
      _.unset(this.evalTree, removedPath);
    });
    this.evalTree = this.evaluateTree(this.evalTree, evaluationOrder);
    const evalStop = performance.now();

    const totalEnd = performance.now();
    // TODO: For some reason we are passing some reference which are getting mutated.
    // Need to check why big api responses are getting split between two eval runs
    this.oldUnEvalTree = unEvalTree;
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
    };
    this.logs.push({ timeTakenForSubTreeEval });
    return {
      dataTree: this.evalTree,
      evaluationOrder: evaluationOrder,
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
      if (isAction(entity) || isWidget(entity)) {
        const entityListedDependencies = this.listEntityDependencies(
          entity,
          entityName,
        );
        dependencyMap = { ...dependencyMap, ...entityListedDependencies };
      }
    });
    Object.keys(dependencyMap).forEach((key) => {
      dependencyMap[key] = _.flatten(
        dependencyMap[key].map((path) =>
          extractReferencesFromBinding(path, this.allKeys),
        ),
      );
    });
    dependencyMap = makeParentsDependOnChildren(dependencyMap);
    return dependencyMap;
  }

  listEntityDependencies(
    entity: DataTreeWidget | DataTreeAction,
    entityName: string,
  ): DependencyMap {
    const dependencies: DependencyMap = {};
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
    if (isWidget(entity)) {
      // Set default property dependency
      const defaultProperties = this.widgetConfigMap[entity.type]
        .defaultProperties;
      Object.entries(defaultProperties).forEach(
        ([property, defaultPropertyPath]) => {
          dependencies[`${entityName}.${property}`] = [
            `${entityName}.${defaultPropertyPath}`,
          ];
        },
      );
    }
    if (isAction(entity)) {
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
    return dependencies;
  }

  evaluateTree(
    oldUnevalTree: DataTree,
    sortedDependencies: Array<string>,
  ): DataTree {
    const tree = _.cloneDeep(oldUnevalTree);
    try {
      return sortedDependencies.reduce(
        (currentTree: DataTree, fullPropertyPath: string) => {
          this.logs.push(`evaluating ${fullPropertyPath}`);
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
            (isAction(entity) || isWidget(entity)) &&
            isPathADynamicBinding(entity, propertyPath);
          let evalPropertyValue;
          const requiresEval =
            isABindingPath && isDynamicValue(unEvalPropertyValue);
          if (propertyPath) {
            _.set(currentTree, getEvalErrorPath(fullPropertyPath), []);
          }
          if (requiresEval) {
            const evaluationSubstitutionType =
              entity.bindingPaths[propertyPath] ||
              EvaluationSubstitutionType.TEMPLATE;
            try {
              evalPropertyValue = this.getDynamicValue(
                unEvalPropertyValue,
                currentTree,
                evaluationSubstitutionType,
                false,
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

          if (isWidget(entity)) {
            const widgetEntity = entity;
            const defaultPropertyMap = this.widgetConfigMap[widgetEntity.type]
              .defaultProperties;
            const isDefaultProperty = !!Object.values(
              defaultPropertyMap,
            ).filter(
              (defaultPropertyName) => propertyPath === defaultPropertyName,
            ).length;
            if (propertyPath) {
              let parsedValue = this.validateAndParseWidgetProperty(
                fullPropertyPath,
                widgetEntity,
                currentTree,
                evalPropertyValue,
                unEvalPropertyValue,
                isDefaultProperty,
              );
              const hasDefaultProperty = propertyPath in defaultPropertyMap;
              if (hasDefaultProperty) {
                const defaultProperty = defaultPropertyMap[propertyPath];
                parsedValue = this.overwriteDefaultDependentProps(
                  defaultProperty,
                  parsedValue,
                  fullPropertyPath,
                  widgetEntity,
                );
              }
              return _.set(currentTree, fullPropertyPath, parsedValue);
            }
            return _.set(currentTree, fullPropertyPath, evalPropertyValue);
          } else if (isAction(entity)) {
            const safeEvaluatedValue = removeFunctions(evalPropertyValue);
            _.set(
              currentTree,
              getEvalValuePath(fullPropertyPath),
              safeEvaluatedValue,
            );
            _.set(currentTree, fullPropertyPath, evalPropertyValue);
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

  sortDependencies(dependencyMap: DependencyMap): Array<string> {
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
        },
      });
      console.error("CYCLICAL DEPENDENCY MAP", dependencyMap);
      throw new CrashingError(e.message);
    }
  }

  getParsedValueCache(propertyPath: string) {
    return (
      this.parsedValueCache.get(propertyPath) || {
        value: undefined,
        version: 0,
      }
    );
  }

  clearPropertyCache(propertyPath: string) {
    this.parsedValueCache.delete(propertyPath);
  }

  clearPropertyCacheOfWidget(widgetName: string) {
    // TODO check if this loop mutating itself is safe
    this.parsedValueCache.forEach((value, key) => {
      const match = key.match(`${widgetName}.`);
      if (match) {
        this.parsedValueCache.delete(key);
      }
    });
  }

  clearAllCaches() {
    this.parsedValueCache.clear();
    this.clearErrors();
    this.dependencyMap = {};
    this.allKeys = {};
    this.inverseDependencyMap = {};
    this.sortedDependencies = [];
    this.evalTree = {};
    this.oldUnEvalTree = {};
  }

  getDynamicValue(
    dynamicBinding: string,
    data: DataTree,
    evaluationSubstitutionType: EvaluationSubstitutionType,
    returnTriggers: boolean,
    callBackData?: Array<any>,
    fullPropertyPath?: string,
  ) {
    // Get the {{binding}} bound values
    const { jsSnippets, stringSegments } = getDynamicBindings(dynamicBinding);
    if (returnTriggers) {
      const result = this.evaluateDynamicBoundValue(
        jsSnippets[0],
        data,
        callBackData,
      );
      // TODO return errors here as well
      return result.triggers;
    }
    if (stringSegments.length) {
      // Get the Data Tree value of those "binding "paths
      const values = jsSnippets.map((jsSnippet, index) => {
        if (jsSnippet) {
          const result = this.evaluateDynamicBoundValue(
            jsSnippet,
            data,
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

      // if it is just one binding, return that directly
      if (stringSegments.length === 1) return values[0];
      // else return a combined value according to the evaluation type
      return substituteDynamicBindingWithValues(
        dynamicBinding,
        stringSegments,
        values,
        evaluationSubstitutionType,
      );
    }
    return undefined;
  }

  // Paths are expected to have "{name}.{path}" signature
  // Also returns any action triggers found after evaluating value
  evaluateDynamicBoundValue(
    js: string,
    data: DataTree,
    callbackData?: Array<any>,
  ): EvalResult {
    try {
      return evaluate(js, data, callbackData);
    } catch (e) {
      return {
        result: undefined,
        triggers: [],
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

  validateAndParseWidgetProperty(
    fullPropertyPath: string,
    widget: DataTreeWidget,
    currentTree: DataTree,
    evalPropertyValue: any,
    unEvalPropertyValue: string,
    isDefaultProperty: boolean,
  ): any {
    const { propertyPath } = getEntityNameAndPropertyPath(fullPropertyPath);
    let valueToValidate = evalPropertyValue;
    if (isPathADynamicTrigger(widget, propertyPath)) {
      const { triggers } = this.getDynamicValue(
        unEvalPropertyValue,
        currentTree,
        EvaluationSubstitutionType.TEMPLATE,
        true,
        undefined,
        fullPropertyPath,
      );
      valueToValidate = triggers;
    }
    const validation = widget.validationPaths[propertyPath];
    const { isValid, message, parsed, transformed } = validateWidgetProperty(
      propertyPath,
      valueToValidate,
      widget,
      validation,
      currentTree,
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
      addErrorToEntityProperty(
        [
          {
            raw: unEvalPropertyValue,
            errorMessage: message || "",
            errorType: PropertyEvaluationErrorType.VALIDATION,
            severity: Severity.ERROR,
          },
        ],
        currentTree,
        fullPropertyPath,
      );
    }

    if (isPathADynamicTrigger(widget, propertyPath)) {
      return unEvalPropertyValue;
    } else {
      const parsedCache = this.getParsedValueCache(fullPropertyPath);
      // In case this is a default property, always set the cache even if the value remains the same so that the version
      // in cache gets updated and the property dependent on default property updates accordingly.
      if (!equal(parsedCache.value, parsed) || isDefaultProperty) {
        this.parsedValueCache.set(fullPropertyPath, {
          value: parsed,
          version: Date.now(),
        });
      }
      return parsed;
    }
  }

  overwriteDefaultDependentProps(
    defaultProperty: string,
    propertyValue: any,
    propertyPath: string,
    entity: DataTreeWidget,
  ) {
    const defaultPropertyCache = this.getParsedValueCache(
      `${entity.widgetName}.${defaultProperty}`,
    );
    const propertyCache = this.getParsedValueCache(propertyPath);
    if (
      propertyValue === undefined ||
      propertyCache.version < defaultPropertyCache.version
    ) {
      return defaultPropertyCache.value;
    }
    return propertyValue;
  }

  updateDependencyMap(
    differences: Array<Diff<any, any>>,
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
    const translatedDiffs = differences.map(
      translateDiffEventToDataTreeDiffEvent,
    );
    this.logs.push({ differences, translatedDiffs });
    // Transform the diff library events to Appsmith evaluator events
    _.flatten(translatedDiffs).forEach((dataTreeDiff) => {
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
              (isWidget(entity) || isAction(entity)) &&
              !this.isDynamicLeaf(
                unEvalDataTree,
                dataTreeDiff.payload.propertyPath,
              )
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
              (isWidget(entity) || isAction(entity)) &&
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
              (isWidget(entity) || isAction(entity)) &&
              typeof dataTreeDiff.payload.value === "string"
            ) {
              const entity: DataTreeAction | DataTreeWidget = unEvalDataTree[
                entityName
              ] as DataTreeAction | DataTreeWidget;
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
                if (isAction(entity)) {
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
            this.dependencyMap[key].map((path) =>
              extractReferencesFromBinding(path, this.allKeys),
            ),
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
      this.sortedDependencies = this.sortDependencies(this.dependencyMap);
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
      if (!this.isDynamicLeaf(unEvalTree, convertPathToString(d.path))) {
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
    // Remove any paths that do no exist in the data tree any more
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
          entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET)
      ) {
        const entityPropertyBindings = this.listEntityDependencies(
          entity,
          entityName,
        );
        Object.keys(entityPropertyBindings).forEach((path) => {
          const propertyBindings = entityPropertyBindings[path];
          const references = _.flatten(
            propertyBindings.map((binding) =>
              extractReferencesFromBinding(binding, this.allKeys),
            ),
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
        EvaluationSubstitutionType.TEMPLATE,
        false,
      );
    }

    // Replace any reference of 'this.params' to 'executionParams' (backwards compatibility)
    const bindingsForExecutionParams: string[] = bindings.map(
      (binding: string) =>
        binding.replace(EXECUTION_PARAM_REFERENCE_REGEX, EXECUTION_PARAM_KEY),
    );

    const dataTreeWithExecutionParams = Object.assign({}, this.evalTree, {
      [EXECUTION_PARAM_KEY]: evaluatedExecutionParams,
    });

    return bindingsForExecutionParams.map((binding) =>
      this.getDynamicValue(
        `{{${binding}}}`,
        dataTreeWithExecutionParams,
        EvaluationSubstitutionType.TEMPLATE,
        false,
      ),
    );
  }

  clearErrors() {
    this.errors = [];
  }

  clearLogs() {
    this.logs = [];
  }
}

const extractReferencesFromBinding = (
  dependentPath: string,
  all: Record<string, true>,
): Array<string> => {
  const subDeps: Array<string> = [];
  const identifiers = dependentPath.match(/[a-zA-Z_$][a-zA-Z_$0-9.\[\]]*/g) || [
    dependentPath,
  ];
  identifiers.forEach((identifier: string) => {
    // If the identifier exists directly, add it and return
    if (all.hasOwnProperty(identifier)) {
      subDeps.push(identifier);
      return;
    }
    const subpaths = _.toPath(identifier);
    let current = "";
    // We want to keep going till we reach top level, but not add top level
    // Eg: Input1.text should not depend on entire Table1 unless it explicitly asked for that.
    // This is mainly to avoid a lot of unnecessary evals, if we feel this is wrong
    // we can remove the length requirement and it will still work
    while (subpaths.length > 1) {
      current = convertPathToString(subpaths);
      // We've found the dep, add it and return
      if (all.hasOwnProperty(current)) {
        subDeps.push(current);
        return;
      }
      subpaths.pop();
    }
  });
  return _.uniq(subDeps);
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

function isWidget(entity: DataTreeEntity): entity is DataTreeWidget {
  return isValidEntity(entity) && entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET;
}

function isAction(entity: DataTreeEntity): entity is DataTreeAction {
  return isValidEntity(entity) && entity.ENTITY_TYPE === ENTITY_TYPE.ACTION;
}
