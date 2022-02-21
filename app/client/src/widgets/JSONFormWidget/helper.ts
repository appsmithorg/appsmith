import { isNil, isPlainObject, merge } from "lodash";
import { LabelValueType } from "rc-select/lib/interface/generator";

import { ARRAY_ITEM_KEY, FieldType, Schema, SchemaItem } from "./constants";

const evalObjectValue = (value: any, schema: Schema) => {
  const obj: Record<string, any> = {};
  Object.values(schema).forEach((schemaItem) => {
    const val = value[schemaItem.originalIdentifier] ?? value[schemaItem.name];
    obj[schemaItem.name] = sanitizeValue(val, schemaItem);
  });

  return obj;
};

const evalArrayValue = (value: any, schema: Schema): any[] => {
  if (schema[ARRAY_ITEM_KEY]) {
    return value.map((valueItem: any) =>
      sanitizeValue(valueItem, schema[ARRAY_ITEM_KEY]),
    );
  }

  return [];
};

const sanitizeValue = (value: any, schemaItem: SchemaItem) => {
  if (schemaItem.fieldType === FieldType.ARRAY) {
    return Array.isArray(value)
      ? evalArrayValue(value, schemaItem.children)
      : [];
  }

  if (schemaItem.fieldType === FieldType.OBJECT) {
    return isPlainObject(value)
      ? evalObjectValue(value, schemaItem.children)
      : {};
  }

  return value;
};

const processObject = (schema: Schema) => {
  const obj: Record<string, any> = {};
  Object.values(schema).forEach((schemaItem) => {
    obj[schemaItem.name] = schemaItemDefaultValue(schemaItem);
  });

  return obj;
};

const processArray = (schema: Schema): any[] => {
  if (schema[ARRAY_ITEM_KEY]) {
    return [schemaItemDefaultValue(schema[ARRAY_ITEM_KEY])];
  }

  return [];
};

export const schemaItemDefaultValue = (schemaItem: SchemaItem) => {
  if (schemaItem.fieldType === FieldType.OBJECT) {
    return processObject(schemaItem.children);
  }

  if (schemaItem.fieldType === FieldType.ARRAY) {
    const defaultArrayValue = processArray(schemaItem.children);
    const sanitizedDefaultValue = sanitizeValue(
      schemaItem.defaultValue,
      schemaItem,
    );

    /**
     * Reason for merge
     * - For an array type, the default value of individual fields underneath the array
     * are not present as array field handles whole default data coming from sourceData directly.
     * So the default value we get from processArray(schemaItem.children) will have some value only if
     * the default value of any field under the array is set explicitly by the user in the property pane.
     * Thus we merge both array level default value and any default value the underlying field holds
     * to get a complete defaultValue.
     */
    return merge(sanitizedDefaultValue, defaultArrayValue);
  }

  const { defaultValue } = schemaItem;
  return defaultValue;
};

export function isPrimitive(val: unknown): val is number | string | boolean {
  return val === null || /^[sbn]/.test(typeof val);
}

export const validateOptions = (
  values: unknown,
): values is LabelValueType["value"][] | LabelValueType[] => {
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

  if (hasPrimitive && hasObject) return false;

  return true;
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
