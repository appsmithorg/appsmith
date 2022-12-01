import {
  difference,
  isEmpty,
  merge,
  omit,
  pick,
  sortBy,
  startCase,
} from "lodash";
import { klona } from "klona";

import { sanitizeKey } from "widgets/WidgetUtils";
import {
  ARRAY_ITEM_KEY,
  DATA_TYPE_POTENTIAL_FIELD,
  DataType,
  FIELD_MAP,
  FIELD_TYPE_TO_POTENTIAL_DATA,
  FieldComponentBaseProps,
  FieldType,
  getBindingTemplate,
  RESTRICTED_KEYS,
  ROOT_SCHEMA_KEY,
  Schema,
  SchemaItem,
  FieldThemeStylesheet,
} from "./constants";
import { getFieldStylesheet } from "./helper";

type Obj = Record<string, unknown>;

type ParserOptions = {
  currSourceData?: unknown;
  fieldThemeStylesheets?: FieldThemeStylesheet;
  fieldType?: FieldType;
  isCustomField?: boolean;
  prevSchema?: Schema;
  schemaItem?: SchemaItem;
  // - skipDefaultValueProcessing
  // When an array type is detected, by default we want to process default value
  // only for the array field and keep every field below it as empty default.
  skipDefaultValueProcessing: boolean;
  sourceDataPath?: string;
  widgetName: string;
  identifier: string;
};

type SchemaItemsByFieldOptions = {
  fieldThemeStylesheets?: FieldThemeStylesheet;
  schema: Schema;
  schemaItem: SchemaItem;
  schemaItemPath: string;
  widgetName: string;
};

type GetKeysFromSchemaOptions = {
  onlyNonCustomFieldKeys?: boolean;
  onlyCustomFieldKeys?: boolean;
};

type ParseOptions = {
  currSourceData?: unknown;
  schema?: Schema;
  fieldThemeStylesheets?: FieldThemeStylesheet;
};

function isObject(val: unknown): val is Obj {
  return typeof val === "object" && !Array.isArray(val) && val !== null;
}

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
export const constructPlausibleObjectFromArray = (arrayOfObj: Obj[]) => {
  let plausibleObj = {};

  arrayOfObj.forEach((obj) => {
    plausibleObj = merge(plausibleObj, obj);
  });

  return plausibleObj;
};

/**
 * This method looks at the type of data "name" is i.e. either string or number and returns a string which can
 * act as a path of an object.
 *
 * @param name a string or a number, if string then represents an item in object and a number represents item in array.
 * @param basePath The path that the name should be appended to if present
 *
 * @example
 *  getSourcePath("age", "sourceData.profile") -> "sourceData.profile.age"
 *  getSourcePath(0, "sourceData.education") -> "sourceData.education[0]"
 */

export const getSourcePath = (name: string | number, basePath?: string) => {
  let nameWithNotation = name;

  if (typeof name === "string") {
    const sanitizedName = sanitizeKey(name);
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

/**
 * This method resolves the schema path to a source data path. As from a source data we create a schema, in certain
 * cases we have a schemaItemPath i.e "schema.__root_schema__.children.name" and we want equivalent path in the source data
 * which would be "sourceData.name"
 *
 * @param schema Schema object
 * @param schemaItemPath the schema item path that we are resolving
 */

export const getSourceDataPathFromSchemaItemPath = (
  schema: Schema,
  schemaItemPath: string,
) => {
  const keys = schemaItemPath.split("."); //schema.__root_schema__.children.name -> ["schema", ROOT_SCHEMA_KEY, "children", "name"]
  let clonedSchema = klona(schema);
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
        if (schemaItem.identifier === ARRAY_ITEM_KEY) {
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

/**
 *  This method tries to get an object out of an array for further process of the JSON data source
 *
 * @param data any array data
 *
 * @example
 *  normalizeArrayValue([""]) -> ""
 *  normalizeArrayValue([{ foo: 10 }, { bar: "hello"}]) -> { foo: 10, bar: "hello" }
 */
export const normalizeArrayValue = (data: any[]) => {
  if (subDataTypeFor(data) === DataType.OBJECT) {
    return constructPlausibleObjectFromArray(data);
  }

  return data[0];
};

export const fieldTypeFor = (value: any): FieldType => {
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
        return FieldType.MULTISELECT;
    }
  }

  if (dataType === DataType.STRING) {
    const DateField = FIELD_MAP[FieldType.DATEPICKER];
    const EmailField = FIELD_MAP[FieldType.EMAIL_INPUT];

    if (
      EmailField?.isValidType?.(value, { fieldType: FieldType.EMAIL_INPUT })
    ) {
      return FieldType.EMAIL_INPUT;
    }

    if (DateField?.isValidType?.(value)) {
      return FieldType.DATEPICKER;
    }
  }

  return potentialFieldType;
};

const extractProperties = (
  schemaItem: SchemaItem,
  properties: (keyof SchemaItem)[],
) => properties.map((property) => schemaItem[property]);

/**
 * Returns keys mentioned in keyProperties from schemaItems present in schema.
 * By default it will look into all the field. This setting can be altered by providing
 * options i.e setting onlyCustomFieldKeys to true would return keys from customField schemaItem
 * setting onlyNonCustomFieldKeys to true would return keys from regular schemaItem
 *
 */
export const getKeysFromSchema = (
  schema: Schema,
  keyProperties: (keyof SchemaItem)[],
  options?: GetKeysFromSchemaOptions,
) => {
  const { onlyCustomFieldKeys = false, onlyNonCustomFieldKeys = false } =
    options || {};

  return Object.values(schema).reduce<string[]>((keys, schemaItem) => {
    if (
      (onlyCustomFieldKeys && schemaItem.isCustomField) ||
      (onlyNonCustomFieldKeys && !schemaItem.isCustomField) ||
      (!onlyCustomFieldKeys && !onlyNonCustomFieldKeys)
    ) {
      return [...keys, ...extractProperties(schemaItem, keyProperties)];
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

/**
 * This function checks if both the currentData and prevData are arrays.
 * If they both are, then the function checks if the sub data type has changed or not
 *
 * @example
 *  checkIfArrayAndSubDataTypeChanged(["test"], ["test"]) -> false
 *  checkIfArrayAndSubDataTypeChanged(["test"], [10]) -> true
 *  checkIfArrayAndSubDataTypeChanged(["test"], [{ name: 10 }]) -> true
 *  checkIfArrayAndSubDataTypeChanged(["test"], "test") -> false
 */
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

/**
 * This function sanitizes the key by looking at existing keys in the current schema
 * It considers the "identifier" and the "name" property.
 *
 * @param key The key that is to be sanitized
 * @param schema current schema
 */
export const sanitizeSchemaItemKey = (key: string, schema: Schema) => {
  const existingKeys = [
    ...getKeysFromSchema(schema, ["identifier"]),
    ...RESTRICTED_KEYS,
  ];

  return sanitizeKey(key, { existingKeys });
};

class SchemaParser {
  /**
   * This method parses the source data and converts it into a schema. The passing of previous schema ensures
   * micro parsing to occur i.e only the parts where the source data is modified is parsed and the rest is left as is.
   *
   * @param widgetName name of the current widget (This helps in assigning defaultValue bindings)
   * @param currSourceData The source data for parsing
   * @param schema Previous generated schema if present.
   */
  static parse = (widgetName: string, options: ParseOptions) => {
    const { currSourceData, schema = {}, fieldThemeStylesheets } = options;
    if (!currSourceData) return schema;

    const prevSchema = (() => {
      const rootSchemaItem = schema[ROOT_SCHEMA_KEY];
      if (rootSchemaItem) return rootSchemaItem.children;

      return {};
    })();

    const rootSchemaItem = SchemaParser.getSchemaItemFor("", {
      currSourceData,
      fieldThemeStylesheets,
      identifier: ROOT_SCHEMA_KEY,
      prevSchema,
      skipDefaultValueProcessing: false,
      sourceDataPath: "sourceData",
      widgetName,
    });

    rootSchemaItem.originalIdentifier = ROOT_SCHEMA_KEY;
    rootSchemaItem.accessor = ROOT_SCHEMA_KEY;

    return {
      [ROOT_SCHEMA_KEY]: rootSchemaItem,
    };
  };

  /**
   * getSchemaItemByFieldType generates a schemaItem based on the field type passed. This
   * method is useful when the field type is modified in the property pane.
   *
   * @param fieldType The field type that we want the schemaItem to convert to.
   * @param options configuration options
   */
  static getSchemaItemByFieldType = (
    fieldType: FieldType,
    options: SchemaItemsByFieldOptions,
  ) => {
    const {
      fieldThemeStylesheets,
      schema,
      schemaItem,
      schemaItemPath,
      widgetName,
    } = options;

    const sourceDataPath = getSourceDataPathFromSchemaItemPath(
      schema,
      schemaItemPath,
    );

    const currSourceData = (() => {
      const potentialData = FIELD_TYPE_TO_POTENTIAL_DATA[fieldType];
      if (schemaItem.isCustomField) {
        return potentialData;
      }

      // This is for the case where a non custom field type is changed from a primitive type
      // to an array type. In that case we first check if the sourceData has an array value
      // if not then we assign a generic one so that it gets parsed as an array when getSchemaItemFor
      // is called else it might error out as the fieldType would be array but the sourceData would not be an array.
      if (
        fieldType === FieldType.ARRAY &&
        dataTypeFor(schemaItem.sourceData) !== DataType.ARRAY
      ) {
        return [{}];
      }

      return schemaItem.sourceData;
    })();

    const newSchemaItem = SchemaParser.getSchemaItemFor(schemaItem.identifier, {
      currSourceData,
      fieldThemeStylesheets,
      fieldType,
      identifier: schemaItem.identifier,
      isCustomField: schemaItem.isCustomField,
      skipDefaultValueProcessing: false,
      sourceDataPath,
      widgetName,
    });

    // We try to salvage some of the properties that we do not want to get modified by the
    // new generated schemaItem that we got from the getSchemaItem
    const oldSchemaItemProperties = pick(schemaItem, [
      "accessor",
      "label",
      "originalIdentifier",
      "position",
    ]);

    if (schemaItem.isCustomField) {
      newSchemaItem.defaultValue = currSourceData;
    }

    if (!schemaItem.isCustomField) {
      newSchemaItem.dataType = schemaItem.dataType;
      newSchemaItem.sourceData = schemaItem.sourceData;
      newSchemaItem.defaultValue = schemaItem.defaultValue;
    }

    return merge(newSchemaItem, oldSchemaItemProperties);
  };

  /**
   * This method returns a schemaItem for a key and it's sourceData. This is a recursive method i.e if
   * an array or object is encountered it will call convertObjectToSchema or convertArrayToSchema respectively
   * and that in turn would call this method. If a primitive data type is detected for the source data, it would
   * return the default values for the particular auto-detected field type.
   */
  static getSchemaItemFor = (
    key: string,
    options: ParserOptions,
  ): SchemaItem => {
    const {
      currSourceData,
      fieldThemeStylesheets,
      identifier,
      isCustomField = false,
      skipDefaultValueProcessing,
      sourceDataPath,
      widgetName,
    } = options || {};

    const dataType = dataTypeFor(currSourceData);
    const fieldType = options.fieldType || fieldTypeFor(currSourceData);
    const FieldComponent = FIELD_MAP[fieldType];
    const bindingTemplate = getBindingTemplate(widgetName);
    const fieldStylesheet = getFieldStylesheet(
      widgetName,
      fieldType,
      fieldThemeStylesheets,
    );

    const defaultValue = (() => {
      if (isCustomField || skipDefaultValueProcessing) return;

      const { prefixTemplate, suffixTemplate } = bindingTemplate;

      const path = sourceDataPath
        ? `${prefixTemplate}${sourceDataPath}${suffixTemplate}`
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

    // Field default values (that are attached to the react field component)
    // can either be an object or a function.
    const componentDefaultValues = (() => {
      const { componentDefaultValues } = FieldComponent;
      let defaultValues: FieldComponentBaseProps;
      if (typeof componentDefaultValues === "function") {
        defaultValues = componentDefaultValues({
          sourceDataPath,
          fieldType,
          bindingTemplate,
          isCustomField,
          sourceData: currSourceData,
          skipDefaultValueProcessing,
        });
      } else if (!componentDefaultValues) {
        defaultValues = {
          isDisabled: false,
          isRequired: false,
          isVisible: true,
          label: "",
        };
      } else {
        defaultValues = componentDefaultValues;
      }

      if (isCustomField || skipDefaultValueProcessing) {
        defaultValues = omit(defaultValues, "defaultValue");
      }

      return {
        ...defaultValues,
        label: startCase(key) || key || defaultValues?.label || "",
      };
    })();

    return {
      children,
      dataType,
      defaultValue,
      fieldType,
      sourceData: currSourceData,
      isCustomField,
      accessor: key,
      identifier,
      position: -1,
      originalIdentifier: key,
      ...fieldStylesheet,
      ...componentDefaultValues,
    };
  };

  // getUnModifiedSchemaItemFor is called when we want to process a field whose
  // data type is not changed. It returns the schema item as is except the children
  // which is further processed and based on it's changes the children is fetched and
  // returned in the schemaItem object
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

  // This method deals with the conversion of array data to a schema
  static convertArrayToSchema = ({
    currSourceData,
    fieldThemeStylesheets,
    prevSchema = {},
    sourceDataPath,
    widgetName,
    ...rest
  }: Omit<ParserOptions, "identifier">): Schema => {
    const schema = klona(prevSchema);

    if (!Array.isArray(currSourceData)) {
      return schema;
    }

    const currData = normalizeArrayValue(currSourceData);

    const prevDataType = schema[ARRAY_ITEM_KEY]?.dataType;
    const currDataType = dataTypeFor(currData);

    if (currDataType !== prevDataType) {
      schema[ARRAY_ITEM_KEY] = SchemaParser.getSchemaItemFor(ARRAY_ITEM_KEY, {
        ...rest,
        currSourceData: currData,
        fieldThemeStylesheets,
        identifier: ARRAY_ITEM_KEY,
        skipDefaultValueProcessing: true,
        sourceDataPath: getSourcePath(0, sourceDataPath),
        widgetName,
      });
    } else {
      schema[ARRAY_ITEM_KEY] = SchemaParser.getUnModifiedSchemaItemFor({
        currSourceData: currData,
        fieldThemeStylesheets,
        identifier: ARRAY_ITEM_KEY,
        schemaItem: schema[ARRAY_ITEM_KEY],
        skipDefaultValueProcessing: true,
        sourceDataPath: getSourcePath(0, sourceDataPath),
        widgetName,
      });
    }

    return schema;
  };

  // This method deals with the conversion of object data to a schema
  static convertObjectToSchema = ({
    currSourceData,
    prevSchema = {},
    sourceDataPath,
    widgetName,
    ...rest
  }: Omit<ParserOptions, "identifier">): Schema => {
    const schema = klona(prevSchema);
    const origIdentifierToIdentifierMap = mapOriginalIdentifierToSanitizedIdentifier(
      schema,
    );

    if (!isObject(currSourceData)) {
      return schema;
    }
    const customFieldAccessors = getKeysFromSchema(prevSchema, ["accessor"], {
      onlyCustomFieldKeys: true,
    });

    /**
     * This removes all the keys are present in the currSourceData that matches/exists
     * as a custom field.
     * Removing custom field keys from the currKeys and prevKeys eliminates the chance of
     * such keys getting picked up by newKeys/removedKeys/modifiedKeys thus completely removes
     * the chance of any processing on them.
     */
    const currKeys = difference(
      Object.keys(currSourceData),
      customFieldAccessors,
    );
    // Only looking into the non custom field keys
    const prevKeys = getKeysFromSchema(prevSchema, ["originalIdentifier"], {
      onlyNonCustomFieldKeys: true,
    });

    const newKeys = difference(currKeys, prevKeys);
    const removedKeys = difference(prevKeys, currKeys);
    const modifiedKeys = difference(currKeys, newKeys.concat(removedKeys));

    modifiedKeys.forEach((modifiedKey) => {
      const identifier = origIdentifierToIdentifierMap[modifiedKey];
      const prevSchemaItem = klona(schema[identifier]);
      const currData = currSourceData[modifiedKey];
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
          identifier,
        });

        schema[identifier].position = prevSchemaItem.position;
      } else {
        schema[identifier] = SchemaParser.getUnModifiedSchemaItemFor({
          ...rest,
          currSourceData: currData,
          schemaItem: prevSchemaItem,
          sourceDataPath: getSourcePath(modifiedKey, sourceDataPath),
          identifier,
          widgetName,
        });
      }
    });

    removedKeys.forEach((removedKey) => {
      const identifier = origIdentifierToIdentifierMap[removedKey];
      delete schema[identifier];
    });

    const newAddedKeys: string[] = [];
    newKeys.forEach((newKey) => {
      const schemaItem = SchemaParser.getSchemaItemFor(newKey, {
        ...rest,
        currSourceData: currSourceData[newKey],
        sourceDataPath: getSourcePath(newKey, sourceDataPath),
        identifier: sanitizeSchemaItemKey(newKey, schema),
        widgetName,
      });

      schema[schemaItem.identifier] = schemaItem;
      newAddedKeys.push(schemaItem.identifier);
    });

    applyPositions(schema, newAddedKeys);

    return schema;
  };
}

export default SchemaParser;
