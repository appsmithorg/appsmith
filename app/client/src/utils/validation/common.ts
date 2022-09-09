import {
  createMessage,
  FIELD_REQUIRED_ERROR,
} from "@appsmith/constants/messages";
import { ValidationConfig } from "constants/PropertyControlConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import moment from "moment";
import { sample } from "lodash";
import { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

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

export function getExpectedValue(
  config?: ValidationConfig,
): CodeEditorExpected | undefined {
  if (!config)
    return {
      type: UNDEFINED_VALIDATION,
      example: UNDEFINED_VALIDATION,
      autocompleteDataType: AutocompleteDataType.UNKNOWN,
    }; // basic fallback
  switch (config.type) {
    case ValidationTypes.FUNCTION:
      return {
        type: config.params?.expected?.type || "unknown",
        example: config.params?.expected?.example || "No Example available",
        autocompleteDataType:
          config.params?.expected?.autocompleteDataType ||
          AutocompleteDataType.UNKNOWN,
      };
    case ValidationTypes.TEXT:
      const result: CodeEditorExpected = {
        type: "string",
        example: "abc",
        autocompleteDataType: AutocompleteDataType.STRING,
      };
      if (config.params?.allowedValues) {
        const allowed = config.params.allowedValues.join(" | ");
        result.type = result.type + ` ( ${allowed} )`;
        result.example = sample(config.params.allowedValues) as string;
      }
      if (config.params?.expected?.type)
        result.type = config.params?.expected.type;
      if (config.params?.expected?.example)
        result.example = config.params?.expected.example;
      return result;
    case ValidationTypes.REGEX:
      return {
        type: "regExp",
        example: "^d+$",
        autocompleteDataType: AutocompleteDataType.STRING,
      };
    case ValidationTypes.DATE_ISO_STRING:
      return {
        type: "ISO 8601 date string",
        example: moment().toISOString(true),
        autocompleteDataType: AutocompleteDataType.STRING,
      };
    case ValidationTypes.BOOLEAN:
      return {
        type: "boolean",
        example: false,
        autocompleteDataType: AutocompleteDataType.BOOLEAN,
      };
    case ValidationTypes.NUMBER:
      let numberType = "number";
      let eg = 100;
      if (config.params?.min) {
        numberType = `${numberType} Min: ${config.params?.min}`;
        eg = config.params?.min;
      }
      if (config.params?.max) {
        numberType = `${numberType} Max: ${config.params?.max}`;
        eg = config.params?.max;
      }
      if (config.params?.required) {
        numberType = `${numberType} Required`;
      }

      return {
        type: numberType,
        example: eg,
        autocompleteDataType: AutocompleteDataType.NUMBER,
      };
    case ValidationTypes.OBJECT:
      const _exampleObj: Record<string, unknown> = {};
      let objectType = "Object";
      if (config.params?.allowedKeys) {
        objectType = "{";
        config.params?.allowedKeys.forEach((allowedKeyConfig) => {
          const _expected = getExpectedValue(allowedKeyConfig);
          objectType = `${objectType} "${allowedKeyConfig.name}": "${_expected?.type}",`;
          _exampleObj[allowedKeyConfig.name] = _expected?.example;
        });
        objectType = `${objectType.substring(0, objectType.length - 1)} }`;
        return {
          type: objectType,
          example: _exampleObj,
          autocompleteDataType: AutocompleteDataType.OBJECT,
        };
      }
      return {
        type: objectType,
        example: { key: "value" },
        autocompleteDataType: AutocompleteDataType.OBJECT,
      };
    case ValidationTypes.ARRAY:
    case ValidationTypes.NESTED_OBJECT_ARRAY:
      if (config.params?.allowedValues) {
        const allowed = config.params?.allowedValues.join("' | '");
        return {
          type: `Array<'${allowed}'>`,
          example: config.params.allowedValues,
          autocompleteDataType: AutocompleteDataType.ARRAY,
        };
      }
      if (config.params?.children) {
        const children = getExpectedValue(config.params.children);
        return {
          type: `Array<${children?.type}>`,
          example: [children?.example],
          autocompleteDataType: AutocompleteDataType.ARRAY,
        };
      }
      return {
        type: "Array",
        example: [],
        autocompleteDataType: AutocompleteDataType.ARRAY,
      };
    case ValidationTypes.OBJECT_ARRAY:
      return {
        type: `Array<Object>`,
        example: [{ id: 1 }],
        autocompleteDataType: AutocompleteDataType.ARRAY,
      };
    case ValidationTypes.IMAGE_URL:
      return {
        type: `base64 encoded image | data uri | image url`,
        example: `https://app.appsmith.com/static/media/appsmith_logo_square.3867b195.png`,
        autocompleteDataType: AutocompleteDataType.STRING,
      };
    case ValidationTypes.SAFE_URL:
      return {
        type: "URL",
        example: `https://www.example.com`,
        autocompleteDataType: AutocompleteDataType.STRING,
      };
    case ValidationTypes.TABLE_PROPERTY:
      return getExpectedValue(config.params as ValidationConfig);
  }
}
