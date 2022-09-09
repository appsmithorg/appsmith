import { klona } from "klona";
import { get, set } from "lodash";

import SchemaParser from "widgets/JSONFormWidget/schemaParser";
import {
  FieldType,
  SchemaItem,
  ARRAY_ITEM_KEY,
  Schema,
  HookResponse,
  FieldThemeStylesheet,
  ROOT_SCHEMA_KEY,
} from "../../constants";
import { getGrandParentPropertyPath, getParentPropertyPath } from "../helper";
import { JSONFormWidgetProps } from "..";
import { getFieldStylesheet } from "widgets/JSONFormWidget/helper";
import { AppTheme } from "entities/AppTheming";
import { processSchemaItemAutocomplete } from "components/propertyControls/JSONFormComputeControl";

export type HiddenFnParams = [JSONFormWidgetProps, string];

export const fieldTypeUpdateHook = (
  props: JSONFormWidgetProps,
  propertyPath: string,
  fieldType: FieldType,
): HookResponse => {
  const { childStylesheet, schema, widgetName } = props;
  const schemaItemPath = getParentPropertyPath(propertyPath);
  const schemaItem: SchemaItem = get(props, schemaItemPath, {});

  const newSchemaItem = SchemaParser.getSchemaItemByFieldType(fieldType, {
    schemaItem,
    schemaItemPath,
    schema,
    widgetName,
    fieldThemeStylesheets: childStylesheet,
  });

  /**
   * TODO(Ashit): Not suppose to update the whole schema but just
   * the path within the schema. This is just a hack to make sure
   * the new added paths gets into the dynamicBindingPathList until
   * the updateProperty function is fixed.
   */
  const updatedSchema = { schema: klona(schema) };
  set(updatedSchema, schemaItemPath, newSchemaItem);

  return [{ propertyPath: "schema", propertyValue: updatedSchema.schema }];
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
    schemaItem.fieldType === FieldType.OBJECT
  );
};

export const getSchemaItem = <TSchemaItem extends SchemaItem>(
  props: JSONFormWidgetProps,
  propertyPath: string,
) => {
  const parentPropertyPath = getParentPropertyPath(propertyPath);
  const schemaItem: TSchemaItem = get(props, parentPropertyPath, {});
  const propertyName = propertyPath.split(".").slice(-1)[0]; // schema.__root_schema__.age.borderRadius -> borderRadius

  const fieldTypeMatches = (fieldType: FieldType) =>
    fieldType === schemaItem.fieldType;

  const fieldTypeNotMatches = (fieldType: FieldType) =>
    fieldType !== schemaItem.fieldType;

  const fieldTypeNotIncludes = (
    fieldTypes: Readonly<FieldType[]> | FieldType[],
  ) => !fieldTypes.includes(schemaItem.fieldType);

  const fieldTypeIncludes = (fieldTypes: Readonly<FieldType[]> | FieldType[]) =>
    fieldTypes.includes(schemaItem.fieldType);

  const compute = <TReturnValue>(
    cb: (props: TSchemaItem, propertyName: string) => TReturnValue,
  ): TReturnValue => cb(schemaItem, propertyName);

  return {
    fieldTypeMatches,
    fieldTypeNotMatches,
    fieldTypeNotIncludes,
    fieldTypeIncludes,
    compute,
  };
};

export const getStylesheetValue = (
  props: JSONFormWidgetProps,
  propertyPath: string,
  widgetStylesheet?: AppTheme["stylesheet"][string],
) => {
  return getSchemaItem(props, propertyPath).compute(
    (schemaItem, propertyName) => {
      const fieldStylesheet = getFieldStylesheet(
        props.widgetName,
        schemaItem.fieldType,
        widgetStylesheet?.childStylesheet as FieldThemeStylesheet,
      );

      return fieldStylesheet[propertyName] || "";
    },
  );
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

export const isFieldTypeArrayOrObject = (
  props: JSONFormWidgetProps,
  propertyPath: string,
) => {
  const schemaItem: SchemaItem = get(props, propertyPath, {});
  return (
    schemaItem.fieldType === FieldType.ARRAY ||
    schemaItem.fieldType === FieldType.OBJECT
  );
};
