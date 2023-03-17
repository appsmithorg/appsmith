import type { ValidationConfig } from "constants/PropertyControlConstants";
import type { ValidationResponse } from "constants/WidgetValidation";
import type { MenuButtonWidgetProps } from "./constants";

/**
 * Checks if the source data array
 * - is Array
 * - has a max length of 10
 */
export function sourceDataArrayValidation(
  options: unknown,
  props: MenuButtonWidgetProps,
  _: any,
): ValidationResponse {
  const invalidResponse = {
    isValid: false,
    parsed: [],
    messages: [
      {
        name: "TypeError",
        message: "This value does not evaluate to type Array",
      },
    ],
  };

  try {
    if (_.isString(options)) {
      options = JSON.parse(options as string);
    }

    if (Array.isArray(options)) {
      let isValid = true;
      let message = { name: "", message: "" };

      if (options.length > 10) {
        isValid = false;
        message = {
          name: "RangeError",
          message: "Source data cannot have more than 10 items",
        };
      }

      return {
        isValid,
        parsed: isValid ? options : [],
        messages: [message],
      };
    } else {
      return invalidResponse;
    }
  } catch (e) {
    return invalidResponse;
  }
}

export function textForEachRowValidation(
  value: unknown,
  props: MenuButtonWidgetProps,
  _: any,
): ValidationResponse {
  const generateResponseAndReturn = (
    isValid = false,
    message = { name: "", message: "" },
  ) => {
    return {
      isValid,
      parsed: isValid ? value : [],
      messages: [message],
    };
  };

  const DEFAULT_MESSAGE = {
    name: "TypeError",
    message: "The evaluated value should be either a string or a number.",
  };

  if (
    _.isString(value) ||
    _.isNumber(value) ||
    Array.isArray(value) ||
    value === undefined
  ) {
    if (Array.isArray(value)) {
      const isValid = value.every((item) => {
        if (_.isString(item) || _.isNumber(item) || item === undefined) {
          return true;
        }

        if (Array.isArray(item)) {
          return item.every(
            (subItem) =>
              _.isString(subItem) ||
              _.isNumber(subItem) ||
              subItem === undefined,
          );
        }

        return false;
      });

      return isValid
        ? generateResponseAndReturn(true)
        : generateResponseAndReturn(false, DEFAULT_MESSAGE);
    }

    return generateResponseAndReturn(true);
  }

  return generateResponseAndReturn(false, DEFAULT_MESSAGE);
}

export function booleanForEachRowValidation(
  value: unknown,
): ValidationResponse {
  const generateResponseAndReturn = (
    isValid = false,
    message = { name: "", message: "" },
  ) => {
    return {
      isValid,
      parsed: isValid ? value : true,
      messages: [message],
    };
  };

  const isBoolean = (value: unknown) => {
    const isABoolean = value === true || value === false;
    const isStringTrueFalse = value === "true" || value === "false";

    return isABoolean || isStringTrueFalse || value === undefined;
  };

  const DEFAULT_MESSAGE = {
    name: "TypeError",
    message: "The evaluated value should be a boolean.",
  };

  if (isBoolean(value)) {
    return generateResponseAndReturn(true);
  }

  if (Array.isArray(value)) {
    const isValid = value.every((item) => {
      if (isBoolean(item)) {
        return true;
      }

      if (Array.isArray(item)) {
        return item.every((subItem) => isBoolean(subItem));
      }

      return false;
    });

    return isValid
      ? generateResponseAndReturn(true)
      : generateResponseAndReturn(false, DEFAULT_MESSAGE);
  }

  return generateResponseAndReturn(false, DEFAULT_MESSAGE);
}

export function iconNamesForEachRowValidation(
  value: unknown,
  props: MenuButtonWidgetProps,
  _: any,
  moment: any,
  propertyPath: string,
  config: ValidationConfig,
): ValidationResponse {
  const generateResponseAndReturn = (
    isValid = false,
    message = { name: "", message: "" },
  ) => {
    return {
      isValid,
      parsed: isValid ? value : true,
      messages: [message],
    };
  };

  const DEFAULT_MESSAGE = {
    name: "TypeError",
    message:
      "The evaluated value should either be an icon name, undefined, null, or an empty string. We currently use the icons from the Blueprint library. You can see the list of icons at https://blueprintjs.com/docs/#icons",
  };

  const isIconName = (value: unknown) => {
    return (
      config?.params?.allowedValues?.includes(value as string) ||
      value === undefined ||
      value === null ||
      value === ""
    );
  };

  if (isIconName(value)) {
    return generateResponseAndReturn(true);
  }

  if (Array.isArray(value)) {
    const isValid = value.every((item) => {
      if (isIconName(item)) {
        return true;
      }

      if (Array.isArray(item)) {
        return item.every((subItem) => isIconName(subItem));
      }

      return false;
    });

    return isValid
      ? generateResponseAndReturn(true)
      : generateResponseAndReturn(false, DEFAULT_MESSAGE);
  }

  return generateResponseAndReturn(false, DEFAULT_MESSAGE);
}

export function iconPositionForEachRowValidation(
  value: unknown,
  props: MenuButtonWidgetProps,
  _: any,
  moment: any,
  propertyPath: string,
  config: ValidationConfig,
): ValidationResponse {
  const generateResponseAndReturn = (
    isValid = false,
    message = { name: "", message: "" },
  ) => {
    return {
      isValid,
      parsed: isValid ? value : true,
      messages: [message],
    };
  };

  const DEFAULT_MESSAGE = {
    name: "TypeError",
    message: `The evaluated value should be one of the allowed values => ${config?.params?.allowedValues?.join(
      ", ",
    )}, undefined, null, or an empty string`,
  };

  const isIconPosition = (value: unknown) => {
    return (
      config?.params?.allowedValues?.includes(value as string) ||
      value === undefined ||
      value === null ||
      value === ""
    );
  };

  if (isIconPosition(value)) {
    return generateResponseAndReturn(true);
  }

  if (Array.isArray(value)) {
    const isValid = value.every((item) => {
      if (isIconPosition(item)) {
        return true;
      }

      if (Array.isArray(item)) {
        return item.every((subItem) => isIconPosition(subItem));
      }

      return false;
    });

    return isValid
      ? generateResponseAndReturn(true)
      : generateResponseAndReturn(false, DEFAULT_MESSAGE);
  }

  return generateResponseAndReturn(false, DEFAULT_MESSAGE);
}

export function colorForEachRowValidation(
  value: unknown,
  props: MenuButtonWidgetProps,
  _: any,
  moment: any,
  propertyPath: string,
  config: ValidationConfig,
): ValidationResponse {
  const generateResponseAndReturn = (
    isValid = false,
    message = { name: "", message: "" },
  ) => {
    return {
      isValid,
      parsed: isValid ? value : true,
      messages: [message],
    };
  };

  const DEFAULT_MESSAGE = {
    name: "TypeError",
    message: `The evaluated value should match ${config?.params?.regex}`,
  };

  const isColor = (value: unknown) => {
    return config?.params?.regex?.test(value as string);
  };

  if (isColor(value)) {
    return generateResponseAndReturn(true);
  }

  if (Array.isArray(value)) {
    const isValid = value.every((item) => {
      if (isColor(item)) {
        return true;
      }

      if (Array.isArray(item)) {
        return item.every((subItem) => isColor(subItem));
      }

      return false;
    });

    return isValid
      ? generateResponseAndReturn(true)
      : generateResponseAndReturn(false, DEFAULT_MESSAGE);
  }

  return generateResponseAndReturn(false, DEFAULT_MESSAGE);
}
