import { get } from "lodash";

import SchemaParser from "widgets/FormBuilderWidget/schemaParser";
import { FieldType, SchemaItem, ARRAY_ITEM_KEY } from "../../constants";
import { getGrandParentPropertyPath, getParentPropertyPath } from "../helper";
import { FormBuilderWidgetProps } from "..";

export type HiddenFnParams = [FormBuilderWidgetProps, string];

export const fieldTypeUpdateHook = (
  props: FormBuilderWidgetProps,
  propertyPath: string,
  fieldType: FieldType,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  const schemaItemPath = getParentPropertyPath(propertyPath);
  const schemaItem: SchemaItem = get(props, schemaItemPath, {});

  const newSchemaItem = SchemaParser.getSchemaItemByFieldType(
    schemaItem.name,
    fieldType,
    schemaItem,
  );

  return [{ propertyPath: schemaItemPath, propertyValue: newSchemaItem }];
};

export const hiddenIfArrayItemIsObject = (
  props: FormBuilderWidgetProps,
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

export const getSchemaItem = (
  props: FormBuilderWidgetProps,
  propertyPath: string,
) => {
  const parentPropertyPath = getParentPropertyPath(propertyPath);
  const schemaItem = get(props, parentPropertyPath, {}) as SchemaItem;

  const fieldTypeMatches = (fieldType: FieldType) =>
    fieldType === schemaItem.fieldType;

  const fieldTypeNotMatches = (fieldType: FieldType) =>
    fieldType !== schemaItem.fieldType;

  const fieldTypeNotIncludes = (
    fieldTypes: Readonly<FieldType[]> | FieldType[],
  ) => !fieldTypes.includes(schemaItem.fieldType);

  const then = (cb: (props: SchemaItem) => any) => cb(schemaItem);

  return {
    fieldTypeMatches,
    fieldTypeNotMatches,
    fieldTypeNotIncludes,
    then,
  };
};
