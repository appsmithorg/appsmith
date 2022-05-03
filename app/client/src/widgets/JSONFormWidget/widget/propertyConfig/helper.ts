import { get } from "lodash";

import SchemaParser from "widgets/JSONFormWidget/schemaParser";
import {
  FieldType,
  SchemaItem,
  ARRAY_ITEM_KEY,
  Schema,
  HookResponse,
  ROOT_SCHEMA_KEY,
} from "../../constants";
import { getGrandParentPropertyPath, getParentPropertyPath } from "../helper";
import { JSONFormWidgetProps } from "..";
import { processSchemaItemAutocomplete } from "components/propertyControls/JSONFormComputeControl";

export type HiddenFnParams = [JSONFormWidgetProps, string];

export const fieldTypeUpdateHook = (
  props: JSONFormWidgetProps,
  propertyPath: string,
  fieldType: FieldType,
): HookResponse => {
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
    schemaItem.identifier === ARRAY_ITEM_KEY &&
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

  const compute = (cb: (props: TSchemaItem) => any) => cb(schemaItem);

  return {
    fieldTypeMatches,
    fieldTypeNotMatches,
    fieldTypeNotIncludes,
    compute,
  };
};

export const getAutocompleteProperties = (props: JSONFormWidgetProps) => {
  const { schema } = props;
  const rootSchemaItem = schema[ROOT_SCHEMA_KEY] || {};
  const { sourceData } = rootSchemaItem;

  const formData = processSchemaItemAutocomplete(rootSchemaItem);

  const fieldState = processSchemaItemAutocomplete(rootSchemaItem, {
    isVisible: true,
    isDisabled: true,
    isRequired: true,
    isValid: true,
  });

  return {
    sourceData,
    fieldState,
    formData,
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

/**
 * This hook updates the disabled state for array and object field types only
 * If such field is disabled then all the underlying fields are recursively
 * disabled by setting the isDisabled property in the schema and updating it
 * in the dsl.
 */
export const updateChildrenDisabledStateHook = (
  props: JSONFormWidgetProps,
  propertyPath: string,
  isDisabled: boolean,
): HookResponse => {
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
};
