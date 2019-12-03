import _ from "lodash";
import { WidgetProps } from "widgets/BaseWidget";
import { DATA_BIND_REGEX } from "constants/BindingsConstants";
import ValidationFactory from "./ValidationFactory";
import JSExecutionManagerSingleton from "jsExecution/JSExecutionManagerSingleton";

export type NameBindingsWithData = Record<string, object>;
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

export const getDynamicBindings = (
  dynamicString: string,
): { bindings: string[]; paths: string[] } => {
  // Get the {{binding}} bound values
  const bindings = parseDynamicString(dynamicString);
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
  return JSExecutionManagerSingleton.evaluateSync(path, data);
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
      return p ? evaluateDynamicBoundValue(data, p) : bindings[i];
    });

    // if it is just one binding, no need to create template string
    if (bindings.length === 1) return values[0];
    // else return a string template with bindings
    return createDynamicValueString(dynamicBinding, bindings, values);
  }
  return undefined;
};

export const enhanceWithDynamicValuesAndValidations = (
  widget: WidgetProps,
  nameBindingsWithData: NameBindingsWithData,
  replaceWithParsed: boolean,
): WidgetProps => {
  if (!widget) return widget;
  const properties = { ...widget };
  const invalidProps: Record<string, boolean> = {};

  Object.keys(widget).forEach((property: string) => {
    let value = widget[property];
    // Check for dynamic bindings
    if (widget.dynamicBindings && property in widget.dynamicBindings) {
      value = getDynamicValue(value, nameBindingsWithData);
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
