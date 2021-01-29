import {
  ActionDescription,
  DataTree,
  DataTreeAction,
  DataTreeEntity,
  DataTreeObjectEntity,
  DataTreeWidget,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import {
  DependencyMap,
  EVAL_WORKER_ACTIONS,
  EvalError,
  EvalErrorTypes,
  extraLibraries,
  getDynamicBindings,
  getEntityDynamicBindingPathList,
  isChildPropertyPath,
  isPathADynamicBinding,
  isPathADynamicTrigger,
  unsafeFunctionForEval,
} from "../utils/DynamicBindingUtils";
import _ from "lodash";
import { WidgetTypeConfigMap } from "../utils/WidgetFactory";
import toposort from "toposort";
import { DATA_BIND_REGEX } from "../constants/BindingsConstants";
import equal from "fast-deep-equal/es6";
import unescapeJS from "unescape-js";

import { applyChange, diff, Diff } from "deep-diff";
import {
  addDependantsOfNestedPropertyPaths,
  convertPathToString,
  CrashingError,
  DataTreeDiffEvent,
  getValidatedTree,
  makeParentsDependOnChildren,
  removeFunctions,
  removeFunctionsFromDataTree,
  translateDiffEventToDataTreeDiffEvent,
  validateWidgetProperty,
  getImmediateParentsOfPropertyPaths,
} from "./evaluationUtils";
import {
  EXECUTION_PARAM_KEY,
  EXECUTION_PARAM_REFERENCE_REGEX,
} from "../constants/ActionConstants";

const ctx: Worker = self as any;

let dataTreeEvaluator: DataTreeEvaluator | undefined;
let LOGS: any[] = [];

type EvalResult = {
  result: any;
  triggers?: ActionDescription<any>[];
};

//TODO: Create a more complete RPC setup in the subtree-eval branch.
function messageEventListener(
  fn: (message: EVAL_WORKER_ACTIONS, requestData: any) => void,
) {
  return (e: MessageEvent) => {
    const startTime = performance.now();
    const { method, requestId, requestData } = e.data;
    const responseData = fn(method, requestData);
    const endTime = performance.now();
    ctx.postMessage({
      requestId,
      responseData,
      timeTaken: (endTime - startTime).toFixed(2),
    });
    LOGS = [];
  };
}

ctx.addEventListener(
  "message",
  messageEventListener((method, requestData: any) => {
    switch (method) {
      case EVAL_WORKER_ACTIONS.EVAL_TREE: {
        const { widgetTypeConfigMap, unevalTree } = requestData;
        let dataTree: DataTree = unevalTree;
        let errors: EvalError[] = [];
        let dependencies: DependencyMap = {};
        try {
          if (!dataTreeEvaluator) {
            dataTreeEvaluator = new DataTreeEvaluator(widgetTypeConfigMap);
            dataTreeEvaluator.createFirstTree(unevalTree);
            dataTree = dataTreeEvaluator.evalTree;
          } else {
            dataTree = dataTreeEvaluator.updateDataTree(unevalTree);
          }

          // We need to clean it to remove any possible functions inside the tree.
          // If functions exist, it will crash the web worker
          dataTree = JSON.parse(JSON.stringify(dataTree));
          dependencies = dataTreeEvaluator.inverseDependencyMap;
          errors = dataTreeEvaluator.errors;
          dataTreeEvaluator.clearErrors();
        } catch (e) {
          if (dataTreeEvaluator !== undefined) {
            errors = dataTreeEvaluator.errors;
          }
          if (!(e instanceof CrashingError)) {
            errors.push({
              type: EvalErrorTypes.UNKNOWN_ERROR,
              message: e.message,
            });
            console.error(e);
          }
          dataTree = getValidatedTree(widgetTypeConfigMap, unevalTree);
          dataTreeEvaluator = undefined;
        }
        return {
          dataTree,
          dependencies,
          errors,
          logs: LOGS,
        };
      }
      case EVAL_WORKER_ACTIONS.EVAL_ACTION_BINDINGS: {
        const { bindings, executionParams } = requestData;
        if (!dataTreeEvaluator) {
          return { value: undefined, errors: [] };
        }

        const values = dataTreeEvaluator.evaluateActionBindings(
          bindings,
          executionParams,
        );

        const cleanValues = removeFunctions(values);

        const errors = dataTreeEvaluator.errors;
        dataTreeEvaluator.clearErrors();
        return { values: cleanValues, errors };
      }
      case EVAL_WORKER_ACTIONS.EVAL_TRIGGER: {
        const { dynamicTrigger, callbackData, dataTree } = requestData;
        if (!dataTreeEvaluator) {
          return { triggers: [], errors: [] };
        }
        const evalTree = dataTreeEvaluator.updateDataTree(dataTree);
        const withFunctions = addFunctions(evalTree);
        const triggers = dataTreeEvaluator.getDynamicValue(
          dynamicTrigger,
          withFunctions,
          true,
          callbackData,
        );
        const cleanTriggers = removeFunctions(triggers);
        const errors = dataTreeEvaluator.errors;
        dataTreeEvaluator.clearErrors();
        return { triggers: cleanTriggers, errors };
      }
      case EVAL_WORKER_ACTIONS.CLEAR_CACHE: {
        dataTreeEvaluator = undefined;
        return true;
      }
      case EVAL_WORKER_ACTIONS.CLEAR_PROPERTY_CACHE: {
        const { propertyPath } = requestData;
        if (!dataTreeEvaluator) {
          return true;
        }
        dataTreeEvaluator.clearPropertyCache(propertyPath);
        return true;
      }
      case EVAL_WORKER_ACTIONS.CLEAR_PROPERTY_CACHE_OF_WIDGET: {
        const { widgetName } = requestData;
        if (!dataTreeEvaluator) {
          return true;
        }
        dataTreeEvaluator.clearPropertyCacheOfWidget(widgetName);
        return true;
      }
      case EVAL_WORKER_ACTIONS.VALIDATE_PROPERTY: {
        const {
          widgetType,
          widgetTypeConfigMap,
          property,
          value,
          props,
        } = requestData;
        return removeFunctions(
          validateWidgetProperty(
            widgetTypeConfigMap,
            widgetType,
            property,
            value,
            props,
          ),
        );
      }
      default: {
        console.error("Action not registered on worker", method);
      }
    }
  }),
);

export class DataTreeEvaluator {
  dependencyMap: DependencyMap = {};
  sortedDependencies: Array<string> = [];
  inverseDependencyMap: DependencyMap = {};
  widgetConfigMap: WidgetTypeConfigMap = {};
  evalTree: DataTree = {};
  allKeys: Record<string, true> = {};
  validationPaths: Record<string, Set<string>> = {};
  oldUnEvalTree: DataTree = {};
  errors: EvalError[] = [];
  parsedValueCache: Map<
    string,
    {
      value: any;
      version: number;
    }
  > = new Map();

  constructor(widgetConfigMap: WidgetTypeConfigMap) {
    this.widgetConfigMap = widgetConfigMap;
  }

  createFirstTree(unEvalTree: DataTree) {
    const totalStart = performance.now();
    // Add functions to the tree
    const withFunctions = addFunctions(unEvalTree);
    // Create dependency map
    const createDependencyStart = performance.now();
    this.dependencyMap = this.createDependencyMap(withFunctions);
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
      withFunctions,
      this.sortedDependencies,
    );
    const evaluateEnd = performance.now();
    // Validate Widgets
    const validateStart = performance.now();
    const validated = getValidatedTree(this.widgetConfigMap, evaluatedTree);
    const validateEnd = performance.now();
    // Remove functions
    this.evalTree = removeFunctionsFromDataTree(validated);
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
    LOGS.push({ timeTakenForFirstTree });
  }

  updateDataTree(unEvalTree: DataTree) {
    const totalStart = performance.now();
    // Add appsmith internal functions to the tree ex. navigateTo / showModal
    const unEvalTreeWithFunctions = addFunctions(unEvalTree);
    // Calculate diff
    const diffCheckTimeStart = performance.now();
    const differences = diff(this.oldUnEvalTree, unEvalTree) || [];
    // Since eval tree is listening to possible events that dont cause differences
    // We want to check if no diffs are present and bail out early
    if (differences.length === 0) {
      return this.evalTree;
    }
    const diffCheckTimeStop = performance.now();
    // Check if dependencies have changed
    const updateDependenciesStart = performance.now();

    // Find all the paths that have changed as part of the difference and update the
    // global dependency map if an existing dynamic binding has now become legal
    const {
      dependenciesOfRemovedPaths,
      removedPaths,
    } = this.updateDependencyMap(differences, unEvalTreeWithFunctions);
    const updateDependenciesStop = performance.now();

    const calculateSortOrderStart = performance.now();

    const subTreeSortOrder: string[] = this.calculateSubTreeSortOrder(
      differences,
      dependenciesOfRemovedPaths,
      removedPaths,
    );

    const calculateSortOrderStop = performance.now();

    LOGS.push({
      differences,
      subTreeSortOrder,
      sortedDependencies: this.sortedDependencies,
      inverse: this.inverseDependencyMap,
      updatedDependencyMap: this.dependencyMap,
    });

    // Evaluate
    const evalStart = performance.now();
    // We are setting all values from our uneval tree to the old eval tree we have
    // this way we can get away with just evaluating the sort order and nothing else
    subTreeSortOrder.forEach((propertyPath) => {
      const lastIndexOfDot = propertyPath.lastIndexOf(".");
      // Only do this for property paths and not the entity themselves
      if (lastIndexOfDot !== -1) {
        const unEvalPropValue = _.get(unEvalTree, propertyPath);
        // TODO Optimise: Required only if unEvalPropValue is a binding that needs eval
        _.set(this.evalTree, propertyPath, unEvalPropValue);
      }
    });

    // Remove any deleted paths from the eval tree
    removedPaths.forEach((removedPath) => {
      _.unset(this.evalTree, removedPath);
    });
    const evaluatedTree = this.evaluateTree(this.evalTree, subTreeSortOrder);
    const evalStop = performance.now();

    // Remove functions
    this.evalTree = removeFunctionsFromDataTree(evaluatedTree);
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
    LOGS.push({ timeTakenForSubTreeEval });
    return this.evalTree;
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
    const uniqueKeysInSortOrder = [...new Set(finalSortOrder)];

    const sortOrderPropertyPaths = Array.from(uniqueKeysInSortOrder);

    //Trim this list to now remove the property paths which are simply entity names
    const finalSortOrderArray: Array<string> = [];
    sortOrderPropertyPaths.forEach((propertyPath) => {
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

  getValidationPaths(unevalDataTree: DataTree): Record<string, Set<string>> {
    const result: Record<string, Set<string>> = {};
    for (const key in unevalDataTree) {
      const entity = unevalDataTree[key];
      if (isAction(entity)) {
        // TODO: add the properties to a global map somewhere
        result[entity.name] = new Set(
          ["config", "isLoading", "data"].map((e) => `${entity.name}.${e}`),
        );
      } else if (isWidget(entity)) {
        if (!this.widgetConfigMap[entity.type])
          throw new CrashingError(
            `${entity.widgetName} has unrecognised entity type: ${entity.type}`,
          );
        const { validations } = this.widgetConfigMap[entity.type];

        result[entity.widgetName] = new Set(
          Object.keys(validations).map((e) => `${entity.widgetName}.${e}`),
        );
      }
    }
    return result;
  }

  createDependencyMap(unEvalTree: DataTree): DependencyMap {
    let dependencyMap: DependencyMap = {};
    this.allKeys = getAllPaths(unEvalTree);
    this.validationPaths = this.getValidationPaths(unEvalTree);
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
    // TODO make this run only for widgets and not actions
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
    if (entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET) {
      // Set default property dependency
      const defaultProperties = this.widgetConfigMap[entity.type]
        .defaultProperties;
      Object.keys(defaultProperties).forEach((property) => {
        dependencies[`${entityName}.${property}`] = [
          `${entityName}.${defaultProperties[property]}`,
        ];
      });
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
        (currentTree: DataTree, propertyPath: string) => {
          LOGS.push(`evaluating ${propertyPath}`);
          const entityName = propertyPath.split(".")[0];
          const entity: DataTreeEntity = currentTree[entityName];
          const unEvalPropertyValue = _.get(currentTree as any, propertyPath);
          const isABindingPath =
            (isAction(entity) || isWidget(entity)) &&
            isPathADynamicBinding(
              entity,
              propertyPath.substring(propertyPath.indexOf(".") + 1),
            );
          let evalPropertyValue;
          const requiresEval =
            isABindingPath && isDynamicValue(unEvalPropertyValue);
          if (requiresEval) {
            try {
              evalPropertyValue = this.evaluateDynamicProperty(
                propertyPath,
                currentTree,
                unEvalPropertyValue,
              );
            } catch (e) {
              this.errors.push({
                type: EvalErrorTypes.EVAL_PROPERTY_ERROR,
                message: e.message,
                context: {
                  propertyPath,
                },
              });
              evalPropertyValue = undefined;
            }
          } else {
            evalPropertyValue = unEvalPropertyValue;
          }
          if (isWidget(entity)) {
            const widgetEntity = entity;
            // TODO fix for nested properties
            // For nested properties like Table1.selectedRow.email
            // The following line will calculated the property name to be selectedRow
            // instead of selectedRow.email
            const propertyName = propertyPath.split(".")[1];
            if (propertyName) {
              let parsedValue = this.validateAndParseWidgetProperty(
                propertyPath,
                widgetEntity,
                currentTree,
                evalPropertyValue,
                unEvalPropertyValue,
              );
              const defaultPropertyMap = this.widgetConfigMap[widgetEntity.type]
                .defaultProperties;
              const hasDefaultProperty = propertyName in defaultPropertyMap;
              if (hasDefaultProperty) {
                const defaultProperty = defaultPropertyMap[propertyName];
                parsedValue = this.overwriteDefaultDependentProps(
                  defaultProperty,
                  parsedValue,
                  propertyPath,
                  widgetEntity,
                );
              }
              return _.set(currentTree, propertyPath, parsedValue);
            }
            return _.set(currentTree, propertyPath, evalPropertyValue);
          } else {
            return _.set(currentTree, propertyPath, evalPropertyValue);
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
      this.errors.push({
        type: EvalErrorTypes.DEPENDENCY_ERROR,
        message: e.message,
      });
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
    returnTriggers: boolean,
    callBackData?: Array<any>,
  ) {
    // Get the {{binding}} bound values
    const { stringSegments, jsSnippets } = getDynamicBindings(dynamicBinding);
    if (returnTriggers) {
      const result = this.evaluateDynamicBoundValue(
        data,
        jsSnippets[0],
        callBackData,
      );
      return result.triggers;
    }
    if (stringSegments.length) {
      // Get the Data Tree value of those "binding "paths
      const values = jsSnippets.map((jsSnippet, index) => {
        if (jsSnippet) {
          const result = this.evaluateDynamicBoundValue(
            data,
            jsSnippet,
            callBackData,
          );
          return result.result;
        } else {
          return stringSegments[index];
        }
      });

      // if it is just one binding, no need to create template string
      if (stringSegments.length === 1) return values[0];
      // else return a string template with bindings
      return createDynamicValueString(dynamicBinding, stringSegments, values);
    }
    return undefined;
  }

  // Paths are expected to have "{name}.{path}" signature
  // Also returns any action triggers found after evaluating value
  evaluateDynamicBoundValue(
    data: DataTree,
    path: string,
    callbackData?: Array<any>,
  ): EvalResult {
    try {
      const unescapedJS = unescapeJS(path).replace(/(\r\n|\n|\r)/gm, "");
      return this.evaluate(unescapedJS, data, callbackData);
    } catch (e) {
      this.errors.push({
        type: EvalErrorTypes.UNESCAPE_STRING_ERROR,
        message: e.message,
        context: {
          path,
        },
      });
      return { result: undefined, triggers: [] };
    }
  }

  evaluate(js: string, data: DataTree, callbackData?: Array<any>): EvalResult {
    const scriptToEvaluate = `
        function closedFunction () {
          const result = ${js};
          return { result, triggers: self.triggers }
        }
        closedFunction()
      `;
    const scriptWithCallback = `
         function callback (script) {
            const userFunction = script;
            const result = userFunction.apply(self, CALLBACK_DATA);
            return { result, triggers: self.triggers };
         }
         callback(${js});
      `;
    const script = callbackData ? scriptWithCallback : scriptToEvaluate;
    try {
      const { result, triggers } = (function() {
        /**** Setting the eval context ****/
        const GLOBAL_DATA: Record<string, any> = {};
        ///// Adding callback data
        GLOBAL_DATA.CALLBACK_DATA = callbackData;
        ///// Adding Data tree
        Object.keys(data).forEach((datum) => {
          GLOBAL_DATA[datum] = data[datum];
        });
        ///// Fixing action paths and capturing their execution response
        if (data.actionPaths) {
          GLOBAL_DATA.triggers = [];
          const pusher = function(
            this: DataTree,
            action: any,
            ...payload: any[]
          ) {
            const actionPayload = action(...payload);
            GLOBAL_DATA.triggers.push(actionPayload);
          };
          GLOBAL_DATA.actionPaths.forEach((path: string) => {
            const action = _.get(GLOBAL_DATA, path);
            const entity = _.get(GLOBAL_DATA, path.split(".")[0]);
            if (action) {
              _.set(GLOBAL_DATA, path, pusher.bind(data, action.bind(entity)));
            }
          });
        }

        // Set it to self
        Object.keys(GLOBAL_DATA).forEach((key) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: No types available
          self[key] = GLOBAL_DATA[key];
        });

        ///// Adding extra libraries separately
        extraLibraries.forEach((library) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: No types available
          self[library.accessor] = library.lib;
        });

        ///// Remove all unsafe functions
        unsafeFunctionForEval.forEach((func) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: No types available
          self[func] = undefined;
        });

        const evalResult = eval(script);

        // Remove it from self
        // This is needed so that next eval can have a clean sheet
        Object.keys(GLOBAL_DATA).forEach((key) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: No types available
          delete self[key];
        });

        return evalResult;
      })();
      return { result, triggers };
    } catch (e) {
      this.errors.push({
        type: EvalErrorTypes.EVAL_ERROR,
        message: e.message,
        context: {
          binding: js,
        },
      });
      return { result: undefined, triggers: [] };
    }
  }

  evaluateDynamicProperty(
    propertyPath: string,
    currentTree: DataTree,
    unEvalPropertyValue: any,
  ): any {
    return this.getDynamicValue(unEvalPropertyValue, currentTree, false);
  }

  validateAndParseWidgetProperty(
    propertyPath: string,
    widget: DataTreeWidget,
    currentTree: DataTree,
    evalPropertyValue: any,
    unEvalPropertyValue: string,
  ): any {
    const entityPropertyName = _.drop(propertyPath.split(".")).join(".");
    let valueToValidate = evalPropertyValue;
    if (isPathADynamicTrigger(widget, propertyPath)) {
      const { triggers } = this.getDynamicValue(
        unEvalPropertyValue,
        currentTree,
        true,
        undefined,
      );
      valueToValidate = triggers;
    }
    const { parsed, isValid, message, transformed } = validateWidgetProperty(
      this.widgetConfigMap,
      widget.type,
      entityPropertyName,
      valueToValidate,
      widget,
      currentTree,
    );
    const evaluatedValue = isValid
      ? parsed
      : _.isUndefined(transformed)
      ? evalPropertyValue
      : transformed;
    const safeEvaluatedValue = removeFunctions(evaluatedValue);
    _.set(widget, `evaluatedValues.${entityPropertyName}`, safeEvaluatedValue);
    if (!isValid) {
      _.set(widget, `invalidProps.${entityPropertyName}`, true);
      _.set(widget, `validationMessages.${entityPropertyName}`, message);
    } else {
      _.set(widget, `invalidProps.${entityPropertyName}`, false);
      _.set(widget, `validationMessages.${entityPropertyName}`, "");
    }

    if (isPathADynamicTrigger(widget, entityPropertyName)) {
      return unEvalPropertyValue;
    } else {
      const parsedCache = this.getParsedValueCache(propertyPath);
      if (!equal(parsedCache.value, parsed)) {
        this.parsedValueCache.set(propertyPath, {
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
    this.validationPaths = this.getValidationPaths(unEvalDataTree);
    // Transform the diff library events to Appsmith evaluator events
    differences
      .map(translateDiffEventToDataTreeDiffEvent)
      .forEach((dataTreeDiff) => {
        const entityName = dataTreeDiff.payload.propertyPath.split(".")[0];
        let entity = unEvalDataTree[entityName];
        if (dataTreeDiff.event === DataTreeDiffEvent.DELETE) {
          entity = this.oldUnEvalTree[entityName];
        }
        const entityType = isValidEntity(entity) ? entity.ENTITY_TYPE : "noop";

        if (entityType !== "noop") {
          switch (dataTreeDiff.event) {
            case DataTreeDiffEvent.NEW: {
              // If a new widget was added, add all the internal bindings for this widget to the global dependency map
              if (
                isWidget(entity) &&
                dataTreeDiff.payload.propertyPath === entityName
              ) {
                const widgetDependencyMap: DependencyMap = this.listEntityDependencies(
                  entity as DataTreeWidget,
                  entityName,
                );
                if (Object.keys(widgetDependencyMap).length) {
                  didUpdateDependencyMap = true;
                  Object.assign(this.dependencyMap, widgetDependencyMap);
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
                isWidget(entity) &&
                dataTreeDiff.payload.propertyPath === entityName
              ) {
                const widgetBindings = this.listEntityDependencies(
                  entity,
                  entityName,
                );
                Object.keys(widgetBindings).forEach((widgetDep) => {
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
                  this.dependencyMap[dependencyPath].forEach(
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
                  this.dependencyMap[dependencyPath] = _.difference(
                    this.dependencyMap[dependencyPath],
                    toRemove,
                  );
                }
              });
              break;
            }

            case DataTreeDiffEvent.EDIT: {
              // We only care about dependencies for a widget. This is because in case a dependency of an action changes,
              // that shouldn't trigger an evaluation.
              // Also for a widget, we only care if the difference is in dynamic bindings since static values do not need
              // an evaluation.
              if (
                entityType === ENTITY_TYPE.WIDGET &&
                typeof dataTreeDiff.payload.value === "string"
              ) {
                const entity: DataTreeWidget = unEvalDataTree[
                  entityName
                ] as DataTreeWidget;
                const isABindingPath = isPathADynamicBinding(
                  entity,
                  dataTreeDiff.payload.propertyPath.substring(
                    dataTreeDiff.payload.propertyPath.indexOf(".") + 1,
                  ),
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
                    this.dependencyMap[
                      dataTreeDiff.payload.propertyPath
                    ] = correctSnippets;
                  } else {
                    // The dependency on this property path has been removed. Delete this property path from the global
                    // dependency map
                    delete this.dependencyMap[
                      dataTreeDiff.payload.propertyPath
                    ];
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
        this.dependencyMap[key] = _.flatten(
          this.dependencyMap[key].map((path) =>
            extractReferencesFromBinding(path, this.allKeys),
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
    LOGS.push({
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
  ) {
    const changePaths: Set<string> = new Set(dependenciesOfRemovedPaths);
    for (const d of differences) {
      if (!Array.isArray(d.path) || d.path.length === 0) continue; // Null check for typescript
      // Apply the changes into the evalTree so that it gets the latest changes
      applyChange(this.evalTree, undefined, d);

      // If this is a property path change, simply add for evaluation and move on
      if (d.path.length > 1) {
        changePaths.add(convertPathToString(d.path));
        continue;
      }
      // A top level entity (widget/action) has been added or deleted
      if (d.path.length === 1) {
        const entityName = d.path[0];
        /**
         * We want to add all pre-existing dynamic and static bindings in dynamic paths of this entity to get evaluated and validated.
         * Example:
         * - Table1.tableData = {{Api1.data}}
         * - Api1 gets created.
         * - This function gets called with a diff {path:["Api1"]}
         * We want to add `Api.data` to changedPaths so that `Table1.tableData` can be discovered below.
         */
        if (entityName in this.validationPaths) {
          for (const dependency of this.validationPaths[entityName]) {
            changePaths.add(dependency);
          }
        }
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

    // Now that we have all the root nodes which have to be evaluated, recursively find all the other paths which
    // would get impacted because they are dependent on the said root nodes and add them in order
    const completeSortOrder = this.getCompleteSortOrder(
      changePathsWithNestedDependants,
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
        false,
      ),
    );
  }

  clearErrors() {
    this.errors = [];
  }
}

const getAllPaths = (
  tree: Record<string, any>,
  prefix = "",
  result: Record<string, true> = {},
): Record<string, true> => {
  Object.keys(tree).forEach((el) => {
    if (Array.isArray(tree[el])) {
      const key = `${prefix}${el}`;
      result[key] = true;
    } else if (typeof tree[el] === "object" && tree[el] !== null) {
      const key = `${prefix}${el}`;
      result[key] = true;
      getAllPaths(tree[el], `${key}.`, result);
    } else {
      const key = `${prefix}${el}`;
      result[key] = true;
    }
  });
  return result;
};

const extractReferencesFromBinding = (
  path: string,
  all: Record<string, true>,
): Array<string> => {
  const subDeps: Array<string> = [];
  const identifiers = path.match(/[a-zA-Z_$][a-zA-Z_$0-9.]*/g) || [path];
  identifiers.forEach((identifier: string) => {
    if (all.hasOwnProperty(identifier)) {
      subDeps.push(identifier);
    } else {
      const subIdentifiers =
        identifier.match(/[a-zA-Z_$][a-zA-Z_$0-9]*/g) || [];
      let current = "";
      for (let i = 0; i < subIdentifiers.length; i++) {
        const key = `${current}${current ? "." : ""}${subIdentifiers[i]}`;
        if (key in all) {
          current = key;
        } else {
          break;
        }
      }
      if (current && current.includes(".")) subDeps.push(current);
    }
  });
  return _.uniq(subDeps);
};

// TODO cryptic comment below. Dont know if we still need this. Duplicate function
// referencing DATA_BIND_REGEX fails for the value "{{Table1.tableData[Table1.selectedRowIndex]}}" if you run it multiple times and don't recreate
const isDynamicValue = (value: string): boolean => DATA_BIND_REGEX.test(value);

// For creating a final value where bindings could be in a template format
const createDynamicValueString = (
  binding: string,
  subBindings: string[],
  subValues: string[],
): string => {
  // Replace the string with the data tree values
  let finalValue = binding;
  subBindings.forEach((b, i) => {
    let value = subValues[i];
    if (Array.isArray(value) || _.isObject(value)) {
      value = JSON.stringify(value);
    }
    try {
      if (JSON.parse(value)) {
        value = value.replace(/\\([\s\S])|(")/g, "\\$1$2");
      }
    } catch (e) {
      // do nothing
    }
    finalValue = finalValue.replace(b, value);
  });
  return finalValue;
};

function isValidEntity(entity: DataTreeEntity): entity is DataTreeObjectEntity {
  if (!_.isObject(entity)) {
    // ERRORS.push({
    //   type: EvalErrorTypes.BAD_UNEVAL_TREE_ERROR,
    //   message: "Data tree entity is not an object",
    //   context: entity,
    // });
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

const addFunctions = (dataTree: Readonly<DataTree>): DataTree => {
  const withFunction: DataTree = _.cloneDeep(dataTree);
  withFunction.actionPaths = [];
  Object.keys(withFunction).forEach((entityName) => {
    const entity = withFunction[entityName];
    if (isAction(entity)) {
      const runFunction = function(
        this: DataTreeAction,
        onSuccess: string,
        onError: string,
        params = "",
      ) {
        return {
          type: "RUN_ACTION",
          payload: {
            actionId: this.actionId,
            onSuccess: onSuccess ? `{{${onSuccess.toString()}}}` : "",
            onError: onError ? `{{${onError.toString()}}}` : "",
            params,
          },
        };
      };
      _.set(withFunction, `${entityName}.run`, runFunction);
      withFunction.actionPaths &&
        withFunction.actionPaths.push(`${entityName}.run`);
    }
  });
  withFunction.navigateTo = function(
    pageNameOrUrl: string,
    params: Record<string, string>,
    target?: string,
  ) {
    return {
      type: "NAVIGATE_TO",
      payload: { pageNameOrUrl, params, target },
    };
  };
  withFunction.actionPaths.push("navigateTo");

  withFunction.showAlert = function(message: string, style: string) {
    return {
      type: "SHOW_ALERT",
      payload: { message, style },
    };
  };
  withFunction.actionPaths.push("showAlert");

  withFunction.showModal = function(modalName: string) {
    return {
      type: "SHOW_MODAL_BY_NAME",
      payload: { modalName },
    };
  };
  withFunction.actionPaths.push("showModal");

  withFunction.closeModal = function(modalName: string) {
    return {
      type: "CLOSE_MODAL",
      payload: { modalName },
    };
  };
  withFunction.actionPaths.push("closeModal");

  withFunction.storeValue = function(key: string, value: string) {
    return {
      type: "STORE_VALUE",
      payload: { key, value },
    };
  };
  withFunction.actionPaths.push("storeValue");

  withFunction.download = function(data: string, name: string, type: string) {
    return {
      type: "DOWNLOAD",
      payload: { data, name, type },
    };
  };
  withFunction.actionPaths.push("download");

  withFunction.copyToClipboard = function(
    data: string,
    options?: { debug?: boolean; format?: string },
  ) {
    return {
      type: "COPY_TO_CLIPBOARD",
      payload: {
        data,
        options: { debug: options?.debug, format: options?.format },
      },
    };
  };
  withFunction.actionPaths.push("copyToClipboard");

  return withFunction;
};
