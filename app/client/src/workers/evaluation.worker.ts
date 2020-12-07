import {
  ActionDescription,
  DataTree,
  DataTreeAction,
  DataTreeEntity,
  DataTreeWidget,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import {
  EVAL_WORKER_ACTIONS,
  EvalError,
  EvalErrorTypes,
  extraLibraries,
  getDynamicBindings,
  getEntityDynamicBindingPathList,
  getWidgetDynamicTriggerPathList,
  isPathADynamicBinding,
  isPathADynamicTrigger,
} from "../utils/DynamicBindingUtils";
import _ from "lodash";
import { WidgetTypeConfigMap } from "../utils/WidgetFactory";
import toposort from "toposort";
import { DATA_BIND_REGEX } from "../constants/BindingsConstants";
import equal from "fast-deep-equal/es6";
import * as log from "loglevel";
import unescapeJS from "unescape-js";
import { WidgetType } from "../constants/WidgetConstants";
import { WidgetProps } from "../widgets/BaseWidget";
import { VALIDATORS } from "./validations";
import { applyChange, diff, Diff } from "deep-diff";
import {
  addDependantsOfNestedPropertyPaths,
  convertPathToString,
  DataTreeDiffEvent,
  CrashingError,
  translateDiffEventToDataTreeDiffEvent,
  makeParentsDependOnChildren,
} from "./evaluationUtils";

const ctx: Worker = self as any;

let dataTreeEvaluator: DataTreeEvaluator | undefined;

ctx.addEventListener("message", e => {
  const { action, ...rest } = e.data;
  switch (action as EVAL_WORKER_ACTIONS) {
    case EVAL_WORKER_ACTIONS.EVAL_TREE: {
      const { unevalTree } = rest;
      let dataTree: DataTree = unevalTree;
      let errors: EvalError[] = [];
      let dependencies: DependencyMap = {};
      try {
        if (!dataTreeEvaluator) {
          const { widgetTypeConfigMap } = rest;
          dataTreeEvaluator = new DataTreeEvaluator(widgetTypeConfigMap);
          dataTreeEvaluator.createFirstTree(unevalTree);
          dataTree = dataTreeEvaluator.evalTree;
        } else {
          dataTree = dataTreeEvaluator.updateDataTree(unevalTree);
        }

        // We need to clean it to remove any possible functions inside the tree.
        // If functions exist, it will crash the web worker
        dataTree = JSON.parse(JSON.stringify(dataTree));
        dependencies = dataTreeEvaluator.dependencyMap;
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
        dataTreeEvaluator = undefined;
      }
      ctx.postMessage({
        dataTree,
        dependencies,
        errors,
      });
      break;
    }
    case EVAL_WORKER_ACTIONS.EVAL_SINGLE: {
      const { binding, dataTree } = rest;
      const withFunctions = addFunctions(dataTree);
      if (!dataTreeEvaluator) {
        ctx.postMessage({ value: undefined, errors: [] });
        break;
      }
      const value = dataTreeEvaluator.getDynamicValue(
        binding,
        withFunctions,
        false,
      );
      ctx.postMessage({ value, errors: dataTreeEvaluator.errors });
      dataTreeEvaluator.clearErrors();
      break;
    }
    case EVAL_WORKER_ACTIONS.EVAL_TRIGGER: {
      const { dynamicTrigger, callbackData, dataTree } = rest;
      if (!dataTreeEvaluator) {
        break;
      }
      const evalTree = dataTreeEvaluator.updateDataTree(dataTree);
      const withFunctions = addFunctions(evalTree);
      const triggers = dataTreeEvaluator.getDynamicValue(
        dynamicTrigger,
        withFunctions,
        true,
        callbackData,
      );
      ctx.postMessage({ triggers, errors: dataTreeEvaluator.errors });
      dataTreeEvaluator.clearErrors();
      break;
    }
    case EVAL_WORKER_ACTIONS.CLEAR_CACHE: {
      if (!dataTreeEvaluator) {
        break;
      }
      dataTreeEvaluator.clearAllCaches();
      ctx.postMessage(true);
      break;
    }
    case EVAL_WORKER_ACTIONS.CLEAR_PROPERTY_CACHE: {
      const { propertyPath } = rest;
      if (!dataTreeEvaluator) {
        break;
      }
      dataTreeEvaluator.clearPropertyCache(propertyPath);
      ctx.postMessage(true);
      break;
    }
    case EVAL_WORKER_ACTIONS.CLEAR_PROPERTY_CACHE_OF_WIDGET: {
      const { widgetName } = rest;
      if (!dataTreeEvaluator) {
        break;
      }
      dataTreeEvaluator.clearPropertyCacheOfWidget(widgetName);
      ctx.postMessage(true);
      break;
    }
    case EVAL_WORKER_ACTIONS.VALIDATE_PROPERTY: {
      const { widgetType, property, value, props } = rest;
      if (!dataTreeEvaluator) {
        break;
      }
      const result = dataTreeEvaluator.validateWidgetProperty(
        widgetType,
        property,
        value,
        props,
      );
      ctx.postMessage(result);
      break;
    }
    default: {
      console.error("Action not registered on worker", action);
    }
  }
});

export type DependencyMap = Record<string, Array<string>>;

export class DataTreeEvaluator {
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

  constructor(widgetConfigMap: WidgetTypeConfigMap) {
    this.widgetConfigMap = widgetConfigMap;
  }

  createFirstTree(unEvalTree: DataTree) {
    // Add functions to the tree
    const withFunctions = addFunctions(unEvalTree);
    // Create dependency map
    this.dependencyMap = this.createDependencyTree(withFunctions);
    // Sort
    this.sortedDependencies = this.sortDependencies(this.dependencyMap);
    // Inverse
    this.inverseDependencyMap = this.getInverseDependencyTree();
    // Evaluate
    const evaluatedTree = this.evaluateTree(
      withFunctions,
      this.sortedDependencies,
    );
    // Validate Widgets
    const validated = this.getValidatedTree(evaluatedTree);
    // Remove functions
    this.evalTree = removeFunctionsFromDataTree(validated);
    this.oldUnEvalTree = unEvalTree;
  }

  updateDataTree(unEvalTree: DataTree) {
    // Add functions to the tree
    const withFunctions = addFunctions(unEvalTree);
    // Calculate diff
    const diffCheckTimeStart = performance.now();
    const differences = diff(this.oldUnEvalTree, unEvalTree) || [];
    const diffCheckTimeStop = performance.now();
    // Check if dependencies have changed
    const CheckDependencyChangeStart = performance.now();

    // Find all the paths that have changed as part of the difference and update the
    // global dependency map if an existing dynamic binding has now become legal
    const pathsToBeReEvaluated = this.findFirstPathsToEvaluateAndUpdateDependencyMap(
      differences,
      this.oldUnEvalTree,
      withFunctions,
    );
    const CheckDependencyChangeStop = performance.now();

    const getNeedsEvalPathsStart = performance.now();
    const changePaths: Array<string> = [...pathsToBeReEvaluated];
    differences.forEach(d => {
      if (d.path) {
        // Apply the changes into the oldEvalTree so that it can be evaluated
        applyChange(this.evalTree, undefined, d);

        // If this is a property path change, simply add for evaluation
        if (d.path.length > 1) {
          changePaths.push(convertPathToString(d.path));
        } else if (d.path.length === 1) {
          /*
            When we see a new widget has been added or or delete an old widget ( d.path.length === 1)
            We want to add all the dependencies in the sorted order to make
            sure all the bindings are evaluated.
          */
          this.sortedDependencies.forEach(dependency => {
            if (d.path && dependency.split(".")[0] === d.path[0]) {
              changePaths.push(dependency);
            }
          });
        }
      }
    });

    // If a nested property path has changed and someone (say x) is dependent on the parent of the said property,
    // x must also be evaluated. For example, the following relationship exists in dependency map:
    // <  "Input1.defaultText" : ["Table1.selectedRow.email"] >
    // If Table1.selectedRow has changed, then Input1.defaultText must also be evaluated because Table1.selectedRow.email
    // is a nested property of Table1.selectedRow
    const changePathsWithNestedDependants = addDependantsOfNestedPropertyPaths(
      changePaths,
      this.inverseDependencyMap,
    );

    // Now that we have all the root nodes which have to be evaluated, recursively find all the other paths which
    // would get impacted because they are dependent on the said root nodes and add them in order
    const newSortOrder = this.getUpdatedSortOrder(
      changePathsWithNestedDependants,
      this.inverseDependencyMap,
    );

    const getNeedsEvalPathsStop = performance.now();

    console.log({
      differences,
      newSortOrder,
      changePathsWithNestedDependants,
      sortedDependencies: this.sortedDependencies,
      changePaths,
      inverse: this.inverseDependencyMap,
      updatedDependencyMap: this.dependencyMap,
    });

    newSortOrder.forEach(propertyPath => {
      const unEvalPropValue = _.get(unEvalTree, propertyPath);
      _.set(this.evalTree, propertyPath, unEvalPropValue);
    });

    // Evaluate
    const evalStart = performance.now();
    const evaluatedTree = this.evaluateTree(this.evalTree, newSortOrder);
    const evalStop = performance.now();
    // Validate Widgets
    // const validateStart = performance.now();
    // const validated = this.getValidatedTree(evaluatedTree);
    // const validateStop = performance.now();
    // Remove functions
    this.evalTree = removeFunctionsFromDataTree(evaluatedTree);
    this.oldUnEvalTree = unEvalTree;
    console.log({
      diffCheck: (diffCheckTimeStop - diffCheckTimeStart).toFixed(2),
      checkDepChange: (
        CheckDependencyChangeStop - CheckDependencyChangeStart
      ).toFixed(2),
      getNeedsEvalPaths: (
        getNeedsEvalPathsStop - getNeedsEvalPathsStart
      ).toFixed(2),
      eval: (evalStop - evalStart).toFixed(2),
      // validate: (validateStop - validateStart).toFixed(2),
    });
    return this.evalTree;
  }

  getUpdatedSortOrder(
    changes: Array<string>,
    inverseMap: DependencyMap,
  ): Array<string> {
    const sortOrder: Array<string> = [...changes];
    let iterator = 0;
    while (iterator < sortOrder.length) {
      const newNodes = inverseMap[sortOrder[iterator]];

      // If we find more nodes that would be impacted by the evaluation of the node being investigated
      // we add these to the sort order.
      if (newNodes) {
        newNodes.forEach(toBeEvaluatedNode => {
          if (!sortOrder.includes(toBeEvaluatedNode)) {
            sortOrder.push(toBeEvaluatedNode);
          }
        });
      }
      iterator++;
    }
    return sortOrder;
  }

  createDependencyTree(unEvalTree: DataTree): DependencyMap {
    let dependencyMap: DependencyMap = {};
    this.allKeys = getAllPaths(unEvalTree);
    Object.keys(unEvalTree).forEach(entityName => {
      const entity = unEvalTree[entityName];
      if (
        typeof entity === "object" &&
        "ENTITY_TYPE" in entity &&
        (entity.ENTITY_TYPE === ENTITY_TYPE.ACTION ||
          entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET)
      ) {
        const entityListedDependencies = this.listEntityDependencies(
          entity,
          entityName,
        );
        dependencyMap = { ...dependencyMap, ...entityListedDependencies };
      }
    });
    Object.keys(dependencyMap).forEach(key => {
      dependencyMap[key] = _.flatten(
        dependencyMap[key].map(path =>
          calculateSubDependencies(path, this.allKeys),
        ),
      );
    });
    makeParentsDependOnChildren(dependencyMap, unEvalTree);
    return dependencyMap;
  }

  listEntityDependencies(
    entity: DataTreeWidget | DataTreeAction,
    entityName: string,
  ): DependencyMap {
    const dependencies: DependencyMap = {};
    const dynamicBindingPathList = getEntityDynamicBindingPathList(entity);
    if (dynamicBindingPathList.length) {
      dynamicBindingPathList.forEach(dynamicPath => {
        const propertyPath = dynamicPath.key;
        const unevalPropValue = _.get(entity, propertyPath);
        const { jsSnippets } = getDynamicBindings(unevalPropValue);
        const existingDeps =
          dependencies[`${entityName}.${propertyPath}`] || [];
        dependencies[`${entityName}.${propertyPath}`] = existingDeps.concat(
          jsSnippets.filter(jsSnippet => !!jsSnippet),
        );
      });
    }
    if (entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET) {
      // Set default property dependency
      const defaultProperties = this.widgetConfigMap[entity.type]
        .defaultProperties;
      Object.keys(defaultProperties).forEach(property => {
        dependencies[`${entityName}.${property}`] = [
          `${entityName}.${defaultProperties[property]}`,
        ];
      });
      // Set triggers. TODO check if needed
      const dynamicTriggerPathList = getWidgetDynamicTriggerPathList(entity);
      if (dynamicTriggerPathList.length) {
        dynamicTriggerPathList.forEach(dynamicPath => {
          dependencies[`${entityName}.${dynamicPath.key}`] = [];
        });
      }
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
          console.log("evaluating", propertyPath);
          const entityName = propertyPath.split(".")[0];
          const entity: DataTreeEntity = currentTree[entityName];
          const unEvalPropertyValue = _.get(currentTree as any, propertyPath);
          let evalPropertyValue;
          const requiresEval = isDynamicValue(unEvalPropertyValue);
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
            const widgetEntity: DataTreeWidget = entity as DataTreeWidget;
            // TODO fix for nested properties
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
        dependencyMap[key].forEach(dep => dependencyTree.push([key, dep]));
      } else {
        // Set no dependency
        dependencyTree.push([key, ""]);
      }
    });

    try {
      // sort dependencies and remove empty dependencies
      return toposort(dependencyTree)
        .reverse()
        .filter(d => !!d);
    } catch (e) {
      this.errors.push({
        type: EvalErrorTypes.DEPENDENCY_ERROR,
        message: e.message,
      });
      throw new CrashingError(e.message);
      return [];
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

  clearPropertyCacheOfWidget = (widgetName: string) => {
    // TODO check if this loop mutating itself is safe
    this.parsedValueCache.forEach((value, key) => {
      const match = key.match(`${widgetName}.`);
      if (match) {
        this.parsedValueCache.delete(key);
      }
    });
  };

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
  evaluateDynamicBoundValue = (
    data: DataTree,
    path: string,
    callbackData?: Array<any>,
  ): EvalResult => {
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
  };

  evaluate = (
    js: string,
    data: DataTree,
    callbackData?: Array<any>,
  ): EvalResult => {
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
        Object.keys(data).forEach(datum => {
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
        Object.keys(GLOBAL_DATA).forEach(key => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: No types available
          self[key] = GLOBAL_DATA[key];
        });

        ///// Adding extra libraries separately
        extraLibraries.forEach(library => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: No types available
          self[library.accessor] = library.lib;
        });

        const evalResult = eval(script);

        // Remove it from self
        // This is needed so that next eval can have a clean sheet
        Object.keys(GLOBAL_DATA).forEach(key => {
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
  };

  evaluateDynamicProperty(
    propertyPath: string,
    currentTree: DataTree,
    unEvalPropertyValue: any,
  ): any {
    const dynamicResult = this.getDynamicValue(
      unEvalPropertyValue,
      currentTree,
      false,
    );
    log.debug("eval " + propertyPath);

    return dynamicResult;
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
    const {
      parsed,
      isValid,
      message,
      transformed,
    } = this.validateWidgetProperty(
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

  overwriteDefaultDependentProps = (
    defaultProperty: string,
    propertyValue: any,
    propertyPath: string,
    entity: DataTreeWidget,
  ) => {
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
  };

  validateWidgetProperty = (
    widgetType: WidgetType,
    property: string,
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ) => {
    const propertyValidationTypes = this.widgetConfigMap[widgetType]
      .validations;
    const validationTypeOrValidator = propertyValidationTypes[property];
    let validator;

    if (typeof validationTypeOrValidator === "function") {
      validator = validationTypeOrValidator;
    } else {
      validator = VALIDATORS[validationTypeOrValidator];
    }
    if (validator) {
      return validator(value, props, dataTree);
    } else {
      return { isValid: true, parsed: value };
    }
  };

  getValidatedTree = (tree: any) => {
    return Object.keys(tree).reduce((tree, entityKey: string) => {
      const entity = tree[entityKey];
      if (entity && entity.type) {
        const parsedEntity = { ...entity };
        Object.keys(entity).forEach((property: string) => {
          const hasEvaluatedValue = _.has(
            parsedEntity,
            `evaluatedValues.${property}`,
          );
          const hasValidation = _.has(parsedEntity, `invalidProps.${property}`);
          const isSpecialField = [
            "dynamicBindingPathList",
            "dynamicTriggerPathList",
            "dynamicPropertyPathList",
            "evaluatedValues",
            "invalidProps",
            "validationMessages",
          ].includes(property);
          const isDynamicField =
            isPathADynamicBinding(parsedEntity, property) ||
            isPathADynamicTrigger(parsedEntity, property);

          if (
            !isSpecialField &&
            !isDynamicField &&
            (!hasValidation || !hasEvaluatedValue)
          ) {
            const value = entity[property];
            // Pass it through parse
            const {
              parsed,
              isValid,
              message,
              transformed,
            } = this.validateWidgetProperty(
              entity.type,
              property,
              value,
              entity,
              tree,
            );
            parsedEntity[property] = parsed;
            if (!hasEvaluatedValue) {
              const evaluatedValue = isValid
                ? parsed
                : _.isUndefined(transformed)
                ? value
                : transformed;
              const safeEvaluatedValue = removeFunctions(evaluatedValue);
              _.set(
                parsedEntity,
                `evaluatedValues.${property}`,
                safeEvaluatedValue,
              );
            }

            const hasValidation = _.has(
              parsedEntity,
              `invalidProps.${property}`,
            );
            if (!hasValidation && !isValid) {
              _.set(parsedEntity, `invalidProps.${property}`, true);
              _.set(parsedEntity, `validationMessages.${property}`, message);
            }
          }
        });
        return { ...tree, [entityKey]: parsedEntity };
      }
      return tree;
    }, tree);
  };

  findFirstPathsToEvaluateAndUpdateDependencyMap = (
    differences: Array<Diff<any, any>> | undefined,
    oldTree: DataTree,
    dataTree: DataTree,
  ): Array<string> => {
    if (differences === undefined) {
      return [];
    }
    const entityNameAndTypeMap: Record<string, string> = {};
    Object.keys(dataTree).forEach(entityName => {
      const entity = dataTree[entityName];
      let entityType;
      if (typeof entity === "object" && "ENTITY_TYPE" in entity) {
        entityType = entity.ENTITY_TYPE;
      } else {
        entityType = "noop";
      }
      entityNameAndTypeMap[entityName] = entityType;
    });
    const diffCalcStart = performance.now();
    let didUpdateDependencyMap = false;
    const pathsToBeReEvaluated: Array<string> = [];
    differences.forEach(difference => {
      if (!difference.path) {
        return;
      }
      const entityName = difference.path[0];
      if (entityNameAndTypeMap[entityName] === "noop") {
        return;
      }
      // Transform the diff library events to Appsmith evaluator events
      const dataTreeDiff = translateDiffEventToDataTreeDiffEvent(difference);
      console.log({ dataTreeDiff, difference });
      switch (dataTreeDiff.event) {
        case DataTreeDiffEvent.NEW: {
          // If a new widget was added, add all the internal bindings for this widget to the global dependency map
          if (
            entityNameAndTypeMap[entityName] === ENTITY_TYPE.WIDGET &&
            dataTreeDiff.payload.propertyPath === entityName
          ) {
            const entity: DataTreeWidget = dataTree[
              entityName
            ] as DataTreeWidget;

            const widgetBindings = this.listEntityDependencies(
              entity,
              entityName,
            );
            if (Object.keys(widgetBindings).length) {
              didUpdateDependencyMap = true;
              this.dependencyMap = {
                ...this.dependencyMap,
                ...widgetBindings,
              };
            }
          }
          // Either a new entity or a new property path has been added. Go through existing dynamic bindings and
          // find out if a new dependency has to be created because the property path used in the binding just became
          // eligible
          this.allKeys = getAllPaths(dataTree);
          const possibleReferencesInOldBindings: DependencyMap = this.getPropertyPathReferencesInExistingBindings(
            dataTree,
            dataTreeDiff.payload.propertyPath,
          );
          // We have found some bindings which are related to the new property path and hence should be added to the
          // global dependency map
          if (Object.keys(possibleReferencesInOldBindings).length) {
            didUpdateDependencyMap = true;
            this.dependencyMap = {
              ...this.dependencyMap,
              ...possibleReferencesInOldBindings,
            };
          }
          break;
        }
        case DataTreeDiffEvent.DELETE: {
          // If an existing widget was deleted, remove all the bindings from the global dependency map
          if (
            entityNameAndTypeMap[entityName] === ENTITY_TYPE.WIDGET &&
            dataTreeDiff.payload.propertyPath === entityName
          ) {
            const entity: DataTreeWidget = dataTree[
              entityName
            ] as DataTreeWidget;

            const widgetBindings = this.listEntityDependencies(
              entity,
              entityName,
            );
            Object.keys(widgetBindings).forEach(widgetDep => {
              didUpdateDependencyMap = true;
              delete this.dependencyMap[widgetDep];
            });
          }
          // Either an existing entity or an existing property path has been deleted. Update the global dependency map
          // by removing the bindings from the same.
          this.allKeys = getAllPaths(dataTree);
          Object.keys(this.dependencyMap).forEach(dependencyPath => {
            didUpdateDependencyMap = true;
            // TODO delete via regex
            if (dependencyPath.includes(dataTreeDiff.payload.propertyPath)) {
              delete this.dependencyMap[dependencyPath];
            } else {
              const toRemove: Array<string> = [];
              this.dependencyMap[dependencyPath].forEach(dependantPath => {
                if (dependantPath.includes(dataTreeDiff.payload.propertyPath)) {
                  pathsToBeReEvaluated.push(dependencyPath);
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
          // We only care about dependencies for a widget. This is because in case a dependency of an action changes,
          // that shouldn't trigger an evaluation.
          // Also for a widget, we only care if the difference is in dynamic bindings since static values do not need
          // an evaluation.
          if (
            entityNameAndTypeMap[entityName] === ENTITY_TYPE.WIDGET &&
            typeof dataTreeDiff.payload.value === "string"
          ) {
            didUpdateDependencyMap = true;

            const { jsSnippets } = getDynamicBindings(
              dataTreeDiff.payload.value,
            );
            const correctSnippets = jsSnippets.filter(jsSnippet => !!jsSnippet);
            // We found a new dynamic binding for this property path. We update the dependency map by overwriting the
            // depencies for this property path with the newly found dependencies
            if (correctSnippets.length) {
              this.dependencyMap[
                dataTreeDiff.payload.propertyPath
              ] = correctSnippets;
            } else {
              // The dependency on this property path has been removed. Delete this property path from the global
              // depency map
              delete this.dependencyMap[dataTreeDiff.payload.propertyPath];
            }
          }
          break;
        }
        default: {
          break;
        }
      }
    });
    const diffCalcEnd = performance.now();
    const subDepCalcStart = performance.now();
    if (didUpdateDependencyMap) {
      // TODO Optimise
      Object.keys(this.dependencyMap).forEach(key => {
        this.dependencyMap[key] = _.flatten(
          this.dependencyMap[key].map(path =>
            // TODO : Add comment on whats happening and may be refactor the name to accurately depict the function
            calculateSubDependencies(path, this.allKeys),
          ),
        );
      });
      makeParentsDependOnChildren(this.dependencyMap, dataTree);
    }
    const subDepCalcEnd = performance.now();
    const updateChangedDependenciesStart = performance.now();
    // If the global dependency map has changed, re-calculate the sort order for all entities and the
    // global inverse dependency map
    if (didUpdateDependencyMap) {
      this.sortedDependencies = this.sortDependencies(this.dependencyMap);
      this.inverseDependencyMap = this.getInverseDependencyTree();
    }

    const updateChangedDependenciesStop = performance.now();
    console.log({
      diffCalcDeps: (diffCalcEnd - diffCalcStart).toFixed(2),
      subDepCalc: (subDepCalcEnd - subDepCalcStart).toFixed(2),
      updateChangedDependencies: (
        updateChangedDependenciesStop - updateChangedDependenciesStart
      ).toFixed(2),
    });

    return pathsToBeReEvaluated;
  };

  getInverseDependencyTree = (): DependencyMap => {
    const inverseDag: DependencyMap = {};
    this.sortedDependencies.forEach(propertyPath => {
      const incomingEdges: Array<string> = this.dependencyMap[propertyPath];
      if (incomingEdges) {
        incomingEdges.forEach(edge => {
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
  };

  getPropertyPathReferencesInExistingBindings = (
    dataTree: DataTree,
    propertyPath: string,
  ) => {
    const possibleRefs: DependencyMap = {};
    Object.keys(dataTree).forEach(entityName => {
      const entity = dataTree[entityName];
      if (
        typeof entity === "object" &&
        "ENTITY_TYPE" in entity &&
        (entity.ENTITY_TYPE === ENTITY_TYPE.ACTION ||
          entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET)
      ) {
        const depPaths = this.listEntityDependencies(entity, entityName);
        Object.keys(depPaths).forEach(path => {
          const values = depPaths[path];
          values.forEach(value => {
            // TODO Do regex here.
            if (value.includes(propertyPath)) {
              possibleRefs[path] = values;
            }
          });
        });
      }
    });
    return possibleRefs;
  };

  clearErrors = () => {
    this.errors = [];
  };
}

const getAllPaths = (
  tree: Record<string, any>,
  prefix = "",
): Record<string, true> => {
  return Object.keys(tree).reduce((res: Record<string, true>, el): Record<
    string,
    true
  > => {
    if (Array.isArray(tree[el])) {
      const key = `${prefix}${el}`;
      return { ...res, [key]: true };
    } else if (typeof tree[el] === "object" && tree[el] !== null) {
      const key = `${prefix}${el}`;
      return { ...res, [key]: true, ...getAllPaths(tree[el], `${key}.`) };
    } else {
      const key = `${prefix}${el}`;
      return { ...res, [key]: true };
    }
  }, {});
};

const calculateSubDependencies = (
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

// referencing DATA_BIND_REGEX fails for the value "{{Table1.tableData[Table1.selectedRowIndex]}}" if you run it multiple times and don't recreate
const isDynamicValue = (value: string): boolean => DATA_BIND_REGEX.test(value);

type EvalResult = {
  result: any;
  triggers?: ActionDescription<any>[];
};

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

function isWidget(entity: DataTreeEntity): boolean {
  return (
    typeof entity === "object" &&
    "ENTITY_TYPE" in entity &&
    entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET
  );
}

// We need to remove functions from data tree to avoid any unexpected identifier while JSON parsing
// Check issue https://github.com/appsmithorg/appsmith/issues/719
const removeFunctions = (value: any) => {
  if (_.isFunction(value)) {
    return "Function call";
  } else if (_.isObject(value) && _.some(value, _.isFunction)) {
    return JSON.parse(JSON.stringify(value));
  } else {
    return value;
  }
};

const addFunctions = (dataTree: Readonly<DataTree>): DataTree => {
  const withFunction: DataTree = _.cloneDeep(dataTree);
  withFunction.actionPaths = [];
  Object.keys(withFunction).forEach(entityName => {
    const entity = withFunction[entityName];
    if (
      typeof entity === "object" &&
      "ENTITY_TYPE" in entity &&
      entity.ENTITY_TYPE === ENTITY_TYPE.ACTION
    ) {
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
  ) {
    return {
      type: "NAVIGATE_TO",
      payload: { pageNameOrUrl, params },
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
  return withFunction;
};

const removeFunctionsFromDataTree = (dataTree: DataTree) => {
  dataTree.actionPaths?.forEach(functionPath => {
    _.set(dataTree, functionPath, {});
  });
  delete dataTree.actionPaths;
  return dataTree;
};
