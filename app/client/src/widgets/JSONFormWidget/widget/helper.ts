import { FieldValidityState } from ".";
import {
  ARRAY_ITEM_KEY,
  FieldType,
  FieldState,
  Schema,
  SchemaItem,
} from "../constants";

type FieldMetaState = FieldState<{
  isRequired?: boolean;
  isVisible?: boolean;
  isDisabled?: boolean;
  isValid?: boolean;
}>;

// propertyPath -> "schema[0].children[0].fieldType"
// returns parentPropertyPath -> "schema[0].children[0]"
export const getParentPropertyPath = (propertyPath: string) => {
  const propertyPathChunks = propertyPath.split(".");

  return propertyPathChunks.slice(0, -1).join(".");
};

// propertyPath -> "schema[0].children[0].props.options"
// returns grandParentPropertyPath -> "schema[0].children[0]"
export const getGrandParentPropertyPath = (propertyPath: string) => {
  const propertyPathChunks = propertyPath.split(".");

  return propertyPathChunks.slice(0, -2).join(".");
};

const processFieldObject = (
  schema: Schema,
  fieldValidityState: Record<string, any> = {},
) => {
  const obj: FieldMetaState = {};

  Object.values(schema).forEach((schemaItem) => {
    const { name } = schemaItem;
    obj[name] = processFieldSchemaItem(schemaItem, fieldValidityState[name]);
  });

  return obj;
};

const processFieldArray = (
  schema: Schema,
  fieldValidityState: FieldValidityState,
) => {
  if (schema[ARRAY_ITEM_KEY] && Array.isArray(fieldValidityState)) {
    return fieldValidityState.map((fieldValidityStateItem) =>
      processFieldSchemaItem(schema[ARRAY_ITEM_KEY], fieldValidityStateItem),
    );
  }

  return [];
};

const processFieldSchemaItem = (
  schemaItem: SchemaItem,
  fieldValidityState: FieldValidityState,
): FieldMetaState => {
  if (schemaItem.fieldType === FieldType.OBJECT) {
    return processFieldObject(schemaItem.children, fieldValidityState);
  }

  if (schemaItem.fieldType === FieldType.ARRAY) {
    return processFieldArray(schemaItem.children, fieldValidityState);
  }

  const { isDisabled, isRequired, isVisible } = schemaItem;
  let isValid;
  if (
    !Array.isArray(fieldValidityState) &&
    typeof fieldValidityState?.isValid === "boolean"
  ) {
    isValid = fieldValidityState.isValid;
  }

  return ({
    isDisabled,
    isVisible,
    isRequired,
    isValid,
  } as unknown) as FieldMetaState;
};

export const generateFieldState = (
  schema: Schema,
  fieldValidityState: FieldValidityState,
) => {
  let fieldState = {};
  if (schema) {
    Object.values(schema).forEach((schemaItem) => {
      fieldState = processFieldSchemaItem(schemaItem, fieldValidityState);
    });
  }

  return fieldState;
};
