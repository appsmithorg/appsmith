import { createMessage, FIELD_REQUIRED_ERROR } from "constants/messages";
import { ValidationConfig } from "constants/PropertyControlConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import moment from "moment";

export const required = (value: any) => {
  if (value === undefined || value === null || value === "") {
    return createMessage(FIELD_REQUIRED_ERROR);
  }
};

export const UNDEFINED_VALIDATION = "UNDEFINED_VALIDATION";

export type ExpectedValueExample =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | Array<unknown>;

type ExpectedValue = {
  type: string;
  example: ExpectedValueExample;
};

export function getExpectedValue(
  config?: ValidationConfig,
): ExpectedValue | undefined {
  if (!config)
    return { type: UNDEFINED_VALIDATION, example: UNDEFINED_VALIDATION }; // basic fallback
  switch (config.type) {
    case ValidationTypes.FUNCTION:
      return {
        type: config.params?.expected?.type || "unknown",
        example: config.params?.expected?.example || "No Example available",
      };
    case ValidationTypes.TEXT:
      const result = { type: "string", example: "abc" };
      if (config.params?.allowedValues) {
        const allowed = config.params.allowedValues.join(" | ");
        result.type = result.type + ` ( ${allowed} )`;
      }
      return result;
    case ValidationTypes.REGEX:
      return { type: "regExp", example: "^d+$" };
    case ValidationTypes.DATE_ISO_STRING:
      return { type: "ISO 8601 string", example: moment().toISOString(true) };
    case ValidationTypes.BOOLEAN:
      return { type: "boolean", example: false };
    case ValidationTypes.NUMBER:
      let type = "number";
      let eg = 100;
      if (config.params?.min) {
        type = `${type} Min: ${config.params?.min}`;
        eg = config.params?.min;
      }
      if (config.params?.max) {
        type = `${type} Max: ${config.params?.max}`;
        eg = config.params?.max;
      }
      if (config.params?.required) {
        type = `${type} Required`;
      }

      return {
        type,
        example: eg,
      };
    case ValidationTypes.OBJECT:
      const _exampleObj: Record<string, unknown> = {};
      type = "Object";
      if (config.params?.allowedKeys) {
        type = "{";
        config.params?.allowedKeys.forEach((allowedKeyConfig) => {
          const _expected = getExpectedValue(allowedKeyConfig);
          type = `${type}"${allowedKeyConfig.name}" : "${_expected?.type}",`;
          _exampleObj[allowedKeyConfig.name] = _expected?.example;
        });
        type = `${type.substring(0, type.length - 1)} }`;
        return {
          type,
          example: _exampleObj,
        };
      }
      return { type, example: { key: "value" } };
    case ValidationTypes.ARRAY:
      if (config.params?.allowedValues) {
        const allowed = config.params?.allowedValues.join("' | '");
        return {
          type: `Array<'${allowed}'>`,
          example: config.params.allowedValues,
        };
      }
      if (config.params?.children) {
        const children = getExpectedValue(config.params.children);
        return {
          type: `Array<${children?.type}>`,
          example: [children?.example],
        };
      }
      return { type: "Array", example: [] };
    case ValidationTypes.OBJECT_ARRAY:
      return {
        type: `Array<Object>`,
        example: [{ id: 1 }],
      };
    case ValidationTypes.IMAGE_URL:
      return {
        type: `base64 encoded image | data uri | image url`,
        example: `https://app.appsmith.com/static/media/appsmith_logo_square.3867b195.png`,
      };
  }
}
