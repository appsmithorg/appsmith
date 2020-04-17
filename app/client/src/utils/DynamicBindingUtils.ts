import _ from "lodash";
import { WidgetProps } from "widgets/BaseWidget";
import {
  DATA_BIND_REGEX,
  DATA_BIND_REGEX_GLOBAL,
} from "constants/BindingsConstants";
import ValidationFactory from "./ValidationFactory";
import JSExecutionManagerSingleton, {
  JSExecutorResult,
} from "jsExecution/JSExecutionManagerSingleton";
import unescapeJS from "unescape-js";
import toposort from "toposort";
import {
  DataTree,
  DataTreeAction,
  DataTreeEntity,
  DataTreeWidget,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import * as log from "loglevel";
import equal from "fast-deep-equal/es6";
import WidgetFactory from "utils/WidgetFactory";

export const removeBindingsFromObject = (obj: object) => {
  const string = JSON.stringify(obj);
  const withBindings = string.replace(DATA_BIND_REGEX_GLOBAL, "{{ }}");
  return JSON.parse(withBindings);
};
// referencing DATA_BIND_REGEX fails for the value "{{Table1.tableData[Table1.selectedRowIndex]}}" if you run it multiple times and don't recreate
export const isDynamicValue = (value: string): boolean =>
  DATA_BIND_REGEX.test(value);

//{{}}{{}}}
export function parseDynamicString(dynamicString: string): string[] {
  let parsedDynamicValues = [];
  const indexOfDoubleParanStart = dynamicString.indexOf("{{");
  if (indexOfDoubleParanStart === -1) {
    return [dynamicString];
  }
  //{{}}{{}}}
  const firstString = dynamicString.substring(0, indexOfDoubleParanStart);
  firstString && parsedDynamicValues.push(firstString);
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
        parsedDynamicValues.push(rest.substring(0, i + 1));
        rest = rest.substring(i + 1, rest.length);
        if (rest) {
          parsedDynamicValues = parsedDynamicValues.concat(
            parseDynamicString(rest),
          );
          break;
        }
      }
    }
  }
  if (sum !== 0 && dynamicString !== "") {
    return [dynamicString];
  }
  return parsedDynamicValues;
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

export const getDynamicBindings = (
  dynamicString: string,
): { mustaches: string[]; jsSnippets: string[] } => {
  // Protect against bad string parse
  if (!dynamicString || !_.isString(dynamicString)) {
    return { mustaches: [], jsSnippets: [] };
  }
  const sanitisedString = dynamicString.trim();
  // Get the {{binding}} bound values
  const bindings = parseDynamicString(sanitisedString);
  // Get the "binding" path values
  const paths = bindings.map(binding => {
    const length = binding.length;
    const matches = isDynamicValue(binding);
    if (matches) {
      return binding.substring(2, length - 2);
    }
    return "";
  });
  return { mustaches: bindings, jsSnippets: paths };
};

// Paths are expected to have "{name}.{path}" signature
// Also returns any action triggers found after evaluating value
export const evaluateDynamicBoundValue = (
  data: DataTree,
  path: string,
  callbackData?: any,
): JSExecutorResult => {
  const unescapedInput = unescapeJS(path);
  return JSExecutionManagerSingleton.evaluateSync(
    unescapedInput,
    data,
    callbackData,
  );
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
    finalValue = finalValue.replace(b, value);
  });
  return finalValue;
};

export const getDynamicValue = (
  dynamicBinding: string,
  data: DataTree,
  callBackData?: any,
  includeTriggers = false,
): JSExecutorResult => {
  // Get the {{binding}} bound values
  const { mustaches, jsSnippets } = getDynamicBindings(dynamicBinding);
  if (mustaches.length) {
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
        return { result: mustaches[index], triggers: [] };
      }
    });

    // if it is just one binding, no need to create template string
    if (mustaches.length === 1) return values[0];
    // else return a string template with bindings
    const templateString = createDynamicValueString(
      dynamicBinding,
      mustaches,
      values.map(v => v.result),
    );
    return {
      result: templateString,
    };
  }
  return { result: undefined, triggers: [] };
};

export const getValidatedTree = (tree: any) => {
  return Object.keys(tree).reduce((tree, entityKey: string) => {
    const entity = tree[entityKey];
    if (entity && entity.type) {
      const parsedEntity = { ...entity };
      Object.keys(entity).forEach((property: string) => {
        const value = entity[property];
        // Pass it through parse
        const {
          parsed,
          isValid,
          message,
        } = ValidationFactory.validateWidgetProperty(
          entity.type,
          property,
          value,
          entity,
        );
        parsedEntity[property] = parsed;
        if (!isValid) {
          _.set(parsedEntity, `invalidProps.${property}`, true);
          _.set(parsedEntity, `validationMessages.${property}`, message);
        }
      });
      return { ...tree, [entityKey]: parsedEntity };
    }
    return tree;
  }, tree);
};

let dependencyTreeCache: any = {};
let cachedDataTreeString = "";

export function getEvaluatedDataTree(dataTree: DataTree): DataTree {
  const totalStart = performance.now();
  // Create Dependencies DAG
  const createDepsStart = performance.now();
  const dataTreeString = JSON.stringify(dataTree);
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
export const createDependencyTree = (
  dataTree: DataTree,
): {
  sortedDependencies: Array<string>;
  dependencyTree: Array<[string, string]>;
  dependencyMap: DynamicDependencyMap;
} => {
  const dependencyMap: DynamicDependencyMap = {};
  const allKeys = getAllPaths(dataTree);
  Object.keys(dataTree).forEach(entityKey => {
    const entity = dataTree[entityKey] as WidgetProps;
    if (entity && entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET) {
      const defaultProperties = WidgetFactory.getWidgetDefaultPropertiesMap(
        entity.type,
      );
      Object.keys(defaultProperties).forEach(property => {
        dependencyMap[`${entityKey}.${property}`] = [
          `${entityKey}.${defaultProperties[property]}`,
        ];
      });
      if (entity.dynamicBindings) {
        Object.keys(entity.dynamicBindings).forEach(prop => {
          const { jsSnippets } = getDynamicBindings(entity[prop]);
          const existingDeps = dependencyMap[`${entityKey}.${prop}`] || [];
          dependencyMap[`${entityKey}.${prop}`] = existingDeps.concat(
            jsSnippets.filter(jsSnippet => !!jsSnippet),
          );
        });
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
  // sort dependencies and remove empty dependencies
  const sortedDependencies = toposort(dependencyTree)
    .reverse()
    .filter(d => !!d);

  return { sortedDependencies, dependencyMap, dependencyTree };
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
  Object.keys(dataTree)
    .filter(e => {
      const entity = dataTree[e] as DataTreeAction;
      return entity.ENTITY_TYPE === ENTITY_TYPE.ACTION && entity.isLoading;
    })
    .reduce(
      (allEntities: string[], curr) =>
        allEntities.concat(getEntityDependencies(dependencyMap, curr)),
      [],
    )
    .forEach(w => {
      const entity = dataTree[w] as DataTreeWidget;
      entity.isLoading = true;
    });
  return dataTree;
};

export const getEntityDependencies = (
  dependencyMap: Array<[string, string]>,
  entity: string,
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
      keys.forEach(e => {
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

const valueCache: Map<
  string,
  {
    unEvaluated: any;
    evaluated: any;
    version: number;
  }
> = new Map();

const getValueCache = (propertyPath: string) =>
  valueCache.get(propertyPath) || {
    unEvaluated: undefined,
    evaluated: undefined,
    version: 0,
  };

const dependencyCache: Map<string, any[]> = new Map();

export const clearCaches = () => {
  valueCache.clear();
  dependencyCache.clear();
};

export function dependencySortedEvaluateDataTree(
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
        let unEvalPropertyValue = _.get(currentTree as any, propertyPath);
        let evalPropertyValue = unEvalPropertyValue;
        const requiresEval = isDynamicValue(unEvalPropertyValue);
        if (requiresEval) {
          try {
            const propertyDependencies = dependencyMap[propertyPath];
            const currentDependencyValues = propertyDependencies
              ? propertyDependencies
                  .map((path: string) => {
                    //*** Remove current path from data tree because cached value contains evaluated version while this contains unevaluated version */
                    const cleanDataTree = _.omit(currentTree, [propertyPath]);
                    return _.get(cleanDataTree, path);
                  })
                  .filter((data: any) => {
                    return data !== undefined;
                  })
              : [];
            const cachedDependencyValues = dependencyCache.get(propertyPath);
            const cacheObj = getValueCache(propertyPath);
            const isCacheHit =
              cacheObj.version !== 0 &&
              equal(cacheObj.unEvaluated, unEvalPropertyValue) &&
              cachedDependencyValues !== undefined &&
              equal(currentDependencyValues, cachedDependencyValues);
            if (isCacheHit) {
              evalPropertyValue = cacheObj.evaluated;
            } else {
              log.debug("eval " + propertyPath);
              const dynamicResult = getDynamicValue(
                unEvalPropertyValue,
                currentTree,
              );
              evalPropertyValue = dynamicResult.result;
              valueCache.set(propertyPath, {
                evaluated: evalPropertyValue,
                unEvaluated: unEvalPropertyValue,
                version: Date.now(),
              });
              dependencyCache.set(propertyPath, currentDependencyValues);
              evalPropertyValue = dynamicResult.result;
            }
          } catch (e) {
            console.error(e);
            evalPropertyValue = undefined;
            unEvalPropertyValue = undefined;
          }
        } else {
          const currentCache = getValueCache(propertyPath);
          if (!equal(currentCache.evaluated, evalPropertyValue)) {
            valueCache.set(propertyPath, {
              evaluated: evalPropertyValue,
              unEvaluated: currentCache.unEvaluated,
              version: Date.now(),
            });
          }
        }
        if (
          "ENTITY_TYPE" in entity &&
          entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET
        ) {
          const propertyName = propertyPath.split(".")[1];
          evalPropertyValue = overwriteDefaultDependentProps(
            evalPropertyValue,
            propertyName,
            propertyPath,
            entity,
          );
          const {
            parsed,
            isValid,
            message,
          } = ValidationFactory.validateWidgetProperty(
            entity.type,
            propertyName,
            evalPropertyValue,
            entity,
          );
          evalPropertyValue = parsed;
          if (!isValid) {
            _.set(entity, `invalidProps.${propertyName}`, true);
            _.set(entity, `validationMessages.${propertyName}`, message);
          }
        }
        const currentCache = getValueCache(propertyPath);
        if (!equal(currentCache.evaluated, evalPropertyValue)) {
          valueCache.set(propertyPath, {
            evaluated: evalPropertyValue,
            unEvaluated: currentCache.unEvaluated,
            version: Date.now(),
          });
        }
        return _.set(currentTree, propertyPath, evalPropertyValue);
      },
      tree,
    );
  } catch (e) {
    console.error(e);
    return tree;
  }
}

const overwriteDefaultDependentProps = (
  propertyValue: any,
  propertyName: string,
  propertyPath: string,
  entity: DataTreeWidget,
) => {
  const defaultPropertyMap = WidgetFactory.getWidgetDefaultPropertiesMap(
    entity.type,
  );
  const hasDefaultProperty = propertyName in defaultPropertyMap;
  if (hasDefaultProperty) {
    const defaultProperty = defaultPropertyMap[propertyName];
    const defaultPropertyCache = getValueCache(
      `${entity.widgetName}.${defaultProperty}`,
    );
    const propertyCache = getValueCache(propertyPath);
    if (
      propertyValue === undefined ||
      propertyCache.version < defaultPropertyCache.version
    ) {
      return defaultPropertyCache.evaluated;
    }
    return propertyValue;
  }
  return propertyValue;
};
