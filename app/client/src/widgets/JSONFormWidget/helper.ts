import { isNil, isPlainObject, merge } from "lodash";
import type { LabelInValueType } from "rc-select/lib/Select";

import {
  isDynamicValue,
  getDynamicBindings,
  combineDynamicBindings,
} from "utils/DynamicBindingUtils";
import type { Column } from "../../WidgetQueryGenerators/types";
import type { FieldThemeStylesheet, Schema, SchemaItem } from "./constants";
import {
  ARRAY_ITEM_KEY,
  FieldType,
  inverseFieldType,
  getBindingTemplate,
} from "./constants";
import moment from "moment";
import { ISO_DATE_FORMAT } from "constants/WidgetValidation";

interface ConvertFormDataOptions {
  fromId: keyof SchemaItem | (keyof SchemaItem)[];
  toId: keyof SchemaItem;
  useSourceData?: boolean;
  sourceData?: unknown;
}

/**
 * This function finds the value from the object by using the id provided. The id
 * can be one of the key that is present in the schemaItem (identifier/accessor/defaultValue).
 * This keys value is picked up from the schema item and used for the lookup in the obj.
 * The id is either a single or an array. If it is an array, each key is picked up and tested
 * until a value is found (null would be considered as a value but undefined would mean it's empty).
 */
const valueLookup = (
  obj: Record<string, unknown>,
  schemaItem: SchemaItem,
  id: ConvertFormDataOptions["fromId"],
) => {
  if (typeof id === "string") {
    return obj[schemaItem[id]];
  }

  for (const key of id) {
    const value = obj[schemaItem[key]];

    if (value !== undefined) {
      return value;
    }
  }

  return;
};

export const getFieldStylesheet = (
  widgetName: string,
  fieldType: FieldType,
  fieldThemeStylesheets?: FieldThemeStylesheet,
) => {
  const computedFieldStylesheet: { [key: string]: string } = {};
  const fieldTypeKey = inverseFieldType[fieldType];

  if (fieldThemeStylesheets && fieldTypeKey in fieldThemeStylesheets) {
    const fieldStylesheet = fieldThemeStylesheets[fieldTypeKey];

    Object.keys(fieldStylesheet).map((fieldPropertyKey) => {
      const fieldStylesheetValue = fieldStylesheet[fieldPropertyKey];

      if (isDynamicValue(fieldStylesheetValue)) {
        const { jsSnippets, stringSegments } = getDynamicBindings(
          fieldStylesheet[fieldPropertyKey],
        );
        const js = combineDynamicBindings(jsSnippets, stringSegments);
        const { prefixTemplate, suffixTemplate } =
          getBindingTemplate(widgetName);
        const computedValue = `${prefixTemplate}${js}${suffixTemplate}`;

        computedFieldStylesheet[fieldPropertyKey] = computedValue;
      } else {
        computedFieldStylesheet[fieldPropertyKey] = fieldStylesheetValue;
      }
    });
  }

  return computedFieldStylesheet;
};

const convertObjectTypeToFormData = (
  schema: Schema,
  formValue: unknown,
  options: ConvertFormDataOptions,
) => {
  if (formValue && typeof formValue === "object") {
    const formData: Record<string, unknown> = {};

    Object.values(schema).forEach((schemaItem) => {
      if (!schemaItem.isVisible && !options.useSourceData) return;

      let sourceData;

      if (options.sourceData) {
        sourceData = valueLookup(
          options.sourceData as Record<string, unknown>,
          schemaItem,
          // sourceData lookup can only be done using originalIdentifier
          // if sourceData lookup done using other id e.g. accessor or identify, the return
          // value could be undefined.
          "originalIdentifier",
        );
      }

      const toKey = schemaItem[options.toId];
      let value;

      if (!schemaItem.isVisible) {
        value = sourceData;
      } else {
        value = valueLookup(
          formValue as Record<string, unknown>,
          schemaItem,
          options.fromId,
        );
      }

      formData[toKey] = convertSchemaItemToFormData(schemaItem, value, {
        ...options,
        sourceData,
      });
    });

    return formData;
  }

  return;
};

const convertArrayTypeToFormData = (
  schema: Schema,
  formValues: unknown,
  options: ConvertFormDataOptions,
) => {
  if (formValues && Array.isArray(formValues)) {
    const formData: unknown[] = [];
    const arraySchemaItem = schema[ARRAY_ITEM_KEY];

    formValues.forEach((formValue, index) => {
      const sourceData = (options?.sourceData as unknown[])?.[index];

      formData[index] = convertSchemaItemToFormData(
        arraySchemaItem,
        formValue,
        { ...options, sourceData },
      );
    });

    return formData.filter((d) => d !== undefined);
  }

  return;
};

/**
 * This function iterates through the schemaItem and returns a value
 * that matches with the the value param passed. The return value key-value pairs
 * are determined by what the fromKey and toKey values are. If the fromKey is accessor
 * and toKey is identifier then it will look in the input value object with the identifier of the
 * schemaItem and would set it as the accessor value of schemaItem.
 *
 * This helps to transform formData from having accessor as key to identifier as keys and vice-versa
 *
 * If schemaItem
 * {
 *  identifier: "address",
 *  accessor: "addresses",
 *    fieldType: "object",
 *    children: {
 *      "line1": {
 *         identifier: "line1",
 *         accessor: "line1",
 *         originalIdentifier: "line1"
 *      },
 *      "pincode": {
 *         accessor: "zipcode"
 *         identifier: "pincode",
 *         originalIdentifier: "pincode"
 *      }
 *    }
 * }
 *
 * Example 1
 * ----------
 * fromKey = identifier
 * toKey = accessor
 *
 * value
 * {
 *  address: {
 *    line1: "24th main",
 *    pincode: "230123",
 *  }
 * }
 *
 * @returns
 * {
 *  addresses: {
 *    line1: "24th main",
 *    pincode: "230123"
 *  }
 * }
 *
 * Example 2
 * ----------
 * fromKey = accessor
 * toKey = identifier
 *
 * value
 * {
 *  addresses: {
 *    line1: "24th main",
 *    zipcode: "230123",
 *  }
 * }
 *
 * @returns
 * {
 *  address: {
 *    line1: "24th main",
 *    pincode: "230123"
 *  }
 * }
 *
 */
export const convertSchemaItemToFormData = <TValue>(
  schemaItem: SchemaItem,
  formValue: TValue,
  options: ConvertFormDataOptions,
) => {
  if (schemaItem.fieldType === FieldType.OBJECT) {
    return convertObjectTypeToFormData(schemaItem.children, formValue, options);
  }

  if (schemaItem.fieldType === FieldType.ARRAY) {
    return convertArrayTypeToFormData(schemaItem.children, formValue, options);
  }

  return formValue;
};

const processObject = (schema: Schema, toKey: keyof SchemaItem) => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj: Record<string, any> = {};

  Object.values(schema).forEach((schemaItem) => {
    obj[schemaItem[toKey]] = schemaItemDefaultValue(schemaItem, toKey);
  });

  return obj;
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const processArray = (schema: Schema, toKey: keyof SchemaItem): any[] => {
  if (schema[ARRAY_ITEM_KEY]) {
    return [schemaItemDefaultValue(schema[ARRAY_ITEM_KEY], toKey)];
  }

  return [];
};

export const schemaItemDefaultValue = (
  schemaItem: SchemaItem,
  toKey: keyof SchemaItem,
) => {
  if (schemaItem.fieldType === FieldType.OBJECT) {
    return processObject(schemaItem.children, toKey);
  }

  if (schemaItem.fieldType === FieldType.ARRAY) {
    const defaultArrayValue = processArray(schemaItem.children, toKey);
    let sanitizedDefaultValue: unknown[] = [];

    if (Array.isArray(schemaItem.defaultValue)) {
      const convertedValue = convertSchemaItemToFormData(
        schemaItem,
        schemaItem.defaultValue as unknown[],
        {
          fromId: ["originalIdentifier", "accessor"],
          toId: "accessor",
        },
      );

      if (Array.isArray(convertedValue)) {
        sanitizedDefaultValue = convertedValue;
      }
    }

    /**
     * Reason for merge
     * - For an array type, the default value of individual fields underneath the array
     * are not present as array field handles whole default data coming from sourceData directly.
     * So the default value we get from processArray(schemaItem.children) will have some value only if
     * the default value of any field under the array is set explicitly by the user in the property pane.
     * Thus we merge both array level default value and any default value the underlying field holds
     * to get a complete defaultValue.
     */
    return merge(defaultArrayValue, sanitizedDefaultValue);
  }

  const { defaultValue } = schemaItem;

  return defaultValue;
};

export function isPrimitive(val: unknown): val is number | string | boolean {
  return val === null || /^[sbn]/.test(typeof val);
}

export const validateOptions = (
  values: unknown,
): values is LabelInValueType["value"][] | LabelInValueType[] => {
  if (!Array.isArray(values)) return false;

  let hasPrimitive = false;
  let hasObject = false;

  for (const value of values) {
    if (isNil(value) || Number.isNaN(value)) {
      return false;
    } else if (isPrimitive(value)) {
      hasPrimitive = true;
    } else if (isPlainObject(value) && "label" in value && "value" in value) {
      hasObject = true;
    } else {
      return false;
    }
  }

  return !(hasPrimitive && hasObject);
};

export const mergeAllObjectsInAnArray = (arrObj: Record<string, unknown>[]) => {
  return arrObj.reduce((r, c) => merge(r, c), {});
};

export const countFields = (
  obj:
    | Record<string, unknown>
    | unknown[]
    | string
    | number
    | boolean
    | null
    | undefined,
) => {
  let count = 0;

  if (!Array.isArray(obj) && !isPlainObject(obj)) return 0;

  if (Array.isArray(obj)) {
    if (isPlainObject(obj[0])) {
      const mergedObject = mergeAllObjectsInAnArray(
        obj as Record<string, unknown>[],
      );

      count += countFields(mergedObject) * obj.length;
    }
  } else {
    if (obj && typeof obj === "object") {
      Object.values(obj).forEach((objVal) => {
        count += countFields(objVal as Record<string, unknown>) + 1;
      });
    }
  }

  return count;
};

export const isEmpty = (value?: string | null): value is null | undefined => {
  return value === "" || isNil(value);
};

export const generateSchemaWithDefaultValues = (columns: Column[]) => {
  const typeMappings: Record<string, unknown> = {
    number: 0,
    string: "",
    date: moment(moment.now()).format(ISO_DATE_FORMAT),
    array: [],
  };

  const convertedObject: Record<string, unknown> = columns.reduce(
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (obj: any, curr: any) => {
      obj[curr.name] = typeMappings[curr.type];

      return obj;
    },
    {},
  );

  return convertedObject;
};
