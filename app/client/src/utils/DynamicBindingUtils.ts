import _ from "lodash";
import { DataTree } from "../reducers";
import { JSONPath } from "jsonpath-plus";
import { WidgetProps } from "../widgets/BaseWidget";
import { ContainerWidgetProps } from "../widgets/ContainerWidget";
import {
  DATA_BIND_REGEX,
  DATA_PATH_REGEX,
} from "../constants/BindingsConstants";

export const isDynamicValue = (value: string): boolean =>
  DATA_BIND_REGEX.test(value);

export const getDynamicBindings = (
  dynamicString: string,
): { bindings: string[]; paths: string[] } => {
  // Get the {{binding}} bound values
  const bindings = dynamicString.match(DATA_BIND_REGEX) || [];
  // Get the "binding" path values
  const paths = bindings.map(p => {
    const matches = p.match(DATA_PATH_REGEX);
    if (matches) return matches[0];
    return "";
  });
  return { bindings, paths };
};

// Paths are expected to have "{name}.{path}" signature
export const extractDynamicBoundValue = (
  dataTree: DataTree,
  path: string,
): any => {
  // Remove the name in the binding
  const splitPath = path.split(".");
  // Find the dataTree path of the name
  const bindingPath = dataTree.nameBindings[splitPath[0]];
  // Create the full path
  const fullPath = `${bindingPath}.${splitPath.slice(1).join(".")}`;
  // Search with JSONPath
  return JSONPath({ path: fullPath, json: dataTree })[0];
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
  dataTree: DataTree,
): any => {
  // Get the {{binding}} bound values
  const { bindings, paths } = getDynamicBindings(dynamicBinding);
  if (bindings.length) {
    // Get the Data Tree value of those "binding "paths
    const values = paths.map(p => extractDynamicBoundValue(dataTree, p));
    // if it is just one binding, no need to create template string
    if (bindings.length === 1) return values[0];
    // else return a string template with bindings
    return createDynamicValueString(dynamicBinding, bindings, values);
  }
  return undefined;
};

export const injectDataTreeIntoDsl = (
  entities: DataTree,
  dsl?: ContainerWidgetProps<WidgetProps>,
) => {
  if (!dsl) return dsl;
  const traverseTree = (
    tree: ContainerWidgetProps<WidgetProps>,
  ): ContainerWidgetProps<WidgetProps> => {
    const { dynamicBindings } = tree;
    const widget = { ...tree };
    // Check for dynamic bindings
    if (dynamicBindings && !_.isEmpty(dynamicBindings)) {
      Object.keys(dynamicBindings).forEach((dKey: string) => {
        widget[dKey] = getDynamicValue(dynamicBindings[dKey], entities);
      });
    }
    if (tree.children) {
      const children = tree.children.map(b => traverseTree(b));
      return { ...widget, children };
    }
    return { ...widget };
  };
  return traverseTree(dsl);
};
