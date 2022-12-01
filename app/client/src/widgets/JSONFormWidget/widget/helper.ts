import equal from "fast-deep-equal/es6";
import { difference, isEmpty } from "lodash";
import log from "loglevel";
import AnalyticsUtil from "utils/AnalyticsUtil";

import { isDynamicValue } from "utils/DynamicBindingUtils";
import { MetaInternalFieldState } from ".";
import {
  ARRAY_ITEM_KEY,
  AUTO_JS_ENABLED_FIELDS,
  FieldState,
  FieldThemeStylesheet,
  FieldType,
  JSON,
  MAX_ALLOWED_FIELDS,
  Schema,
  SchemaItem,
} from "../constants";
import { countFields } from "../helper";
import SchemaParser from "../schemaParser";

type FieldStateItem = {
  isRequired?: boolean;
  isVisible?: boolean;
  isDisabled?: boolean;
  isValid?: boolean;
  filterText?: string;
};

type MetaFieldState = FieldState<FieldStateItem>;

type PathList = Array<{ key: string }>;
type ComputedSchema = {
  status: ComputedSchemaStatus;
  schema: Schema;
  dynamicPropertyPathList?: PathList;
};

type ComputeSchemaProps = {
  currSourceData?: JSON;
  prevSourceData?: JSON;
  prevSchema?: Schema;
  widgetName: string;
  currentDynamicPropertyPathList?: PathList;
  fieldThemeStylesheets: FieldThemeStylesheet;
};

export enum ComputedSchemaStatus {
  LIMIT_EXCEEDED = "LIMIT_EXCEEDED",
  UNCHANGED = "UNCHANGED",
  UPDATED = "UPDATED",
}

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
  metaInternalFieldState: Record<string, any> = {},
) => {
  const obj: Record<string, FieldStateItem> = {};

  Object.values(schema).forEach((schemaItem) => {
    const { accessor, identifier } = schemaItem;
    obj[accessor] = processFieldSchemaItem(
      schemaItem,
      metaInternalFieldState[identifier],
    ) as FieldStateItem;
  });

  return obj;
};

// This is an auxiliary function to the processFieldSchemaItem function
// that deals with array field type.
const processFieldArray = (
  schema: Schema,
  metaInternalFieldState: MetaInternalFieldState,
): MetaFieldState[] => {
  if (schema[ARRAY_ITEM_KEY] && Array.isArray(metaInternalFieldState)) {
    /**
     * We are iterating over the metaInternalFieldState and not the schema because
     * the metaInternalField state would tell us how many array items have been
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
    return metaInternalFieldState.map((metaFieldStateItem) =>
      processFieldSchemaItem(schema[ARRAY_ITEM_KEY], metaFieldStateItem),
    ) as MetaFieldState[];
  }

  return [];
};

// This is an auxiliary function to the generateFieldState function
// where it processes a particular schemaItem. It returns a single
// schemaItem's field state
const processFieldSchemaItem = (
  schemaItem: SchemaItem,
  metaInternalFieldState: MetaInternalFieldState,
): FieldStateItem | MetaFieldState => {
  if (schemaItem.fieldType === FieldType.OBJECT) {
    return processFieldObject(schemaItem.children, metaInternalFieldState);
  }

  if (schemaItem.fieldType === FieldType.ARRAY) {
    return processFieldArray(schemaItem.children, metaInternalFieldState);
  }

  const { isDisabled, isRequired, isVisible } = schemaItem;
  const fieldState: FieldStateItem = {
    isDisabled,
    isRequired,
    isVisible,
  };

  fieldState.isDisabled = isDisabled;

  if (
    !Array.isArray(metaInternalFieldState) &&
    typeof metaInternalFieldState === "object"
  ) {
    if (typeof metaInternalFieldState?.isValid === "boolean") {
      fieldState.isValid = metaInternalFieldState.isValid;
    }

    if (typeof metaInternalFieldState.filterText === "string") {
      fieldState.filterText = metaInternalFieldState.filterText;
    }
  }

  return fieldState;
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
 * and metaInternalFieldState which a separate object that holds the isValid property of all the fields
 * currently visible in the form.
 *
 * @param schema Current schema
 * @param metaFieldState current validity state of the fields
 */
export const generateFieldState = (
  schema: Schema,
  metaFieldState: MetaInternalFieldState,
) => {
  let fieldState = {};
  if (schema) {
    Object.values(schema).forEach((schemaItem) => {
      fieldState = processFieldSchemaItem(schemaItem, metaFieldState);
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

const computeDynamicPropertyPathList = (
  schema: Schema,
  currentDynamicPropertyPathList?: PathList,
) => {
  const pathListFromSchema = dynamicPropertyPathListFromSchema(schema);
  const pathListFromProps = (currentDynamicPropertyPathList || []).map(
    ({ key }) => key,
  );

  const newPaths = difference(pathListFromSchema, pathListFromProps);

  return [...pathListFromProps, ...newPaths].map((path) => ({ key: path }));
};

/**
 * Compute schema parses the currSourceData and returns the schema.
 */
export const computeSchema = ({
  currentDynamicPropertyPathList,
  currSourceData,
  fieldThemeStylesheets,
  prevSchema = {},
  prevSourceData,
  widgetName,
}: ComputeSchemaProps): ComputedSchema => {
  // Hot path - early exit
  if (isEmpty(currSourceData) || equal(prevSourceData, currSourceData)) {
    return {
      status: ComputedSchemaStatus.UNCHANGED,
      schema: prevSchema,
    };
  }

  const count = countFields(currSourceData);
  if (count > MAX_ALLOWED_FIELDS) {
    AnalyticsUtil.logEvent("WIDGET_PROPERTY_UPDATE", {
      widgetType: "JSON_FORM_WIDGET",
      widgetName,
      propertyName: "sourceData",
      updatedValue: currSourceData,
      metaInfo: {
        limitExceeded: true,
        currentLimit: MAX_ALLOWED_FIELDS,
      },
    });

    return {
      status: ComputedSchemaStatus.LIMIT_EXCEEDED,
      schema: prevSchema,
    };
  }

  const start = performance.now();

  const schema = SchemaParser.parse(widgetName, {
    fieldThemeStylesheets,
    currSourceData,
    schema: prevSchema,
  });

  log.debug(
    "JSONForm widget schema parsing took",
    performance.now() - start,
    "ms",
  );

  const dynamicPropertyPathList = computeDynamicPropertyPathList(
    schema,
    currentDynamicPropertyPathList,
  );

  return {
    status: ComputedSchemaStatus.UPDATED,
    dynamicPropertyPathList,
    schema,
  };
};
