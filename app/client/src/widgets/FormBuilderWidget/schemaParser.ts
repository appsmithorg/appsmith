import { cloneDeep, difference, maxBy, omit, startCase } from "lodash";
import {
  ARRAY_ITEM_KEY,
  DATA_TYPE_POTENTIAL_FIELD,
  DataType,
  FIELD_MAP,
  FIELD_TYPE_TO_POTENTIAL_DATA,
  FieldType,
  ROOT_SCHEMA_KEY,
  Schema,
  SchemaItem,
} from "./constants";

type Obj = Record<string, any>;
type JSON = Obj | Obj[];

type ParserOptions = {
  currFormData?: JSON | string;
  prevSchema?: Schema;
  fieldType?: FieldType;
  isCustomField?: boolean;
};

/**
 *
 * This method takes in array of object and squishes every object in the
 * array into single object thus making sure that all the keys are
 * in single object.
 *
 * @example
 *  Input - [{ firstName: "John", age: 20 }, { lastName: "Doe", age: 30 }]
 *  Output - { firstName: "John", age: 20, lastName: "Doe" }
 */

// TODO: Improve logic to look into all the array items to get the proper object
export const constructPlausibleObjectFromArray = (arrayOfObj: Obj[]) => {
  let plausibleObj = {};

  arrayOfObj.forEach((obj) => {
    plausibleObj = {
      ...plausibleObj,
      ...obj,
    };
  });

  return plausibleObj;
};

export const dataTypeFor = (value: any) => {
  const typeOfValue = typeof value;

  if (Array.isArray(value)) return DataType.ARRAY;
  if (value === null) return DataType.NULL;

  return typeOfValue as DataType;
};

export const subDataTypeFor = (value: any) => {
  const dataType = dataTypeFor(value);

  if (dataType === DataType.ARRAY) {
    return dataTypeFor(value[0]);
  }

  return undefined;
};

export const normalizeArrayValue = (data: Obj[]) => {
  if (subDataTypeFor(data) === DataType.OBJECT) {
    return constructPlausibleObjectFromArray(data);
  }

  return data[0];
};

export const fieldTypeFor = (value: any) => {
  const dataType = dataTypeFor(value);
  const fieldType = DATA_TYPE_POTENTIAL_FIELD[dataType].default;
  const subDataType = subDataTypeFor(value);

  if (subDataType) {
    switch (subDataType) {
      case DataType.STRING:
      case DataType.NUMBER:
        return FieldType.MULTI_SELECT;
      default:
        return FieldType.ARRAY;
    }
  }

  return fieldType;
};

const getKeysFromSchema = (schema: Schema) => {
  return Object.entries(schema).reduce<string[]>((keys, [key, schemaItem]) => {
    if (!schemaItem.isCustomField) {
      keys.push(key);
    }

    return keys;
  }, []);
};

const applyPositions = (schema: Schema, newKeys?: string[]) => {
  if (!newKeys) {
    return;
  }
  const schemaItems = Object.values(schema);
  const lastSchemaItem = maxBy(schemaItems, ({ position }) => position);
  const lastSchemaItemPosition = lastSchemaItem?.position || -1;

  newKeys.forEach((newKey, index) => {
    schema[newKey].position = lastSchemaItemPosition + index + 1;
  });
};

class SchemaParser {
  static nameAndLabel = (key: string) => {
    return {
      name: key,
      label: startCase(key),
    };
  };

  static parse = (currFormData?: JSON, schema: Schema = {}) => {
    if (!currFormData) return schema;

    const prevSchema = (() => {
      const rootSchemaItem = schema[ROOT_SCHEMA_KEY];
      if (rootSchemaItem) return rootSchemaItem.children;

      return {};
    })();

    const rootSchemaItem = SchemaParser.getSchemaItemFor("", {
      currFormData,
      prevSchema,
    });

    return {
      [ROOT_SCHEMA_KEY]: rootSchemaItem,
    };
  };

  static getSchemaItemByFieldType = (
    key: string,
    fieldType: FieldType,
    schemaItem: SchemaItem,
  ) => {
    const currFormData = schemaItem.isCustomField
      ? FIELD_TYPE_TO_POTENTIAL_DATA[fieldType]
      : schemaItem.formData;

    const options = {
      isCustomField: schemaItem.isCustomField,
    };

    return SchemaParser.getSchemaItemFor(key, {
      ...options,
      currFormData,
      fieldType,
    });
  };

  // TODO: add eg
  static getSchemaItemFor = (
    key: string,
    options: ParserOptions,
  ): SchemaItem => {
    const { currFormData, isCustomField = false } = options || {};
    const dataType = dataTypeFor(currFormData);
    const fieldType = options.fieldType || fieldTypeFor(currFormData);
    const FieldComponent = FIELD_MAP[fieldType];
    const { label, name } = SchemaParser.nameAndLabel(key);

    // Removing fieldType (which might have been passed by getSchemaItemByFieldType)
    // as it might bleed into subsequent schema item and force assign fieldType
    const sanitizedOptions = omit(options, ["fieldType"]);

    let children: Schema = {};
    if (dataType === DataType.OBJECT) {
      children = SchemaParser.convertObjectToSchema(sanitizedOptions);
    }

    if (dataType === DataType.ARRAY) {
      children = SchemaParser.convertArrayToSchema(sanitizedOptions);
    }

    return {
      children,
      dataType,
      fieldType,
      formData: currFormData,
      isCustomField,
      isDisabled: false,
      isVisible: true,
      label,
      name,
      position: -1,
      ...FieldComponent.componentDefaultValues,
    };
  };

  static getModifiedSchemaItemFor = (
    currData: JSON,
    schemaItem: SchemaItem,
  ) => {
    let { children } = schemaItem;
    const { dataType } = schemaItem;

    const options = {
      currFormData: currData,
      prevSchema: children,
    };

    if (dataType === DataType.OBJECT) {
      children = SchemaParser.convertObjectToSchema(options);
    }

    if (dataType === DataType.ARRAY) {
      children = SchemaParser.convertArrayToSchema(options);
    }

    return {
      ...schemaItem,
      children,
    };
  };

  static convertArrayToSchema = ({
    currFormData = [],
    prevSchema = {},
    ...rest
  }: ParserOptions): Schema => {
    const schema = cloneDeep(prevSchema);
    const currData = normalizeArrayValue(currFormData as any[]);

    const prevDataType = schema[ARRAY_ITEM_KEY]?.dataType;
    const currDataType = dataTypeFor(currData);

    if (currDataType !== prevDataType) {
      schema[ARRAY_ITEM_KEY] = SchemaParser.getSchemaItemFor(ARRAY_ITEM_KEY, {
        currFormData: currData,
        ...rest,
      });
    } else {
      schema[ARRAY_ITEM_KEY] = SchemaParser.getModifiedSchemaItemFor(
        currData,
        schema[ARRAY_ITEM_KEY],
      );
    }

    return schema;
  };

  static convertObjectToSchema = ({
    currFormData = {},
    prevSchema = {},
  }: ParserOptions): Schema => {
    const schema = cloneDeep(prevSchema);
    const currObj = currFormData as Obj;

    const currKeys = Object.keys(currFormData);
    const prevKeys = getKeysFromSchema(prevSchema);

    const newKeys = difference(currKeys, prevKeys);
    const removedKeys = difference(prevKeys, currKeys);
    const modifiedKeys = difference(currKeys, newKeys.concat(removedKeys));

    modifiedKeys.forEach((modifiedKey) => {
      const currDataType = dataTypeFor(currObj[modifiedKey]);
      const prevDataType = schema[modifiedKey].dataType;

      if (currDataType !== prevDataType) {
        schema[modifiedKey] = SchemaParser.getSchemaItemFor(modifiedKey, {
          currFormData: currObj[modifiedKey],
          prevSchema: schema[modifiedKey].children,
        });
      } else {
        schema[modifiedKey] = SchemaParser.getModifiedSchemaItemFor(
          currObj[modifiedKey],
          schema[modifiedKey],
        );
      }
    });

    removedKeys.forEach((removedKey) => {
      delete schema[removedKey];
    });

    newKeys.forEach((newKey) => {
      schema[newKey] = SchemaParser.getSchemaItemFor(newKey, {
        currFormData: currObj[newKey],
      });
    });

    if (newKeys.length) {
      applyPositions(schema, newKeys);
    }
    // return sortSchemaBy(schema, { newKeys, removedKeys });
    return schema;
  };
}

export default SchemaParser;
