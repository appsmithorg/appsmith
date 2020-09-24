const ctx: Worker = self as any;
import {
  ActionDescription,
  DataTree,
  DataTreeEntity,
  DataTreeWidget,
  ENTITY_TYPE,
} from "../entities/DataTree/dataTreeFactory";
import equal from "fast-deep-equal/es6";
import * as log from "loglevel";
import _ from "lodash";
import toposort from "toposort";
import { DATA_BIND_REGEX } from "../constants/BindingsConstants";
import unescapeJS from "unescape-js";
import { WidgetTypeConfigMap } from "../utils/WidgetFactory";
import { WidgetType } from "../constants/WidgetConstants";
import { WidgetProps } from "../widgets/BaseWidget";
import { VALIDATORS } from "../utils/Validators";
import JSONFn from "json-fn";

let WIDGET_TYPE_CONFIG_MAP: WidgetTypeConfigMap = {};

ctx.addEventListener("message", e => {
  const { dataTree, widgetTypeConfigMap } = JSONFn.parse(e.data);
  WIDGET_TYPE_CONFIG_MAP = widgetTypeConfigMap;
  const response = getEvaluatedDataTree(dataTree);
  ctx.postMessage(JSON.stringify(response));
});

let dependencyTreeCache: any = {};
let cachedDataTreeString = "";

function getEvaluatedDataTree(dataTree: DataTree): DataTree {
  const totalStart = performance.now();
  // Create Dependencies DAG
  const createDepsStart = performance.now();
  const dataTreeString = JSON.stringify(dataTree);
  // Stringify before doing a fast equals because the data tree has functions and fast equal will always treat those as changed values
  // Better solve will be to prune functions
  if (!equal(dataTreeString, cachedDataTreeString)) {
    cachedDataTreeString = dataTreeString;
    dependencyTreeCache = createDependencyTree(dataTree);
  }
  const createDepsEnd = performance.now();
  const {
    dependencyMap,
    sortedDependencies,
    dependencyTree,
  } = dependencyTreeCache;

  // Evaluate Tree
  const evaluatedTreeStart = performance.now();
  const evaluatedTree = dependencySortedEvaluateDataTree(
    dataTree,
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
  return validated;
}

type DynamicDependencyMap = Record<string, Array<string>>;
const createDependencyTree = (
  dataTree: DataTree,
): {
  sortedDependencies: Array<string>;
  dependencyTree: Array<[string, string]>;
  dependencyMap: DynamicDependencyMap;
} => {
  const dependencyMap: DynamicDependencyMap = {};
  const allKeys = getAllPaths(dataTree);
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
        if (entity.dynamicBindings) {
          Object.keys(entity.dynamicBindings).forEach(propertyName => {
            // using unescape to remove new lines from bindings which interfere with our regex extraction
            const unevalPropValue = _.get(entity, propertyName);
            const { jsSnippets } = getDynamicBindings(unevalPropValue);
            const existingDeps =
              dependencyMap[`${entityKey}.${propertyName}`] || [];
            dependencyMap[`${entityKey}.${propertyName}`] = existingDeps.concat(
              jsSnippets.filter(jsSnippet => !!jsSnippet),
            );
          });
        }
        if (entity.dynamicTriggers) {
          Object.keys(entity.dynamicTriggers).forEach(prop => {
            dependencyMap[`${entityKey}.${prop}`] = [];
          });
        }
      }
      if (entity.ENTITY_TYPE === ENTITY_TYPE.ACTION) {
        if (entity.dynamicBindingPathList.length) {
          entity.dynamicBindingPathList.forEach(prop => {
            // using unescape to remove new lines from bindings which interfere with our regex extraction
            const unevalPropValue = _.get(entity, prop.key);
            const { jsSnippets } = getDynamicBindings(unevalPropValue);
            const existingDeps =
              dependencyMap[`${entityKey}.${prop.key}`] || [];
            dependencyMap[`${entityKey}.${prop.key}`] = existingDeps.concat(
              jsSnippets.filter(jsSnippet => !!jsSnippet),
            );
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
    console.error(e);
    // TODO
    // AppToaster.show({
    //   message: e.message,
    //   type: ToastType.ERROR,
    // });
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
    if (identifier in all) {
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

export const setTreeLoading = (
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
            console.error(e);
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
    console.error(e);
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
          "dynamicBindings",
          "dynamicTriggers",
          "dynamicProperties",
          "evaluatedValues",
          "invalidProps",
          "validationMessages",
        ].includes(property);
        const isDynamicField =
          _.has(parsedEntity, `dynamicBindings.${property}`) ||
          _.has(parsedEntity, `dynamicTriggers.${property}`);

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
            const evaluatedValue = _.isUndefined(transformed)
              ? value
              : transformed;
            _.set(parsedEntity, `evaluatedValues.${property}`, evaluatedValue);
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

export const getDynamicBindings = (
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
export function getDynamicStringSegments(dynamicString: string): string[] {
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
export const isDynamicValue = (value: string): boolean =>
  DATA_BIND_REGEX.test(value);

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

export const clearPropertyCache = (propertyPath: string) =>
  parsedValueCache.delete(propertyPath);

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
  const propertyName = propertyPath.split(".")[1];
  let valueToValidate = evalPropertyValue;
  if (widget.dynamicTriggers && propertyName in widget.dynamicTriggers) {
    const { triggers } = getDynamicValue(
      unEvalPropertyValue,
      currentTree,
      undefined,
      true,
    );
    valueToValidate = triggers;
  }
  const { parsed, isValid, message, transformed } = validateWidgetProperty(
    widget.type,
    propertyName,
    valueToValidate,
    widget,
    currentTree,
  );
  const evaluatedValue = _.isUndefined(transformed)
    ? evalPropertyValue
    : transformed;
  _.set(widget, `evaluatedValues.${propertyName}`, evaluatedValue);
  if (!isValid) {
    _.set(widget, `invalidProps.${propertyName}`, true);
    _.set(widget, `validationMessages.${propertyName}`, message);
  }
  if (widget.dynamicTriggers && propertyName in widget.dynamicTriggers) {
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
    const dynamicResult = getDynamicValue(unEvalPropertyValue, currentTree);
    dynamicPropValueCache.set(propertyPath, {
      evaluated: dynamicResult.result,
      unEvaluated: unEvalPropertyValue,
    });
    dependencyCache.set(propertyPath, currentDependencyValues);
    return dynamicResult.result;
  }
}

type EvalResult = {
  result: any;
  triggers?: ActionDescription<any>[];
};
// Paths are expected to have "{name}.{path}" signature
// Also returns any action triggers found after evaluating value
export const evaluateDynamicBoundValue = (
  data: DataTree,
  path: string,
  callbackData?: any,
): EvalResult => {
  const unescapedJS = unescapeJS(path).replace(/(\r\n|\n|\r)/gm, "");
  const scriptToEvaluate = `
        function closedFunction () {
          const result = ${unescapedJS};
          return { result }
        }
        closedFunction()
      `;

  const result = (function() {
    Object.keys(data).forEach(datum => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      self[datum] = data[datum];
    });
    return eval(scriptToEvaluate);
  })();
  return {
    result: result.result,
  };

  return {
    result: "YOYOYOY",
  };
};

// For creating a final value where bindings could be in a template format
export const createDynamicValueString = (
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

export const getDynamicValue = (
  dynamicBinding: string,
  data: DataTree,
  callBackData?: any,
  includeTriggers = false,
): EvalResult => {
  // Get the {{binding}} bound values
  const { stringSegments, jsSnippets } = getDynamicBindings(dynamicBinding);
  if (stringSegments.length) {
    // Get the Data Tree value of those "binding "paths
    const values = jsSnippets.map((jsSnippet, index) => {
      if (jsSnippet) {
        const result = evaluateDynamicBoundValue(data, jsSnippet, callBackData);
        if (includeTriggers) {
          return result;
        } else {
          return { result: result.result };
        }
      } else {
        return { result: stringSegments[index], triggers: [] };
      }
    });

    // if it is just one binding, no need to create template string
    if (stringSegments.length === 1) return values[0];
    // else return a string template with bindings
    const templateString = createDynamicValueString(
      dynamicBinding,
      stringSegments,
      values.map(v => v.result),
    );
    return {
      result: templateString,
    };
  }
  return { result: undefined, triggers: [] };
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
