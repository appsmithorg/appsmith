import { createMessage, FIELD_REQUIRED_ERROR } from "constants/messages";
import { ValidationConfig } from "constants/PropertyControlConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import moment from "moment";

export const required = (value: any) => {
  if (value === undefined || value === null || value === "") {
    return createMessage(FIELD_REQUIRED_ERROR);
  }
};

export function getExpectedValue(config?: ValidationConfig) {
  if (!config) return { type: "any", example: 123 }; // basic fallback
  switch (config.type) {
    case ValidationTypes.FUNCTION:
      return { type: config.params?.expected };
    case ValidationTypes.TEXT:
      const result = { type: "String", example: "abc" };
      if (config.params?.allowedValues) {
        const allowed = config.params.allowedValues.join(" | ");
        result.type = result.type + ` ( ${allowed} )`;
      }
      return result;
    case ValidationTypes.REGEX:
      return { type: "RegExp", example: "/^d+$/" };
    case ValidationTypes.DATE_ISO_STRING:
      return { type: "ISO 8601 string", example: moment().toISOString(true) };
    case ValidationTypes.BOOLEAN:
      return { type: "Boolean" };
    case ValidationTypes.OBJECT:
      const _exampleObj: Record<string, unknown> = {};
      if (config.params?.allowedKeys) {
        config.params?.allowedKeys.forEach((allowedKeyConfig) => {
          const _expected = getExpectedValue(allowedKeyConfig);
          _exampleObj[allowedKeyConfig.name] = _expected?.example;
        });
        return {
          type: "Specific Object Structure",
          example: JSON.stringify(_exampleObj),
        };
      }
      return { type: "Object", example: JSON.stringify({ key: "value" }) };
    case ValidationTypes.ARRAY:
      if (config.params?.allowedValues) {
        const allowed = config.params?.allowedValues.join(" | ");
        return {
          type: `Array<${allowed}>`,
          example: JSON.stringify(config.params.allowedValues),
        };
      }
      return { type: "Array", example: "[]" };
    case ValidationTypes.OBJECT_ARRAY:
      return {
        type: `Array<Object>`,
        example: JSON.stringify([{ id: 1 }]),
      };
  }
}
