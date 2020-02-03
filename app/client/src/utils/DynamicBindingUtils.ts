import _ from "lodash";
import { WidgetProps } from "widgets/BaseWidget";
import { DATA_BIND_REGEX } from "constants/BindingsConstants";
import ValidationFactory from "./ValidationFactory";
import JSExecutionManagerSingleton from "jsExecution/JSExecutionManagerSingleton";
import unescapeJS from "unescape-js";
import { NameBindingsWithData } from "selectors/nameBindingsWithDataSelector";
import toposort from "toposort";
import { ENTITY_TYPE_ACTION } from "constants/entityConstants";

export const removeBindingsFromObject = (obj: object) => {
  const string = JSON.stringify(obj);
  const withBindings = string.replace(DATA_BIND_REGEX, "{{ }}");
  return JSON.parse(withBindings);
};

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
): { bindings: string[]; paths: string[] } => {
  if (!dynamicString) return { bindings: [], paths: [] };
  const sanitisedString = dynamicString.trim();
  // Get the {{binding}} bound values
  const bindings = parseDynamicString(sanitisedString);
  // Get the "binding" path values
  const paths = bindings.map(binding => {
    const length = binding.length;
    const matches = binding.match(DATA_BIND_REGEX);
    if (matches) {
      return binding.substring(2, length - 2);
    }
    return "";
  });
  return { bindings, paths };
};

// Paths are expected to have "{name}.{path}" signature
export const evaluateDynamicBoundValue = (
  data: NameBindingsWithData,
  path: string,
): any => {
  const unescapedInput = unescapeJS(path);
  return JSExecutionManagerSingleton.evaluateSync(unescapedInput, data);
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
  data: NameBindingsWithData,
): any => {
  // Get the {{binding}} bound values
  const { bindings, paths } = getDynamicBindings(dynamicBinding);
  if (bindings.length) {
    // Get the Data Tree value of those "binding "paths
    const values = paths.map((p, i) => {
      if (p) {
        return evaluateDynamicBoundValue(data, p);
      } else {
        return bindings[i];
      }
    });

    // if it is just one binding, no need to create template string
    if (bindings.length === 1) return values[0];
    // else return a string template with bindings
    return createDynamicValueString(dynamicBinding, bindings, values);
  }
  return undefined;
};

export const enhanceWidgetWithValidations = (
  widget: WidgetProps,
): WidgetProps => {
  if (!widget) return widget;
  const properties = { ...widget };
  const invalidProps: Record<string, boolean> = {};
  const validationMessages: Record<string, string> = {};
  Object.keys(properties).forEach((property: string) => {
    const value = properties[property];
    // Pass it through validation and parse
    const { isValid, message } = ValidationFactory.validateWidgetProperty(
      widget.type,
      property,
      value,
    );
    // Store all invalid props
    if (!isValid) invalidProps[property] = true;
    // Store validation Messages
    if (message) validationMessages[property] = message;
  });
  return {
    ...properties,
    invalidProps,
    validationMessages,
  };
};

export const getParsedTree = (tree: any) => {
  return Object.keys(tree).reduce((tree, entityKey: string) => {
    const entity = tree[entityKey];
    if (entity && entity.type) {
      const parsedEntity = { ...entity };
      Object.keys(entity).forEach((property: string) => {
        const value = entity[property];
        // Pass it through parse
        const { parsed } = ValidationFactory.validateWidgetProperty(
          entity.type,
          property,
          value,
        );
        parsedEntity[property] = parsed;
      });
      return { ...tree, [entityKey]: parsedEntity };
    }
    return tree;
  }, tree);
};

export const getEvaluatedDataTree = (
  dataTree: NameBindingsWithData,
  parseValues: boolean,
) => {
  const dynamicDependencyMap = createDependencyTree(dataTree);
  const evaluatedTree = dependencySortedEvaluateDataTree(
    dataTree,
    dynamicDependencyMap,
    parseValues,
  );
  const treeWithLoading = setTreeLoading(evaluatedTree, dynamicDependencyMap);
  if (parseValues) {
    return getParsedTree(treeWithLoading);
  } else {
    return treeWithLoading;
  }
};

type DynamicDependencyMap = Record<string, Array<string>>;
export const createDependencyTree = (
  dataTree: NameBindingsWithData,
): Array<[string, string]> => {
  const dependencyMap: DynamicDependencyMap = {};
  const allKeys = getAllPaths(dataTree);
  Object.keys(dataTree).forEach(entityKey => {
    const entity = dataTree[entityKey] as WidgetProps;
    if (entity && entity.dynamicBindings) {
      Object.keys(entity.dynamicBindings).forEach(prop => {
        const { paths } = getDynamicBindings(entity[prop]);
        dependencyMap[`${entityKey}.${prop}`] = paths.filter(p => !!p);
      });
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
  return dependencyTree;
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
      if (current) subDeps.push(current);
    }
  });
  return subDeps;
};

export const setTreeLoading = (
  dataTree: NameBindingsWithData,
  dependencyMap: Array<[string, string]>,
) => {
  const result = _.cloneDeep(dataTree);
  Object.keys(dataTree)
    .filter(
      e => dataTree[e].__type === ENTITY_TYPE_ACTION && dataTree[e].isLoading,
    )
    .reduce(
      (allEntities: string[], curr) =>
        allEntities.concat(getEntityDependencies(dependencyMap, curr)),
      [],
    )
    .forEach(w => (result[w].isLoading = true));
  return result;
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

export function dependencySortedEvaluateDataTree(
  dataTree: NameBindingsWithData,
  dependencyTree: Array<[string, string]>,
  parseValues: boolean,
) {
  const tree = _.cloneDeep(dataTree);
  try {
    // sort dependencies and remove empty dependencies
    const sortedDependencies = toposort(dependencyTree)
      .reverse()
      .filter(d => !!d);
    // evaluate and replace values
    return sortedDependencies.reduce(
      (currentTree: NameBindingsWithData, path: string) => {
        const binding = _.get(currentTree as any, path);
        const widgetType = _.get(
          currentTree as any,
          `${path.split(".")[0]}.type`,
          null,
        );
        let result = binding;
        if (isDynamicValue(binding)) {
          result = getDynamicValue(binding, currentTree);
        }
        if (widgetType && parseValues) {
          const { parsed } = ValidationFactory.validateWidgetProperty(
            widgetType,
            `${path.split(".")[1]}`,
            result,
          );
          result = parsed;
        }
        return _.set(currentTree, path, result);
      },
      tree,
    );
  } catch (e) {
    console.error(e);
    return tree;
  }
}
