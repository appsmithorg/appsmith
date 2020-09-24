import _ from "lodash";
import toposort from "toposort";
import { DataTree, ENTITY_TYPE } from "../entities/DataTree/dataTreeFactory";
import { DATA_BIND_REGEX } from "../constants/BindingsConstants";

addEventListener("message", e => {
  const { dataTree, widgetDefaultProperties } = JSON.parse(e.data);
  console.log({ dataTree, widgetDefaultProperties });
  const response = createDependencyTree(dataTree, widgetDefaultProperties);
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  postMessage(JSON.stringify(response));
});

type DynamicDependencyMap = Record<string, Array<string>>;
const createDependencyTree = (
  dataTree: DataTree,
  widgetDefaultPropertiesMap: Record<string, Record<string, string>>,
): {
  sortedDependencies: Array<string>;
  dependencyTree: Array<[string, string]>;
  dependencyMap: DynamicDependencyMap;
  error?: Error;
} => {
  const dependencyMap: DynamicDependencyMap = {};
  const allKeys = getAllPaths(dataTree);
  Object.keys(dataTree).forEach(entityKey => {
    const entity = dataTree[entityKey];
    if (entity && "ENTITY_TYPE" in entity) {
      if (entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET) {
        // Set default property dependency
        const defaultProperties = widgetDefaultPropertiesMap[entity.type];
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
    return {
      sortedDependencies: [],
      dependencyMap: {},
      dependencyTree: [],
      error: e,
    };
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

export const isDynamicValue = (value: string): boolean =>
  DATA_BIND_REGEX.test(value);
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
