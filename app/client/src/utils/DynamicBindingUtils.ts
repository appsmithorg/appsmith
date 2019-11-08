import _ from "lodash";
import { DataTree } from "../reducers";
import { JSONPath } from "jsonpath-plus";
import { WidgetProps } from "../widgets/BaseWidget";
import { ContainerWidgetProps } from "../widgets/ContainerWidget";
import {
  DATA_BIND_REGEX,
  DATA_PATH_REGEX,
} from "../constants/BindingsConstants";

// Paths are expected to have "{name}.{path}" signature
export const getDynamicBoundValue = (
  dataTree: DataTree,
  path: string,
): Array<any> => {
  // Remove the name in the binding
  const splitPath = path.split(".");
  // Find the dataTree path of the name
  const bindingPath = dataTree.nameBindings[splitPath[0]];
  // Create the full path
  const fullPath = `${bindingPath}.${splitPath.slice(1).join(".")}`;
  // Search with JSONPath
  return JSONPath({ path: fullPath, json: dataTree });
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
        // Get the {{binding}} bound values
        const bindings = dynamicBindings[dKey].match(DATA_BIND_REGEX);
        if (bindings && bindings.length) {
          // Get the "binding" path values
          const paths = bindings.map(p => {
            const matches = p.match(DATA_PATH_REGEX);
            if (matches) return matches[0];
            return "";
          });
          // Get the Data Tree value of those "binding "paths
          const values = paths.map(p => {
            const value = getDynamicBoundValue(entities, p)[0];
            if (value) return value;
            return "undefined";
          });
          // Replace the string with the data tree values
          let string = dynamicBindings[dKey];
          bindings.forEach((b, i) => {
            let value = values[i];
            if (Array.isArray(value)) {
              value = JSON.stringify(value);
            }
            string = string.replace(b, value);
          });
          // Overwrite the property with the evaluated data tree property
          widget[dKey] = string;
        }
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
