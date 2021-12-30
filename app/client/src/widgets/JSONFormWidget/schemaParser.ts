import {
  cloneDeep,
  difference,
  isEmpty,
  omit,
  pick,
  sortBy,
  startCase,
} from "lodash";
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
  getBindingTemplate,
} from "./constants";

type Obj = Record<string, any>;
type JSON = Obj | Obj[];

type ParserOptions = {
  currSourceData?: JSON | string;
  fieldType?: FieldType;
  isCustomField?: boolean;
  prevSchema?: Schema;
  sourceDataPath?: string;
  widgetName: string;
};

type SchemaItemsByFieldOptions = {
  schemaItem: SchemaItem;
  schemaItemPath: string;
  schema: Schema;
  widgetName: string;
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

export const getSourcePath = (name: string | number, basePath?: string) => {
  if (typeof name === "string") {
    return basePath ? `${basePath}.${name}` : name;
  }

  const indexedName = `[${name}]`;

  return basePath ? `${basePath}${indexedName}` : indexedName;
};

export const getSourceDataPathFromSchemaItemPath = (
  schema: Schema,
  schemaItemPath: string,
) => {
  const keys = schemaItemPath.split(".");
  let clonedSchema = cloneDeep(schema);
  let sourceDataPath = "sourceData";
  let schemaItem: SchemaItem;
  let skipIteration = false;
  let notation = "";

  keys.forEach((key, index) => {
    if (index !== 0 && !skipIteration) {
      schemaItem = clonedSchema[key];

      if (!schemaItem) return;

      if (index !== 1 && schemaItem.identifier !== "__array_item__") {
        sourceDataPath = sourceDataPath.concat(schemaItem.identifier);
      }

      if (schemaItem.dataType === DataType.OBJECT) {
        notation = ".";
      } else if (schemaItem.dataType === DataType.ARRAY) {
        notation = "[0]";
      }

      if (!isEmpty(schemaItem.children)) {
        clonedSchema = schemaItem.children;
        skipIteration = true;
        sourceDataPath = sourceDataPath.concat(notation);
      }
    } else if (skipIteration) {
      skipIteration = false;
    }
  });

  return sourceDataPath;
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

export const normalizeArrayValue = (data: any[]) => {
  if (subDataTypeFor(data) === DataType.OBJECT) {
    return constructPlausibleObjectFromArray(data);
  }

  return data[0];
};

export const fieldTypeFor = (value: any) => {
  const dataType = dataTypeFor(value);
  const potentialFieldType = DATA_TYPE_POTENTIAL_FIELD[dataType];
  const subDataType = subDataTypeFor(value);

  if (subDataType) {
    switch (subDataType) {
      case DataType.OBJECT:
      case DataType.FUNCTION:
        return FieldType.ARRAY;
      default:
        return FieldType.MULTI_SELECT;
    }
  }

  if (dataType === DataType.STRING) {
    const DateField = FIELD_MAP[FieldType.DATE];
    const EmailField = FIELD_MAP[FieldType.EMAIL];

    if (EmailField?.isValidType?.(value, { fieldType: FieldType.EMAIL })) {
      return FieldType.EMAIL;
    }

    if (DateField?.isValidType?.(value)) {
      return FieldType.DATE;
    }
  }

  return potentialFieldType;
};

export const getKeysFromSchema = (schema: Schema) => {
  return Object.entries(schema).reduce<string[]>((keys, [key, schemaItem]) => {
    if (!schemaItem.isCustomField) {
      keys.push(key);
    }

    return keys;
  }, []);
};

export const applyPositions = (schema: Schema, newKeys?: string[]) => {
  if (!newKeys?.length) {
    return;
  }

  const schemaItems = Object.values(schema);
  const sortedSchemaItems = sortBy(schemaItems, ({ position }) => position);

  // All the new schemaItems have a position of -1 by default, and on sort
  // the are at the front of the array, for the next step we don't want
  // to consider them as they will be dealt with in the next step.
  sortedSchemaItems.splice(0, newKeys.length);

  // This is to make all the items have contiguous positioning numbers
  // Note: It won't change the actual ordering of the fields.
  sortedSchemaItems.forEach(({ identifier }, index) => {
    schema[identifier].position = index;
  });

  const lastSchemaItemPosition = sortedSchemaItems.length - 1;

  newKeys.forEach((newKey, index) => {
    schema[newKey].position = lastSchemaItemPosition + index + 1;
  });
};

export const checkIfArrayAndSubDataTypeChanged = (
  currentData: any,
  prevData: any,
) => {
  if (!Array.isArray(currentData) || !Array.isArray(prevData)) return false;

  const currSubDataType = subDataTypeFor(currentData);
  const prevSubDataType = subDataTypeFor(prevData);

  return currSubDataType !== prevSubDataType;
};

export const hasNullOrUndefined = (items: any[]) =>
  items.includes(null) || items.includes(undefined);

class SchemaParser {
  static nameAndLabel = (key: string) => {
    return {
      name: key,
      label: startCase(key),
    };
  };

  static parse = (
    widgetName: string,
    currSourceData?: JSON,
    schema: Schema = {},
  ) => {
    if (!currSourceData) return schema;

    const prevSchema = (() => {
      const rootSchemaItem = schema[ROOT_SCHEMA_KEY];
      if (rootSchemaItem) return rootSchemaItem.children;

      return {};
    })();

    const rootSchemaItem = SchemaParser.getSchemaItemFor("", {
      currSourceData,
      prevSchema,
      sourceDataPath: "sourceData",
      widgetName,
    });

    return {
      [ROOT_SCHEMA_KEY]: rootSchemaItem,
    };
  };

  static getSchemaItemByFieldType = (
    fieldType: FieldType,
    options: SchemaItemsByFieldOptions,
  ) => {
    const { schema, schemaItem, schemaItemPath, widgetName } = options;
    const currSourceData = schemaItem.isCustomField
      ? FIELD_TYPE_TO_POTENTIAL_DATA[fieldType]
      : schemaItem.sourceData;

    const sourceDataPath = getSourceDataPathFromSchemaItemPath(
      schema,
      schemaItemPath,
    );

    const newSchemaItem = SchemaParser.getSchemaItemFor(schemaItem.identifier, {
      isCustomField: schemaItem.isCustomField,
      currSourceData,
      fieldType,
      widgetName,
      sourceDataPath,
    });

    const oldSchemaItemProperties = pick(schemaItem, [
      "name",
      "position",
      "label",
      "defaultValue",
    ]);

    if (schemaItem.isCustomField) {
      oldSchemaItemProperties.defaultValue = currSourceData;
    }

    return {
      ...newSchemaItem,
      ...oldSchemaItemProperties,
    };
  };

  static getSchemaItemFor = (
    key: string,
    options: ParserOptions,
  ): SchemaItem => {
    const {
      currSourceData,
      isCustomField = false,
      sourceDataPath,
      widgetName,
    } = options || {};

    const dataType = dataTypeFor(currSourceData);
    const fieldType = options.fieldType || fieldTypeFor(currSourceData);
    const FieldComponent = FIELD_MAP[fieldType];
    const { label, name } = SchemaParser.nameAndLabel(key);
    const { endTemplate, startTemplate } = getBindingTemplate(widgetName);

    const defaultValue = (() => {
      if (isCustomField) return "";

      const path = sourceDataPath
        ? `${startTemplate}${sourceDataPath}${endTemplate}`
        : "";

      return `${path}`;
    })();

    // Removing fieldType (which might have been passed by getSchemaItemByFieldType)
    // as it might bleed into subsequent schema item and force assign fieldType
    const sanitizedOptions = omit(options, ["fieldType"]);

    let children: Schema = {};
    if (dataType === DataType.OBJECT) {
      children = SchemaParser.convertObjectToSchema(sanitizedOptions);
    }

    if (dataType === DataType.ARRAY && fieldType === FieldType.ARRAY) {
      children = SchemaParser.convertArrayToSchema(sanitizedOptions);
    }

    return {
      ...FieldComponent.componentDefaultValues,
      children,
      dataType,
      defaultValue,
      fieldType,
      sourceData: currSourceData,
      isCustomField,
      label,
      name,
      identifier: name,
      position: -1,
    };
  };

  static getUnModifiedSchemaItemFor = (
    currData: JSON | string,
    schemaItem: SchemaItem,
    sourceDataPath: string,
    widgetName: string,
  ) => {
    let { children } = schemaItem;
    const { dataType, fieldType } = schemaItem;

    const options = {
      currSourceData: currData,
      prevSchema: children,
      sourceDataPath,
      widgetName,
    };

    if (dataType === DataType.OBJECT) {
      children = SchemaParser.convertObjectToSchema(options);
    }

    if (dataType === DataType.ARRAY && fieldType === FieldType.ARRAY) {
      children = SchemaParser.convertArrayToSchema(options);
    }

    return {
      ...schemaItem,
      sourceData: currData,
      children,
    };
  };

  static convertArrayToSchema = ({
    currSourceData = [],
    prevSchema = {},
    sourceDataPath,
    widgetName,
    ...rest
  }: ParserOptions): Schema => {
    const schema = cloneDeep(prevSchema);
    const currData = normalizeArrayValue(currSourceData as any[]);

    const prevDataType = schema[ARRAY_ITEM_KEY]?.dataType;
    const currDataType = dataTypeFor(currData);

    if (currDataType !== prevDataType) {
      schema[ARRAY_ITEM_KEY] = SchemaParser.getSchemaItemFor(ARRAY_ITEM_KEY, {
        ...rest,
        widgetName,
        currSourceData: currData,
        sourceDataPath: getSourcePath(0, sourceDataPath),
      });
    } else {
      schema[ARRAY_ITEM_KEY] = SchemaParser.getUnModifiedSchemaItemFor(
        currData,
        schema[ARRAY_ITEM_KEY],
        getSourcePath(0, sourceDataPath),
        widgetName,
      );
    }

    return schema;
  };

  static convertObjectToSchema = ({
    currSourceData = {},
    prevSchema = {},
    sourceDataPath,
    widgetName,
    ...rest
  }: ParserOptions): Schema => {
    const schema = cloneDeep(prevSchema);
    const currObj = currSourceData as Obj;

    const currKeys = Object.keys(currSourceData);
    const prevKeys = getKeysFromSchema(prevSchema);

    const newKeys = difference(currKeys, prevKeys);
    const removedKeys = difference(prevKeys, currKeys);
    const modifiedKeys = difference(currKeys, newKeys.concat(removedKeys));

    modifiedKeys.forEach((modifiedKey) => {
      const currDataType = dataTypeFor(currObj[modifiedKey]);
      const prevDataType = schema[modifiedKey].dataType;

      const isArrayAndSubDataTypeChanged = checkIfArrayAndSubDataTypeChanged(
        currObj[modifiedKey],
        schema[modifiedKey].sourceData,
      );

      /**
       * If a field in sourceData changes from string to null/undefined
       * we don't generate new schemaItem base on null/undefined
       * Use case - If the sourceData is bound to table's selected row and
       * in certain rows's columns do not have values i.e they are null/undefined
       * And when the user cycles over the rows, changing the sourceData, there will
       * be times when certain where the sourceData becomes undefined and if we process
       * that and get new schemaItem them the user would lose all it's field configuration.
       */

      const valuesHaveNullOrUndefined = hasNullOrUndefined([
        currObj[modifiedKey],
        schema[modifiedKey].sourceData,
      ]);

      if (
        !valuesHaveNullOrUndefined &&
        (isArrayAndSubDataTypeChanged || currDataType !== prevDataType)
      ) {
        const prevSchemaItem = cloneDeep(schema[modifiedKey]);

        schema[modifiedKey] = SchemaParser.getSchemaItemFor(modifiedKey, {
          ...rest,
          currSourceData: currObj[modifiedKey],
          prevSchema: schema[modifiedKey].children,
          sourceDataPath: getSourcePath(modifiedKey, sourceDataPath),
          widgetName,
        });

        schema[modifiedKey].position = prevSchemaItem.position;
      } else {
        schema[modifiedKey] = SchemaParser.getUnModifiedSchemaItemFor(
          currObj[modifiedKey],
          schema[modifiedKey],
          getSourcePath(modifiedKey, sourceDataPath),
          widgetName,
        );
      }
    });

    removedKeys.forEach((removedKey) => {
      delete schema[removedKey];
    });

    newKeys.forEach((newKey) => {
      schema[newKey] = SchemaParser.getSchemaItemFor(newKey, {
        ...rest,
        currSourceData: currObj[newKey],
        sourceDataPath: getSourcePath(newKey, sourceDataPath),
        widgetName,
      });
    });

    applyPositions(schema, newKeys);

    return schema;
  };
}

export default SchemaParser;
