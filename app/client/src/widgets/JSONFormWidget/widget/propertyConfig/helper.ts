import { get } from "lodash";

import SchemaParser, {
  sanitizeSchemaItemKey,
} from "widgets/JSONFormWidget/schemaParser";
import { FieldType, SchemaItem, ARRAY_ITEM_KEY, Schema } from "../../constants";
import { getGrandParentPropertyPath, getParentPropertyPath } from "../helper";
import { JSONFormWidgetProps } from "..";

export type HiddenFnParams = [JSONFormWidgetProps, string];

export const fieldTypeUpdateHook = (
  props: JSONFormWidgetProps,
  propertyPath: string,
  fieldType: FieldType,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  const { schema, widgetName } = props;
  const schemaItemPath = getParentPropertyPath(propertyPath);
  const schemaItem: SchemaItem = get(props, schemaItemPath, {});

  const options = {
    schemaItem,
    schemaItemPath,
    schema,
    widgetName,
  };

  const newSchemaItem = SchemaParser.getSchemaItemByFieldType(
    fieldType,
    options,
  );

  return [{ propertyPath: schemaItemPath, propertyValue: newSchemaItem }];
};

export const hiddenIfArrayItemIsObject = (
  props: JSONFormWidgetProps,
  propertyPath: string,
  options?: { checkGrandParentPath: boolean },
) => {
  const pathFinder = options?.checkGrandParentPath
    ? getGrandParentPropertyPath
    : getParentPropertyPath;
  const path = pathFinder(propertyPath);

  const schemaItem: SchemaItem = get(props, path, {});

  return (
    schemaItem.name === ARRAY_ITEM_KEY &&
    (schemaItem.fieldType === FieldType.OBJECT ||
      schemaItem.fieldType === FieldType.ARRAY)
  );
};

export const getSchemaItem = <TSchemaItem extends SchemaItem>(
  props: JSONFormWidgetProps,
  propertyPath: string,
) => {
  const parentPropertyPath = getParentPropertyPath(propertyPath);
  const schemaItem: TSchemaItem = get(props, parentPropertyPath, {});

  const fieldTypeMatches = (fieldType: FieldType) =>
    fieldType === schemaItem.fieldType;

  const fieldTypeNotMatches = (fieldType: FieldType) =>
    fieldType !== schemaItem.fieldType;

  const fieldTypeNotIncludes = (
    fieldTypes: Readonly<FieldType[]> | FieldType[],
  ) => !fieldTypes.includes(schemaItem.fieldType);

  const then = (cb: (props: TSchemaItem) => any) => cb(schemaItem);

  return {
    fieldTypeMatches,
    fieldTypeNotMatches,
    fieldTypeNotIncludes,
    then,
  };
};

const getUpdatedSchemaFor = (
  schema: Schema,
  propertyName: string,
  propertyValue: any,
) => {
  const keys = Object.keys(schema);
  const newSchema: Schema = {};

  keys.forEach((key) => {
    newSchema[key] = {
      ...schema[key],
      children: getUpdatedSchemaFor(
        schema[key]?.children || {},
        propertyName,
        propertyValue,
      ),
      [propertyName]: propertyValue,
    };
  });

  return newSchema;
};

// This hook updates the disabled state for array and object field types only
// If such field is disabled then all the underlying fields are recursively
// disabled by setting the isDisabled property in the schema and updating it
// in the dsl.
export const updateChildrenDisabledStateHook = (
  props: JSONFormWidgetProps,
  propertyPath: string,
  isDisabled: boolean,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  const schemaItemPath = getParentPropertyPath(propertyPath);
  const schemaItem: SchemaItem = get(props, schemaItemPath, {});

  if (
    schemaItem.fieldType === FieldType.ARRAY ||
    schemaItem.fieldType === FieldType.OBJECT
  ) {
    const newChildrenSchema = getUpdatedSchemaFor(
      schemaItem.children,
      "isDisabled",
      isDisabled,
    );

    return [
      {
        propertyPath: `${schemaItemPath}.children`,
        propertyValue: newChildrenSchema,
      },
    ];
  }

  return;
};

// This hook updates the name property based on the "accessor" property value
// The "accessor" property acts like a staging area for the value to be validated
// and if the "accessor" value is deemed a valid key then it is used in the "name"
// property.
export const accessorUpdateHook = (
  props: JSONFormWidgetProps,
  propertyPath: string,
  accessor: string,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  const schemaItemPath = getParentPropertyPath(propertyPath);
  const schemaPath = getGrandParentPropertyPath(propertyPath);
  const schema: Schema = get(props, schemaPath, {});

  if (sanitizeSchemaItemKey(accessor, schema) === accessor) {
    return [
      {
        propertyPath: `${schemaItemPath}.name`,
        propertyValue: accessor,
      },
    ];
  }

  return;
};
