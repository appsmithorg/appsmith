import _ from "lodash";
import { DataTree } from "reducers";
import { JSONPath } from "jsonpath-plus";
import { WidgetProps } from "widgets/BaseWidget";
import { DATA_BIND_REGEX, DATA_PATH_REGEX } from "constants/BindingsConstants";
import ValidationFactory from "./ValidationFactory";

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

export const enhanceWithDynamicValuesAndValidations = (
  widget: WidgetProps,
  entities: DataTree,
  replaceWithParsed: boolean,
): WidgetProps => {
  if (!widget) return widget;
  const properties = { ...widget };
  const invalidProps: Record<string, boolean> = {};
  Object.keys(widget).forEach((property: string) => {
    let value = widget[property];
    // Check for dynamic bindings
    if (widget.dynamicBindings && property in widget.dynamicBindings) {
      value = getDynamicValue(value, entities);
    }
    // Pass it through validation and parse
    const { isValid, parsed } = ValidationFactory.validateWidgetProperty(
      widget.type,
      property,
      value,
    );
    // Store all invalid props
    if (!isValid) invalidProps[property] = true;
    // Replace if flag is turned on
    if (replaceWithParsed) properties[property] = parsed;
  });
  return { ...properties, invalidProps };
};
