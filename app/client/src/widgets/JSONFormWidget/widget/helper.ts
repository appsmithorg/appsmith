import { isDynamicValue } from "utils/DynamicBindingUtils";
import { FieldValidityState } from ".";
import {
  ARRAY_ITEM_KEY,
  FieldType,
  FieldState,
  Schema,
  SchemaItem,
  AUTO_JS_ENABLED_FIELDS,
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

// This is an auxiliary function to the processFieldSchemaItem function
// that deals with object field type.
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

// This is an auxiliary function to the processFieldSchemaItem function
// that deals with array field type.
const processFieldArray = (
  schema: Schema,
  fieldValidityState: FieldValidityState,
) => {
  if (schema[ARRAY_ITEM_KEY] && Array.isArray(fieldValidityState)) {
    /**
     * We are iterating over the fieldValidityState and not the schema because
     * the fieldValidity state would tell us how many array items have been
     * rendered in the form and we would be able to generate the field state for
     * each array item rather than just one if schema was considered
     * Eg. if the form data has [{ foo: 10 }, {foo: null}]
     * we would have the validity state as  [{ isValid: true }, {isValid: false}]
     * and the field state would be
     * [
     *  {
     *    isDisabled: false,
     *    isVisible: true,
     *    isRequired: true,
     *    isValid: true
     *  },
     * {
     *    isDisabled: false,
     *    isVisible: true,
     *    isRequired: true,
     *    isValid: false
     *  }
     * ]
     */
    return fieldValidityState.map((fieldValidityStateItem) =>
      processFieldSchemaItem(schema[ARRAY_ITEM_KEY], fieldValidityStateItem),
    );
  }

  return [];
};

// This is an auxiliary function to the generateFieldState function
// where it processes a particular schemaItem. It returns a single
// schemaItem's field state
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

/**
 * This helper function generates the field state of a form.
 * A field state for a form like { name: "Tim", age: 10 } would look like
 * {
 *  name: {
 *    isDisabled: false,
 *    isVisible: true,
 *    isRequired: true,
 *    isValid: true
 *  },
 *  age: {
 *    isDisabled: false,
 *    isVisible: true,
 *    isRequired: true,
 *    isValid: true
 *  }
 * }
 *
 * It takes in the current schema (as it holds isDisabled, isVisible, isRequired properties)
 * and fieldValidityState which a separate object that holds the isValid property of all the fields
 * currently visible in the form.
 *
 * @param schema Current schema
 * @param fieldValidityState current validity state of the fields
 */
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

// Extracts property paths that should have JS mode enabled in the property pane
export const dynamicPropertyPathListFromSchema = (
  schema: Schema,
  basePath = "schema",
) => {
  const paths: string[] = [];
  Object.values(schema).forEach((schemaItem) => {
    const properties = AUTO_JS_ENABLED_FIELDS[schemaItem.fieldType];
    if (properties) {
      properties.forEach((property) => {
        const propertyValue = schemaItem[property];
        if (isDynamicValue(propertyValue)) {
          paths.push(`${basePath}.${schemaItem.identifier}.${property}`);
        }
      });
    }

    if (schemaItem.children) {
      const nestedPaths = dynamicPropertyPathListFromSchema(
        schemaItem.children,
        `${basePath}.${schemaItem.identifier}.children`,
      );
      paths.push(...nestedPaths);
    }
  });

  return paths;
};
