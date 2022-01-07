import {
  cloneDeep,
  difference,
  isEmpty,
  omit,
  pick,
  sortBy,
  startCase,
} from "lodash";
import { sanitizeKey } from "widgets/WidgetUtils";
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
  FieldComponentBaseProps,
  RESTRICTED_KEYS,
} from "./constants";

type Obj = Record<string, any>;
type JSON = Obj | Obj[];

type ParserOptions = {
  currSourceData?: JSON | string;
  fieldType?: FieldType;
  isCustomField?: boolean;
  prevSchema?: Schema;
  schemaItem?: SchemaItem;
  // - skipDefaultValueProcessing
  // When an array type is detected, by default we want to process default value
  // only for the array level and keep every every field below it as empty default.
  skipDefaultValueProcessing: boolean;
  sourceDataPath?: string;
  widgetName: string;
  sanitizedKey: string;
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
  let nameWithNotation = name;

  if (typeof name === "string") {
    const sanitizedName = typeof name === "string" && sanitizeKey(name);
    nameWithNotation = `.${name}`;

    if (sanitizedName !== name) {
      nameWithNotation = `["${name}"]`;
    }
  }

  if (typeof name === "number") {
    nameWithNotation = `[${name}]`;
  }

  return basePath ? `${basePath}${nameWithNotation}` : `${nameWithNotation}`;
};

export const getSourceDataPathFromSchemaItemPath = (
  schema: Schema,
  schemaItemPath: string,
) => {
  const keys = schemaItemPath.split("."); //schema.__root_schema__.children.name -> ["schema", "__root_schema__", "children", "name"]
  let clonedSchema = cloneDeep(schema);
  let sourceDataPath = "sourceData";
  let schemaItem: SchemaItem;
  let skipIteration = false;
  let hasObjectParent = false;

  keys.forEach((key, index) => {
    // Skipping index 0 as it starts with "schema"
    if (index !== 0 && !skipIteration) {
      schemaItem = clonedSchema[key];

      if (!schemaItem) return;

      if (index !== 1) {
        if (schemaItem.identifier === "__array_item__") {
          sourceDataPath = sourceDataPath.concat("[0]");
        } else if (hasObjectParent) {
          const identifier =
            schemaItem.originalIdentifier !== schemaItem.identifier
              ? `["${schemaItem.originalIdentifier}"]`
              : `.${schemaItem.identifier}`;

          sourceDataPath = sourceDataPath.concat(identifier);
        }
      }

      hasObjectParent = schemaItem.dataType === DataType.OBJECT;

      if (!isEmpty(schemaItem.children)) {
        clonedSchema = schemaItem.children;
        skipIteration = true;
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
      case DataType.ARRAY:
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

export const getKeysFromSchema = (
  schema: Schema,
  keyProperty: keyof SchemaItem,
  { includeCustomField = false },
) => {
  return Object.values(schema).reduce<string[]>((keys, schemaItem) => {
    if (
      includeCustomField ||
      (!includeCustomField && !schemaItem.isCustomField)
    ) {
      return [...keys, schemaItem[keyProperty]];
    }

    return keys;
  }, []);
};

export const mapOriginalIdentifierToSanitizedIdentifier = (schema: Schema) => {
  const map: Record<string, string> = {};
  Object.values(schema).map(({ identifier, originalIdentifier }) => {
    map[originalIdentifier] = identifier;
  });

  return map;
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
      skipDefaultValueProcessing: false,
      sanitizedKey: "",
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
    const sourceDataPath = getSourceDataPathFromSchemaItemPath(
      schema,
      schemaItemPath,
    );

    const currSourceData = (() => {
      const potentialData = FIELD_TYPE_TO_POTENTIAL_DATA[fieldType];
      if (schemaItem.isCustomField) {
        return potentialData;
      }

      if (
        fieldType === FieldType.ARRAY &&
        dataTypeFor(schemaItem.sourceData) !== DataType.ARRAY
      ) {
        return [{}];
      }

      return schemaItem.sourceData;
    })();

    const newSchemaItem = SchemaParser.getSchemaItemFor(schemaItem.identifier, {
      isCustomField: schemaItem.isCustomField,
      currSourceData,
      fieldType,
      widgetName,
      sourceDataPath,
      skipDefaultValueProcessing: false,
      sanitizedKey: schemaItem.identifier,
    });

    const oldSchemaItemProperties = pick(schemaItem, [
      "name",
      "position",
      "identifier",
      "originalIdentifier",
      "label",
    ]);

    if (schemaItem.isCustomField) {
      newSchemaItem.defaultValue = currSourceData;
    }

    if (!schemaItem.isCustomField) {
      newSchemaItem.dataType = schemaItem.dataType;
      newSchemaItem.sourceData = schemaItem.sourceData;
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
      sanitizedKey,
      skipDefaultValueProcessing,
      sourceDataPath,
      widgetName,
    } = options || {};

    const dataType = dataTypeFor(currSourceData);
    const fieldType = options.fieldType || fieldTypeFor(currSourceData);
    const FieldComponent = FIELD_MAP[fieldType];
    const bindingTemplate = getBindingTemplate(widgetName);

    const defaultValue = (() => {
      if (isCustomField || skipDefaultValueProcessing) return;

      const { endTemplate, startTemplate } = bindingTemplate;

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

    const componentDefaultValues = (() => {
      const { componentDefaultValues } = FieldComponent;
      let defaultValues = componentDefaultValues as FieldComponentBaseProps;
      if (typeof componentDefaultValues === "function") {
        defaultValues = componentDefaultValues({
          sourceDataPath,
          fieldType,
          bindingTemplate,
          isCustomField,
          sourceData: currSourceData,
          skipDefaultValueProcessing,
        });
      }

      return {
        ...defaultValues,
        label: startCase(key) || key || defaultValues.label,
      };
    })();

    return {
      children,
      dataType,
      defaultValue,
      fieldType,
      sourceData: currSourceData,
      isCustomField,
      name: sanitizedKey,
      identifier: sanitizedKey,
      position: -1,
      originalIdentifier: key,
      ...componentDefaultValues,
    };
  };

  static getUnModifiedSchemaItemFor = ({
    currSourceData,
    schemaItem = {} as SchemaItem,
    ...rest
  }: ParserOptions) => {
    let { children } = schemaItem;
    const { dataType, fieldType } = schemaItem;

    const options = {
      ...rest,
      currSourceData,
      prevSchema: children,
    };

    if (dataType === DataType.OBJECT) {
      children = SchemaParser.convertObjectToSchema(options);
    }

    if (dataType === DataType.ARRAY && fieldType === FieldType.ARRAY) {
      children = SchemaParser.convertArrayToSchema(options);
    }

    return {
      ...schemaItem,
      sourceData: currSourceData,
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
        skipDefaultValueProcessing: true,
        sanitizedKey: ARRAY_ITEM_KEY,
      });
    } else {
      schema[ARRAY_ITEM_KEY] = SchemaParser.getUnModifiedSchemaItemFor({
        currSourceData: currData,
        schemaItem: schema[ARRAY_ITEM_KEY],
        sourceDataPath: getSourcePath(0, sourceDataPath),
        widgetName,
        skipDefaultValueProcessing: true,
        sanitizedKey: ARRAY_ITEM_KEY,
      });
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
    const origIdentifierToIdentifierMap = mapOriginalIdentifierToSanitizedIdentifier(
      schema,
    );
    const currObj = currSourceData as Obj;

    const currKeys = Object.keys(currSourceData);
    const prevKeys = getKeysFromSchema(prevSchema, "originalIdentifier", {
      includeCustomField: false,
    });

    const newKeys = difference(currKeys, prevKeys);
    const removedKeys = difference(prevKeys, currKeys);
    const modifiedKeys = difference(currKeys, newKeys.concat(removedKeys));

    modifiedKeys.forEach((modifiedKey) => {
      const identifier = origIdentifierToIdentifierMap[modifiedKey];
      const prevSchemaItem = cloneDeep(schema[identifier]);
      const currData = currObj[modifiedKey];
      const prevData = prevSchemaItem.sourceData;
      const currDataType = dataTypeFor(currData);
      const prevDataType = schema[identifier].dataType;

      const isArrayAndSubDataTypeChanged = checkIfArrayAndSubDataTypeChanged(
        currData,
        prevData,
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
        currData,
        prevData,
      ]);

      if (
        !valuesHaveNullOrUndefined &&
        (isArrayAndSubDataTypeChanged || currDataType !== prevDataType)
      ) {
        schema[identifier] = SchemaParser.getSchemaItemFor(modifiedKey, {
          ...rest,
          currSourceData: currData,
          prevSchema: prevSchemaItem.children,
          sourceDataPath: getSourcePath(modifiedKey, sourceDataPath),
          widgetName,
          sanitizedKey: identifier,
        });

        schema[identifier].position = prevSchemaItem.position;
      } else {
        schema[identifier] = SchemaParser.getUnModifiedSchemaItemFor({
          ...rest,
          currSourceData: currData,
          schemaItem: prevSchemaItem,
          sourceDataPath: getSourcePath(modifiedKey, sourceDataPath),
          sanitizedKey: identifier,
          widgetName,
        });
      }
    });

    removedKeys.forEach((removedKey) => {
      const identifier = origIdentifierToIdentifierMap[removedKey];
      delete schema[identifier];
    });

    const newSanitizedKeys: string[] = [];
    const existingKeys = [
      ...getKeysFromSchema(schema, "identifier", { includeCustomField: true }),
      ...RESTRICTED_KEYS,
    ];
    newKeys.forEach((newKey) => {
      const schemaItem = SchemaParser.getSchemaItemFor(newKey, {
        ...rest,
        currSourceData: currObj[newKey],
        sourceDataPath: getSourcePath(newKey, sourceDataPath),
        sanitizedKey: sanitizeKey(newKey, { existingKeys }),
        widgetName,
      });

      schema[schemaItem.identifier] = schemaItem;
      newSanitizedKeys.push(schemaItem.identifier);
      existingKeys.push(schemaItem.identifier);
    });

    applyPositions(schema, newSanitizedKeys);

    return schema;
  };
}

export default SchemaParser;
