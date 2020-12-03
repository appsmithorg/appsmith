/* eslint no-restricted-globals: 0 */
import {
  ISO_DATE_FORMAT,
  VALIDATION_TYPES,
  ValidationResponse,
  ValidationType,
  Validator,
} from "../constants/WidgetValidation";
import {
  ActionDescription,
  DataTree,
  DataTreeAction,
  DataTreeEntity,
  DataTreeWidget,
  ENTITY_TYPE,
} from "../entities/DataTree/dataTreeFactory";
import equal from "fast-deep-equal/es6";
import * as log from "loglevel";
import _, {
  every,
  isBoolean,
  isNumber,
  isObject,
  isString,
  isUndefined,
  toNumber,
  toString,
} from "lodash";
import toposort from "toposort";
import { DATA_BIND_REGEX } from "../constants/BindingsConstants";
import unescapeJS from "unescape-js";
import { WidgetTypeConfigMap } from "../utils/WidgetFactory";
import { WidgetType } from "../constants/WidgetConstants";
import { WidgetProps } from "../widgets/BaseWidget";
import { WIDGET_TYPE_VALIDATION_ERROR } from "../constants/messages";
import moment from "moment";
import {
  EVAL_WORKER_ACTIONS,
  EvalError,
  EvalErrorTypes,
  extraLibraries,
  getEntityDynamicBindingPathList,
  getWidgetDynamicTriggerPathList,
  isPathADynamicBinding,
  isPathADynamicTrigger,
} from "../utils/DynamicBindingUtils";
import { diff } from "deep-diff";

const ctx: Worker = self as any;

let ERRORS: EvalError[] = [];
let WIDGET_TYPE_CONFIG_MAP: WidgetTypeConfigMap = {};

ctx.addEventListener("message", e => {
  const { action, ...rest } = e.data;

  switch (action as EVAL_WORKER_ACTIONS) {
    case EVAL_WORKER_ACTIONS.EVAL_TREE: {
      const {
        widgetTypeConfigMap,
        dataTree,
        newUnEvalTree,
        oldUnEvalTree,
      } = rest;
      WIDGET_TYPE_CONFIG_MAP = widgetTypeConfigMap;
      console.log({ rest });
      const response = getEvaluatedDataTree(
        dataTree,
        oldUnEvalTree,
        newUnEvalTree,
      );
      // We need to clean it to remove any possible functions inside the tree.
      // If functions exist, it will crash the web worker
      const cleanDataTree = JSON.stringify(response);
      ctx.postMessage({ dataTree: cleanDataTree, errors: ERRORS });
      ERRORS = [];
      break;
    }
    case EVAL_WORKER_ACTIONS.EVAL_SINGLE: {
      const { binding, dataTree } = rest;
      const withFunctions = addFunctions(dataTree);
      const value = getDynamicValue(binding, withFunctions, false);
      ctx.postMessage({ value, errors: ERRORS });
      ERRORS = [];
      break;
    }
    case EVAL_WORKER_ACTIONS.EVAL_TRIGGER: {
      const { dynamicTrigger, callbackData, dataTree } = rest;
      const evalTree = getEvaluatedDataTree(dataTree, {}, {});
      const withFunctions = addFunctions(evalTree);
      const triggers = getDynamicValue(
        dynamicTrigger,
        withFunctions,
        true,
        callbackData,
      );
      ctx.postMessage({ triggers, errors: ERRORS });
      ERRORS = [];
      break;
    }
    case EVAL_WORKER_ACTIONS.CLEAR_CACHE: {
      clearCaches();
      ctx.postMessage(true);
      break;
    }
    case EVAL_WORKER_ACTIONS.CLEAR_PROPERTY_CACHE: {
      const { propertyPath } = rest;
      clearPropertyCache(propertyPath);
      ctx.postMessage(true);
      break;
    }
    case EVAL_WORKER_ACTIONS.CLEAR_PROPERTY_CACHE_OF_WIDGET: {
      const { widgetName } = rest;
      clearPropertyCacheOfWidget(widgetName);
      ctx.postMessage(true);
      break;
    }
    case EVAL_WORKER_ACTIONS.VALIDATE_PROPERTY: {
      const { widgetType, property, value, props } = rest;
      const result = validateWidgetProperty(widgetType, property, value, props);
      ctx.postMessage(result);
      break;
    }
    default: {
      console.error("Action not registered on worker", action);
    }
  }
});

function getEvaluatedDataTree(
  dataTree: DataTree,
  oldUnEvalTree: DataTree,
  newUnEvalTree: DataTree,
): DataTree {
  const totalStart = performance.now();
  // Add functions to the tre
  const withFunctions = addFunctions(dataTree);
  // Create Dependencies DAG
  const createDepsStart = performance.now();
  const {
    dependencyMap,
    sortedDependencies,
    dependencyTree,
  } = createDependencyTree(newUnEvalTree, oldUnEvalTree);
  const createDepsEnd = performance.now();
  console.log({ dependencyMap, sortedDependencies, dependencyTree });
  // Evaluate Tree
  const evaluatedTreeStart = performance.now();
  const evaluatedTree = dependencySortedEvaluateDataTree(
    withFunctions,
    dependencyMap,
    sortedDependencies,
  );
  const evaluatedTreeEnd = performance.now();

  // Set Loading Widgets
  const loadingTreeStart = performance.now();
  const treeWithLoading = setTreeLoading(evaluatedTree, dependencyTree);
  const loadingTreeEnd = performance.now();

  // Validate Widgets
  const validated = getValidatedTree(treeWithLoading);

  const withoutFunctions = removeFunctionsFromDataTree(validated);

  // End counting total time
  const endStart = performance.now();

  // Log time taken and count
  const timeTaken = {
    total: (endStart - totalStart).toFixed(2),
    createDeps: (createDepsEnd - createDepsStart).toFixed(2),
    evaluate: (evaluatedTreeEnd - evaluatedTreeStart).toFixed(2),
    loading: (loadingTreeEnd - loadingTreeStart).toFixed(2),
  };
  log.debug("data tree evaluated");
  log.debug(timeTaken);
  // dataTreeCache = validated;
  return withoutFunctions;
}

const convertPathToString = (arrPath: Array<string | number>) => {
  let string = "";
  arrPath.forEach(segment => {
    if (typeof segment === "string") {
      if (string.length !== 0) {
        string = string + ".";
      }
      string = string + segment;
    } else {
      string = string + "[" + segment + "]";
    }
  });
  return string;
};

const getUpdatedDynamicBindingDependencies = (
  oldTree: DataTree,
  dataTree: DataTree,
): DynamicDependencyMap => {
  const differences = diff(oldTree, dataTree);
  console.log({ differences });
  if (differences === undefined) {
    return {};
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
  const updatedDags: DynamicDependencyMap = {};

  differences.forEach(difference => {
    if (!difference.path) {
      return;
    }
    const propertyPath = convertPathToString(difference.path);
    const entityName = difference.path[0];
    if (entityNameAndTypeMap[entityName] === "noop") {
      return;
    }
    if (entityNameAndTypeMap[entityName] === ENTITY_TYPE.ACTION) {
      // Handle for action
      return;
    }
    if (entityNameAndTypeMap[entityName] === ENTITY_TYPE.WIDGET) {
      const entity: DataTreeWidget = dataTree[entityName] as DataTreeWidget;
      // New widget was added, add all bindings for this widget
      if (difference.kind === "N" && propertyPath === entityName) {
        const dynamicBindingPathList = getEntityDynamicBindingPathList(entity);
        if (dynamicBindingPathList.length) {
          dynamicBindingPathList.forEach(dynamicPath => {
            const propertyPath = dynamicPath.key;
            const unevalPropValue = _.get(entity, propertyPath);
            const { jsSnippets } = getDynamicBindings(unevalPropValue);
            const existingDeps =
              updatedDags[`${entityName}.${propertyPath}`] || [];
            updatedDags[`${entityName}.${propertyPath}`] = existingDeps.concat(
              jsSnippets.filter(jsSnippet => !!jsSnippet),
            );
          });
        }
      }
      if (difference.kind !== "A") {
        const rhsChange =
          "rhs" in difference &&
          typeof difference.rhs === "string" &&
          isDynamicValue(difference.rhs);
        const lhsChange =
          "lhs" in difference &&
          typeof difference.lhs === "string" &&
          isDynamicValue(difference.lhs);
        if (rhsChange || lhsChange) {
          if ("rhs" in difference) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const { jsSnippets } = getDynamicBindings(difference.rhs);
            updatedDags[propertyPath] = jsSnippets.filter(
              jsSnippet => !!jsSnippet,
            );
          } else {
            updatedDags[propertyPath] = [];
          }
          return;
        }
        return;
      }
    }
  });

  return updatedDags;
};

const getInverseDependencyTree = (
  sortedDependencies: Array<string>,
  dag: DynamicDependencyMap,
): DynamicDependencyMap => {
  const inverseDag: DynamicDependencyMap = {};
  sortedDependencies.forEach(propertyPath => {
    const incomingEdges: Array<string> = dag[propertyPath];
    incomingEdges.forEach(edge => {
      const node = inverseDag[edge];
      if (node) {
        node.push(propertyPath);
      } else {
        inverseDag[edge] = [propertyPath];
      }
    });
  });
  return inverseDag;
};

// const updateInverseDAG = (
//   propertyPath: string,
//   lhsDependencies: Array<string>,
//   rhsDependencies: Array<string>,
//   inverseDag: DynamicDependencyMap,
// ): DynamicDependencyMap => {
//   lhsDependencies.forEach((dependency: string) => {
//     inverseDag[dependency] = inverseDag[dependency].filter(
//       edge => edge === propertyPath,
//     );
//   });
//   rhsDependencies.forEach((dependency: string) => {
//     const incomingEdge = inverseDag[dependency];
//     if (incomingEdge) incomingEdge.push(propertyPath);
//     else inverseDag[dependency] = [propertyPath];
//   });
//   return inverseDag;
// };
//
// const updateInverseDAG = (
//   propertyPath: string,
//   lhsDependencies: Array<string>,
//   rhsDependencies: Array<string>,
//   inverseDag: DynamicDependencyMap,
// ): DynamicDependencyMap => {
//   lhsDependencies.forEach((dependency: string) => {
//     inverseDag[dependency] = inverseDag[dependency].filter(
//       edge => edge === propertyPath,
//     );
//   });
//   rhsDependencies.forEach((dependency: string) => {
//     const incomingEdge = inverseDag[dependency];
//     if (incomingEdge) incomingEdge.push(propertyPath);
//     else inverseDag[dependency] = [propertyPath];
//   });
//   return inverseDag;
// };

const addFunctions = (dataTree: DataTree): DataTree => {
  dataTree.actionPaths = [];
  Object.keys(dataTree).forEach(entityName => {
    const entity = dataTree[entityName];
    if (
      entity &&
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
      _.set(dataTree, `${entityName}.run`, runFunction);
      dataTree.actionPaths && dataTree.actionPaths.push(`${entityName}.run`);
    }
  });
  dataTree.navigateTo = function(
    pageNameOrUrl: string,
    params: Record<string, string>,
  ) {
    return {
      type: "NAVIGATE_TO",
      payload: { pageNameOrUrl, params },
    };
  };
  dataTree.actionPaths.push("navigateTo");

  dataTree.showAlert = function(message: string, style: string) {
    return {
      type: "SHOW_ALERT",
      payload: { message, style },
    };
  };
  dataTree.actionPaths.push("showAlert");

  dataTree.showModal = function(modalName: string) {
    return {
      type: "SHOW_MODAL_BY_NAME",
      payload: { modalName },
    };
  };
  dataTree.actionPaths.push("showModal");

  dataTree.closeModal = function(modalName: string) {
    return {
      type: "CLOSE_MODAL",
      payload: { modalName },
    };
  };
  dataTree.actionPaths.push("closeModal");

  dataTree.storeValue = function(key: string, value: string) {
    return {
      type: "STORE_VALUE",
      payload: { key, value },
    };
  };
  dataTree.actionPaths.push("storeValue");

  dataTree.download = function(data: string, name: string, type: string) {
    return {
      type: "DOWNLOAD",
      payload: { data, name, type },
    };
  };
  dataTree.actionPaths.push("download");
  return dataTree;
};

const removeFunctionsFromDataTree = (dataTree: DataTree) => {
  dataTree.actionPaths?.forEach(functionPath => {
    _.set(dataTree, functionPath, {});
  });
  delete dataTree.actionPaths;
  return dataTree;
};

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

type DynamicDependencyMap = Record<string, Array<string>>;
const createDependencyTree = (
  dataTree: DataTree,
  oldTree: DataTree,
): {
  sortedDependencies: Array<string>;
  dependencyTree: Array<[string, string]>;
  dependencyMap: DynamicDependencyMap;
} => {
  let dependencyMap: DynamicDependencyMap = {};
  const allKeys = getAllPaths(dataTree);
  // Calculate diff
  dependencyMap = getUpdatedDynamicBindingDependencies(oldTree, dataTree);
  // Add dependent properties based on updated dag
  console.log({ dependencyMap });
  Object.keys(dataTree).forEach(entityKey => {
    const entity = dataTree[entityKey];
    if (entity && "ENTITY_TYPE" in entity) {
      if (entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET) {
        // Set default property dependency
        const defaultProperties =
          WIDGET_TYPE_CONFIG_MAP[entity.type].defaultProperties;
        Object.keys(defaultProperties).forEach(property => {
          dependencyMap[`${entityKey}.${property}`] = [
            `${entityKey}.${defaultProperties[property]}`,
          ];
        });
        // Set triggers. TODO check if needed
        const dynamicTriggerPathList = getWidgetDynamicTriggerPathList(entity);
        if (dynamicTriggerPathList.length) {
          dynamicTriggerPathList.forEach(dynamicPath => {
            dependencyMap[`${entityKey}.${dynamicPath.key}`] = [];
          });
        }
      }
    }
  });
  Object.keys(dependencyMap).forEach(key => {
    dependencyMap[key] = _.flatten(
      dependencyMap[key].map(path => calculateSubDependencies(path, allKeys)),
    );
  });
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
    const sortedDependencies = toposort(dependencyTree)
      .reverse()
      .filter(d => !!d);

    return { sortedDependencies, dependencyMap, dependencyTree };
  } catch (e) {
    ERRORS.push({
      type: EvalErrorTypes.DEPENDENCY_ERROR,
      message: e.message,
    });
    return { sortedDependencies: [], dependencyMap: {}, dependencyTree: [] };
  }
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

const setTreeLoading = (
  dataTree: DataTree,
  dependencyMap: Array<[string, string]>,
) => {
  const widgets: string[] = [];
  const isLoadingActions: string[] = [];

  // Fetch all actions that are in loading state
  Object.keys(dataTree).forEach(e => {
    const entity = dataTree[e];
    if (entity && "ENTITY_TYPE" in entity) {
      if (entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET) {
        widgets.push(e);
      } else if (
        entity.ENTITY_TYPE === ENTITY_TYPE.ACTION &&
        entity.isLoading
      ) {
        isLoadingActions.push(e);
      }
    }
  });

  // get all widget dependencies of those actions
  isLoadingActions
    .reduce(
      (allEntities: string[], curr) =>
        allEntities.concat(getEntityDependencies(dependencyMap, curr, widgets)),
      [],
    )
    // set loading to true for those widgets
    .forEach(w => {
      const entity = dataTree[w] as DataTreeWidget;
      entity.isLoading = true;
    });
  return dataTree;
};

const getEntityDependencies = (
  dependencyMap: Array<[string, string]>,
  entity: string,
  entities: string[],
): Array<string> => {
  const entityDeps: Record<string, string[]> = dependencyMap
    .map(d => [d[1].split(".")[0], d[0].split(".")[0]])
    .filter(d => d[0] !== d[1])
    .reduce((deps: Record<string, string[]>, dep) => {
      const key: string = dep[0];
      const value: string = dep[1];
      return {
        ...deps,
        [key]: deps[key] ? deps[key].concat(value) : [value],
      };
    }, {});

  if (entity in entityDeps) {
    const recFind = (
      keys: Array<string>,
      deps: Record<string, string[]>,
    ): Array<string> => {
      let allDeps: string[] = [];
      keys
        .filter(k => entities.includes(k))
        .forEach(e => {
          allDeps = allDeps.concat([e]);
          if (e in deps) {
            allDeps = allDeps.concat([...recFind(deps[e], deps)]);
          }
        });
      return allDeps;
    };
    return recFind(entityDeps[entity], entityDeps);
  }
  return [];
};

function dependencySortedEvaluateDataTree(
  dataTree: DataTree,
  dependencyMap: DynamicDependencyMap,
  sortedDependencies: Array<string>,
): DataTree {
  const tree = _.cloneDeep(dataTree);
  try {
    return sortedDependencies.reduce(
      (currentTree: DataTree, propertyPath: string) => {
        const entityName = propertyPath.split(".")[0];
        const entity: DataTreeEntity = currentTree[entityName];
        const unEvalPropertyValue = _.get(currentTree as any, propertyPath);
        let evalPropertyValue;
        const propertyDependencies = dependencyMap[propertyPath];
        const currentDependencyValues = getCurrentDependencyValues(
          propertyDependencies,
          currentTree,
          propertyPath,
        );
        const cachedDependencyValues = dependencyCache.get(propertyPath);
        const requiresEval = isDynamicValue(unEvalPropertyValue);
        if (requiresEval) {
          try {
            evalPropertyValue = evaluateDynamicProperty(
              propertyPath,
              currentTree,
              unEvalPropertyValue,
              currentDependencyValues,
              cachedDependencyValues,
            );
          } catch (e) {
            ERRORS.push({
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
          // If we have stored any previous dependency cache, clear it
          // since it is no longer a binding
          if (cachedDependencyValues && cachedDependencyValues.length) {
            dependencyCache.set(propertyPath, []);
          }
        }
        if (isWidget(entity)) {
          const widgetEntity: DataTreeWidget = entity as DataTreeWidget;
          const propertyName = propertyPath.split(".")[1];
          if (propertyName) {
            let parsedValue = validateAndParseWidgetProperty(
              propertyPath,
              widgetEntity,
              currentTree,
              evalPropertyValue,
              unEvalPropertyValue,
              currentDependencyValues,
              cachedDependencyValues,
            );
            const defaultPropertyMap =
              WIDGET_TYPE_CONFIG_MAP[widgetEntity.type].defaultProperties;
            const hasDefaultProperty = propertyName in defaultPropertyMap;
            if (hasDefaultProperty) {
              const defaultProperty = defaultPropertyMap[propertyName];
              parsedValue = overwriteDefaultDependentProps(
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
    ERRORS.push({
      type: EvalErrorTypes.EVAL_TREE_ERROR,
      message: e.message,
    });
    return tree;
  }
}

const overwriteDefaultDependentProps = (
  defaultProperty: string,
  propertyValue: any,
  propertyPath: string,
  entity: DataTreeWidget,
) => {
  const defaultPropertyCache = getParsedValueCache(
    `${entity.widgetName}.${defaultProperty}`,
  );
  const propertyCache = getParsedValueCache(propertyPath);

  if (
    propertyValue === undefined ||
    propertyCache.version < defaultPropertyCache.version
  ) {
    return defaultPropertyCache.value;
  }
  return propertyValue;
};

const getValidatedTree = (tree: any) => {
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
          } = validateWidgetProperty(
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

          const hasValidation = _.has(parsedEntity, `invalidProps.${property}`);
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

const getDynamicBindings = (
  dynamicString: string,
): { stringSegments: string[]; jsSnippets: string[] } => {
  // Protect against bad string parse
  if (!dynamicString || !_.isString(dynamicString)) {
    return { stringSegments: [], jsSnippets: [] };
  }
  const sanitisedString = dynamicString.trim();
  // Get the {{binding}} bound values
  const stringSegments = getDynamicStringSegments(sanitisedString);
  // Get the "binding" path values
  const paths = stringSegments.map(segment => {
    const length = segment.length;
    const matches = isDynamicValue(segment);
    if (matches) {
      return segment.substring(2, length - 2);
    }
    return "";
  });
  return { stringSegments: stringSegments, jsSnippets: paths };
};

//{{}}{{}}}
function getDynamicStringSegments(dynamicString: string): string[] {
  let stringSegments = [];
  const indexOfDoubleParanStart = dynamicString.indexOf("{{");
  if (indexOfDoubleParanStart === -1) {
    return [dynamicString];
  }
  //{{}}{{}}}
  const firstString = dynamicString.substring(0, indexOfDoubleParanStart);
  firstString && stringSegments.push(firstString);
  let rest = dynamicString.substring(
    indexOfDoubleParanStart,
    dynamicString.length,
  );
  //{{}}{{}}}
  let sum = 0;
  for (let i = 0; i <= rest.length - 1; i++) {
    const char = rest[i];
    const prevChar = rest[i - 1];

    if (char === "{") {
      sum++;
    } else if (char === "}") {
      sum--;
      if (prevChar === "}" && sum === 0) {
        stringSegments.push(rest.substring(0, i + 1));
        rest = rest.substring(i + 1, rest.length);
        if (rest) {
          stringSegments = stringSegments.concat(
            getDynamicStringSegments(rest),
          );
          break;
        }
      }
    }
  }
  if (sum !== 0 && dynamicString !== "") {
    return [dynamicString];
  }
  return stringSegments;
}

// referencing DATA_BIND_REGEX fails for the value "{{Table1.tableData[Table1.selectedRowIndex]}}" if you run it multiple times and don't recreate
const isDynamicValue = (value: string): boolean => DATA_BIND_REGEX.test(value);

function getCurrentDependencyValues(
  propertyDependencies: Array<string>,
  currentTree: DataTree,
  currentPropertyPath: string,
): Array<string> {
  return propertyDependencies
    ? propertyDependencies
        .map((path: string) => {
          //*** Remove current path from data tree because cached value contains evaluated version while this contains unevaluated version */
          const cleanDataTree = _.omit(currentTree, [currentPropertyPath]);
          return _.get(cleanDataTree, path);
        })
        .filter((data: any) => {
          return data !== undefined;
        })
    : [];
}

const dynamicPropValueCache: Map<
  string,
  {
    unEvaluated: any;
    evaluated: any;
  }
> = new Map();

const parsedValueCache: Map<
  string,
  {
    value: any;
    version: number;
  }
> = new Map();

const getDynamicPropValueCache = (propertyPath: string) =>
  dynamicPropValueCache.get(propertyPath);

const getParsedValueCache = (propertyPath: string) =>
  parsedValueCache.get(propertyPath) || {
    value: undefined,
    version: 0,
  };

const clearPropertyCache = (propertyPath: string) =>
  parsedValueCache.delete(propertyPath);

/**
 * delete all values of a particular widget
 *
 * @param propertyPath
 */
export const clearPropertyCacheOfWidget = (widgetName: string) => {
  parsedValueCache.forEach((value, key) => {
    const match = key.match(`${widgetName}.`);

    if (match) return parsedValueCache.delete(key);
  });
};

const dependencyCache: Map<string, any[]> = new Map();

function isWidget(entity: DataTreeEntity): boolean {
  return "ENTITY_TYPE" in entity && entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET;
}

function validateAndParseWidgetProperty(
  propertyPath: string,
  widget: DataTreeWidget,
  currentTree: DataTree,
  evalPropertyValue: any,
  unEvalPropertyValue: string,
  currentDependencyValues: Array<string>,
  cachedDependencyValues?: Array<string>,
): any {
  const entityPropertyName = _.drop(propertyPath.split(".")).join(".");
  let valueToValidate = evalPropertyValue;
  if (isPathADynamicTrigger(widget, propertyPath)) {
    const { triggers } = getDynamicValue(
      unEvalPropertyValue,
      currentTree,
      true,
      undefined,
    );
    valueToValidate = triggers;
  }
  const { parsed, isValid, message, transformed } = validateWidgetProperty(
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
  }

  if (isPathADynamicTrigger(widget, entityPropertyName)) {
    return unEvalPropertyValue;
  } else {
    const parsedCache = getParsedValueCache(propertyPath);
    if (
      !equal(parsedCache.value, parsed) ||
      (cachedDependencyValues !== undefined &&
        !equal(currentDependencyValues, cachedDependencyValues))
    ) {
      parsedValueCache.set(propertyPath, {
        value: parsed,
        version: Date.now(),
      });
    }
    return parsed;
  }
}

function evaluateDynamicProperty(
  propertyPath: string,
  currentTree: DataTree,
  unEvalPropertyValue: any,
  currentDependencyValues: Array<string>,
  cachedDependencyValues?: Array<string>,
): any {
  const cacheObj = getDynamicPropValueCache(propertyPath);
  const isCacheHit =
    cacheObj &&
    equal(cacheObj.unEvaluated, unEvalPropertyValue) &&
    cachedDependencyValues !== undefined &&
    equal(currentDependencyValues, cachedDependencyValues);
  if (isCacheHit && cacheObj) {
    return cacheObj.evaluated;
  } else {
    log.debug("eval " + propertyPath);
    const dynamicResult = getDynamicValue(
      unEvalPropertyValue,
      currentTree,
      false,
    );
    dynamicPropValueCache.set(propertyPath, {
      evaluated: dynamicResult,
      unEvaluated: unEvalPropertyValue,
    });
    dependencyCache.set(propertyPath, currentDependencyValues);
    return dynamicResult;
  }
}

type EvalResult = {
  result: any;
  triggers?: ActionDescription<any>[];
};
// Paths are expected to have "{name}.{path}" signature
// Also returns any action triggers found after evaluating value
const evaluateDynamicBoundValue = (
  data: DataTree,
  path: string,
  callbackData?: Array<any>,
): EvalResult => {
  try {
    const unescapedJS = unescapeJS(path).replace(/(\r\n|\n|\r)/gm, "");
    return evaluate(unescapedJS, data, callbackData);
  } catch (e) {
    ERRORS.push({
      type: EvalErrorTypes.UNESCAPE_STRING_ERROR,
      message: e.message,
      context: {
        path,
      },
    });
    return { result: undefined, triggers: [] };
  }
};

const evaluate = (
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
    ERRORS.push({
      type: EvalErrorTypes.EVAL_ERROR,
      message: e.message,
      context: {
        binding: js,
      },
    });
    return { result: undefined, triggers: [] };
  }
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

const getDynamicValue = (
  dynamicBinding: string,
  data: DataTree,
  returnTriggers: boolean,
  callBackData?: Array<any>,
) => {
  // Get the {{binding}} bound values
  const { stringSegments, jsSnippets } = getDynamicBindings(dynamicBinding);
  if (returnTriggers) {
    const result = evaluateDynamicBoundValue(data, jsSnippets[0], callBackData);
    return result.triggers;
  }
  if (stringSegments.length) {
    // Get the Data Tree value of those "binding "paths
    const values = jsSnippets.map((jsSnippet, index) => {
      if (jsSnippet) {
        const result = evaluateDynamicBoundValue(data, jsSnippet, callBackData);
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
};

const validateWidgetProperty = (
  widgetType: WidgetType,
  property: string,
  value: any,
  props: WidgetProps,
  dataTree?: DataTree,
) => {
  const propertyValidationTypes =
    WIDGET_TYPE_CONFIG_MAP[widgetType].validations;
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

const clearCaches = () => {
  dynamicPropValueCache.clear();
  dependencyCache.clear();
  parsedValueCache.clear();
};

const VALIDATORS: Record<ValidationType, Validator> = {
  [VALIDATION_TYPES.TEXT]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    let parsed = value;
    if (isUndefined(value) || value === null) {
      return {
        isValid: true,
        parsed: value,
        message: "",
      };
    }
    if (isObject(value)) {
      return {
        isValid: false,
        parsed: JSON.stringify(value, null, 2),
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: text`,
      };
    }
    let isValid = isString(value);
    if (!isValid) {
      try {
        parsed = toString(value);
        isValid = true;
      } catch (e) {
        console.error(`Error when parsing ${value} to string`);
        console.error(e);
        return {
          isValid: false,
          parsed: "",
          message: `${WIDGET_TYPE_VALIDATION_ERROR}: text`,
        };
      }
    }
    return { isValid, parsed };
  },
  [VALIDATION_TYPES.REGEX]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const { isValid, parsed, message } = VALIDATORS[VALIDATION_TYPES.TEXT](
      value,
      props,
      dataTree,
    );

    if (isValid) {
      try {
        new RegExp(parsed);
      } catch (e) {
        return {
          isValid: false,
          parsed: parsed,
          message: `${WIDGET_TYPE_VALIDATION_ERROR}: regex`,
        };
      }
    }

    return { isValid, parsed, message };
  },
  [VALIDATION_TYPES.NUMBER]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    let parsed = value;
    if (isUndefined(value)) {
      return {
        isValid: false,
        parsed: 0,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: number`,
      };
    }
    let isValid = isNumber(value);
    if (!isValid) {
      try {
        parsed = toNumber(value);
        if (isNaN(parsed)) {
          return {
            isValid: false,
            parsed: 0,
            message: `${WIDGET_TYPE_VALIDATION_ERROR}: number`,
          };
        }
        isValid = true;
      } catch (e) {
        console.error(`Error when parsing ${value} to number`);
        console.error(e);
        return {
          isValid: false,
          parsed: 0,
          message: `${WIDGET_TYPE_VALIDATION_ERROR}: number`,
        };
      }
    }
    return { isValid, parsed };
  },
  [VALIDATION_TYPES.BOOLEAN]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    let parsed = value;
    if (isUndefined(value)) {
      return {
        isValid: false,
        parsed: false,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: boolean`,
      };
    }
    const isABoolean = isBoolean(value);
    const isStringTrueFalse = value === "true" || value === "false";
    const isValid = isABoolean || isStringTrueFalse;
    if (isStringTrueFalse) parsed = value !== "false";
    if (!isValid) {
      return {
        isValid: isValid,
        parsed: parsed,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: boolean`,
      };
    }
    return { isValid, parsed };
  },
  [VALIDATION_TYPES.OBJECT]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    let parsed = value;
    if (isUndefined(value)) {
      return {
        isValid: false,
        parsed: {},
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Object`,
      };
    }
    let isValid = isObject(value);
    if (!isValid) {
      try {
        parsed = JSON.parse(value);
        isValid = true;
      } catch (e) {
        console.error(`Error when parsing ${value} to object`);
        console.error(e);
        return {
          isValid: false,
          parsed: {},
          message: `${WIDGET_TYPE_VALIDATION_ERROR}: Object`,
        };
      }
    }
    return { isValid, parsed };
  },
  [VALIDATION_TYPES.ARRAY]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    let parsed = value;
    try {
      if (isUndefined(value)) {
        return {
          isValid: false,
          parsed: [],
          transformed: undefined,
          message: `${WIDGET_TYPE_VALIDATION_ERROR}: Array/List`,
        };
      }
      if (isString(value)) {
        parsed = JSON.parse(parsed as string);
      }
      if (!Array.isArray(parsed)) {
        return {
          isValid: false,
          parsed: [],
          transformed: parsed,
          message: `${WIDGET_TYPE_VALIDATION_ERROR}: Array/List`,
        };
      }
      return { isValid: true, parsed, transformed: parsed };
    } catch (e) {
      console.error(e);
      return {
        isValid: false,
        parsed: [],
        transformed: parsed,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Array/List`,
      };
    }
  },
  [VALIDATION_TYPES.TABS_DATA]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const { isValid, parsed } = VALIDATORS[VALIDATION_TYPES.ARRAY](
      value,
      props,
      dataTree,
    );
    if (!isValid) {
      return {
        isValid,
        parsed,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Tabs Data`,
      };
    } else if (!every(parsed, datum => isObject(datum))) {
      return {
        isValid: false,
        parsed: [],
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Tabs Data`,
      };
    }
    return { isValid, parsed };
  },
  [VALIDATION_TYPES.TABLE_DATA]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const { isValid, transformed, parsed } = VALIDATORS.ARRAY(
      value,
      props,
      dataTree,
    );
    if (!isValid) {
      return {
        isValid,
        parsed: [],
        transformed,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: [{ "Col1" : "val1", "Col2" : "val2" }]`,
      };
    }
    const isValidTableData = every(parsed, datum => {
      return (
        isObject(datum) &&
        Object.keys(datum).filter(key => isString(key) && key.length === 0)
          .length === 0
      );
    });
    if (!isValidTableData) {
      return {
        isValid: false,
        parsed: [],
        transformed,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: [{ "Col1" : "val1", "Col2" : "val2" }]`,
      };
    }
    return { isValid, parsed };
  },
  [VALIDATION_TYPES.CHART_DATA]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const { isValid, parsed } = VALIDATORS[VALIDATION_TYPES.ARRAY](
      value,
      props,
      dataTree,
    );
    if (!isValid) {
      return {
        isValid,
        parsed,
        transformed: parsed,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Chart Data`,
      };
    }
    let validationMessage = "";
    let index = 0;
    const isValidChartData = every(
      parsed,
      (datum: { name: string; data: any }) => {
        const validatedResponse: {
          isValid: boolean;
          parsed: Array<unknown>;
          message?: string;
        } = VALIDATORS[VALIDATION_TYPES.ARRAY](datum.data, props, dataTree);
        validationMessage = `${index}##${WIDGET_TYPE_VALIDATION_ERROR}: [{ "x": "val", "y": "val" }]`;
        let isValidChart = validatedResponse.isValid;
        if (validatedResponse.isValid) {
          datum.data = validatedResponse.parsed;
          isValidChart = every(
            datum.data,
            (chartPoint: { x: string; y: any }) => {
              return (
                isObject(chartPoint) &&
                isString(chartPoint.x) &&
                !isUndefined(chartPoint.y)
              );
            },
          );
        }
        index++;
        return isValidChart;
      },
    );
    if (!isValidChartData) {
      return {
        isValid: false,
        parsed: [],
        transformed: parsed,
        message: validationMessage,
      };
    }
    return { isValid, parsed, transformed: parsed };
  },
  [VALIDATION_TYPES.MARKERS]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const { isValid, parsed } = VALIDATORS[VALIDATION_TYPES.ARRAY](
      value,
      props,
      dataTree,
    );
    if (!isValid) {
      return {
        isValid,
        parsed,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Marker Data`,
      };
    } else if (!every(parsed, datum => isObject(datum))) {
      return {
        isValid: false,
        parsed: [],
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Marker Data`,
      };
    }
    return { isValid, parsed };
  },
  [VALIDATION_TYPES.OPTIONS_DATA]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const { isValid, parsed } = VALIDATORS[VALIDATION_TYPES.ARRAY](
      value,
      props,
      dataTree,
    );
    if (!isValid) {
      return {
        isValid,
        parsed,
        message: `${WIDGET_TYPE_VALIDATION_ERROR}: Options Data`,
      };
    }
    try {
      const isValidOption = (option: { label: any; value: any }) =>
        _.isObject(option) &&
        _.isString(option.label) &&
        _.isString(option.value) &&
        !_.isEmpty(option.label) &&
        !_.isEmpty(option.value);

      const hasOptions = every(parsed, isValidOption);
      const validOptions = parsed.filter(isValidOption);
      const uniqValidOptions = _.uniqBy(validOptions, "value");

      if (!hasOptions || uniqValidOptions.length !== validOptions.length) {
        return {
          isValid: false,
          parsed: uniqValidOptions,
          message: `${WIDGET_TYPE_VALIDATION_ERROR}: Options Data`,
        };
      }
      return { isValid, parsed };
    } catch (e) {
      console.error(e);
      return {
        isValid: false,
        parsed: [],
        transformed: parsed,
      };
    }
  },
  [VALIDATION_TYPES.DATE]: (
    dateString: string,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const today = moment()
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0);
    const dateFormat = props.dateFormat ? props.dateFormat : ISO_DATE_FORMAT;

    const todayDateString = today.format(dateFormat);
    if (dateString === undefined) {
      return {
        isValid: false,
        parsed: "",
        message:
          `${WIDGET_TYPE_VALIDATION_ERROR}: Date ` + props.dateFormat
            ? props.dateFormat
            : "",
      };
    }
    const isValid = moment(dateString, dateFormat).isValid();
    const parsed = isValid ? dateString : todayDateString;
    return {
      isValid,
      parsed,
      message: isValid ? "" : `${WIDGET_TYPE_VALIDATION_ERROR}: Date`,
    };
  },
  [VALIDATION_TYPES.DEFAULT_DATE]: (
    dateString: string,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const today = moment()
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0);
    const dateFormat = props.dateFormat ? props.dateFormat : ISO_DATE_FORMAT;

    const todayDateString = today.format(dateFormat);
    if (dateString === undefined) {
      return {
        isValid: false,
        parsed: "",
        message:
          `${WIDGET_TYPE_VALIDATION_ERROR}: Date ` + props.dateFormat
            ? props.dateFormat
            : "",
      };
    }
    const parsedCurrentDate = moment(dateString, dateFormat);
    let isValid = parsedCurrentDate.isValid();
    const parsedMinDate = moment(props.minDate, dateFormat);
    const parsedMaxDate = moment(props.maxDate, dateFormat);

    // checking for max/min date range
    if (isValid) {
      if (
        parsedMinDate.isValid() &&
        parsedCurrentDate.isBefore(parsedMinDate)
      ) {
        isValid = false;
      }

      if (
        isValid &&
        parsedMaxDate.isValid() &&
        parsedCurrentDate.isAfter(parsedMaxDate)
      ) {
        isValid = false;
      }
    }

    const parsed = isValid ? dateString : todayDateString;

    return {
      isValid,
      parsed,
      message: isValid ? "" : `${WIDGET_TYPE_VALIDATION_ERROR}: Date R`,
    };
  },
  [VALIDATION_TYPES.ACTION_SELECTOR]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    if (Array.isArray(value) && value.length) {
      return {
        isValid: true,
        parsed: undefined,
        transformed: "Function Call",
      };
    }
    /*
    if (_.isString(value)) {
      if (value.indexOf("navigateTo") !== -1) {
        const pageNameOrUrl = modalGetter(value);
        if (dataTree) {
          if (isDynamicValue(pageNameOrUrl)) {
            return {
              isValid: true,
              parsed: value,
            };
          }
          const isPage =
            (dataTree.pageList as PageListPayload).findIndex(
              page => page.pageName === pageNameOrUrl,
            ) !== -1;
          const isValidUrl = URL_REGEX.test(pageNameOrUrl);
          if (!(isValidUrl || isPage)) {
            return {
              isValid: false,
              parsed: value,
              message: `${NAVIGATE_TO_VALIDATION_ERROR}`,
            };
          }
        }
      }
    }
    */
    return {
      isValid: false,
      parsed: undefined,
      transformed: "undefined",
      message: "Not a function call",
    };
  },
  [VALIDATION_TYPES.ARRAY_ACTION_SELECTOR]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const { isValid, parsed, message } = VALIDATORS[VALIDATION_TYPES.ARRAY](
      value,
      props,
      dataTree,
    );
    let isValidFinal = isValid;
    let finalParsed = parsed.slice();
    if (isValid) {
      finalParsed = parsed.map((value: any) => {
        const { isValid, message } = VALIDATORS[
          VALIDATION_TYPES.ACTION_SELECTOR
        ](value.dynamicTrigger, props, dataTree);

        isValidFinal = isValidFinal && isValid;
        return {
          ...value,
          message: message,
          isValid: isValid,
        };
      });
    }

    return {
      isValid: isValidFinal,
      parsed: finalParsed,
      message: message,
    };
  },
  [VALIDATION_TYPES.SELECTED_TAB]: (
    value: any,
    props: WidgetProps,
    dataTree?: DataTree,
  ): ValidationResponse => {
    const tabs =
      props.tabs && isString(props.tabs)
        ? JSON.parse(props.tabs)
        : props.tabs && Array.isArray(props.tabs)
        ? props.tabs
        : [];
    const tabNames = tabs.map((i: { label: string; id: string }) => i.label);
    const isValidTabName = tabNames.includes(value);
    return {
      isValid: isValidTabName,
      parsed: value,
      message: isValidTabName
        ? ""
        : `${WIDGET_TYPE_VALIDATION_ERROR}: Invalid tab name.`,
    };
  },
  [VALIDATION_TYPES.DEFAULT_OPTION_VALUE]: (
    value: string | string[],
    props: WidgetProps,
    dataTree?: DataTree,
  ) => {
    let values = value;

    if (props) {
      if (props.selectionType === "SINGLE_SELECT") {
        return VALIDATORS[VALIDATION_TYPES.TEXT](value, props, dataTree);
      } else if (props.selectionType === "MULTI_SELECT") {
        if (typeof value === "string") {
          try {
            values = JSON.parse(value);
            if (!Array.isArray(values)) {
              throw new Error();
            }
          } catch {
            values = value.length ? value.split(",") : [];
            if (values.length > 0) {
              values = values.map(value => value.trim());
            }
          }
        }
      }
    }

    if (Array.isArray(values)) {
      values = _.uniq(values);
    }

    return {
      isValid: true,
      parsed: values,
    };
  },
  [VALIDATION_TYPES.DEFAULT_SELECTED_ROW]: (
    value: string | string[],
    props: WidgetProps,
    dataTree?: DataTree,
  ) => {
    let values = value;

    if (props) {
      if (props.multiRowSelection) {
        if (typeof value === "string") {
          try {
            values = JSON.parse(value);
            if (!Array.isArray(values)) {
              throw new Error();
            }
          } catch {
            values = value.length ? value.split(",") : [];
            if (values.length > 0) {
              let numbericValues = values.map(value => {
                return isNumber(value.trim()) ? -1 : Number(value.trim());
              });
              numbericValues = _.uniq(numbericValues);
              return {
                isValid: true,
                parsed: numbericValues,
              };
            }
          }
        }
      } else {
        try {
          const parsed = toNumber(value);
          return {
            isValid: true,
            parsed: parsed,
          };
        } catch (e) {
          return {
            isValid: true,
            parsed: -1,
          };
        }
      }
    }
    return {
      isValid: true,
      parsed: values,
    };
  },
};
