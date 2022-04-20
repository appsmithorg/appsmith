import { Alignment } from "@blueprintjs/core";
import { CellAlignmentTypes, ColumnProperties } from "../component/Constants";
import { ColumnTypes, TableWidgetProps } from "../constants";
import _, { get } from "lodash";
import { Colors } from "constants/Colors";

export function totalRecordsCountValidation(
  value: unknown,
  props: TableWidgetProps,
  _?: any,
) {
  const ERROR_MESSAGE = "This value must be a number";
  const defaultValue = 0;

  /*
   * Undefined, null and empty string
   */
  if (_.isNil(value) || value === "") {
    return {
      isValid: true,
      parsed: defaultValue,
      message: [""],
    };
  } else if (
    (!_.isFinite(value) && !_.isString(value)) ||
    (_.isString(value) && !/^\d+\.?\d*$/.test(value as string))
  ) {
    /*
     * objects, array, string (but not cast-able to number type)
     */
    return {
      isValid: false,
      parsed: defaultValue,
      message: [ERROR_MESSAGE],
    };
  } else {
    /*
     * Number or number type cast-able
     */
    return {
      isValid: true,
      parsed: Number(value),
      message: [""],
    };
  }
}

export function uniqueColumnNameValidation(
  value: unknown,
  props: TableWidgetProps,
  _?: any,
) {
  const tableColumnLabels = _.map(value, "label");
  const duplicates = tableColumnLabels.find(
    (val: string, index: number, arr: string[]) => arr.indexOf(val) !== index,
  );

  if (value && !!duplicates) {
    return {
      isValid: false,
      parsed: value,
      messages: ["Column names should be unique."],
    };
  } else {
    return {
      isValid: true,
      parsed: value,
      messages: [""],
    };
  }
}

export function uniqueColumnAliasValidation(
  value: unknown,
  props: TableWidgetProps,
  _?: any,
) {
  const aliases = _.map(Object.values(props.primaryColumns), "alias");
  const duplicates = aliases.find(
    (val: string, index: number, arr: string[]) => arr.indexOf(val) !== index,
  );

  if (!value) {
    return {
      isValid: false,
      parsed: value,
      messages: ["Property name should not be empty."],
    };
  } else if (value && !!duplicates) {
    return {
      isValid: false,
      parsed: value,
      messages: ["Property names should be unique."],
    };
  } else {
    return {
      isValid: true,
      parsed: value,
      messages: [""],
    };
  }
}

/*
 * Hook to update all column styles, when global table styles are updated.
 */
export const updateColumnStyles = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  const { primaryColumns = {} } = props;
  const propertiesToUpdate: Array<{
    propertyPath: string;
    propertyValue: any;
  }> = [];
  const styleName = propertyPath.split(".").shift();

  // TODO: Figure out how propertyPaths will work when a nested property control is updating another property
  if (primaryColumns && styleName) {
    Object.values(primaryColumns).map((column: ColumnProperties) => {
      const propertyPath = `primaryColumns.${column.id}.${styleName}`;

      const notADynamicBinding =
        !props.dynamicBindingPathList ||
        props.dynamicBindingPathList.findIndex(
          (item) => item.key === propertyPath,
        ) === -1;

      if (notADynamicBinding) {
        propertiesToUpdate.push({
          propertyPath,
          propertyValue,
        });
      }
    });

    if (propertiesToUpdate.length > 0) {
      return propertiesToUpdate;
    }
  } else {
    return;
  }
};

// Select default Icon Alignment when an icon is chosen
export function updateIconAlignment(
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: string,
) {
  const property = getBasePropertyPath(propertyPath);
  const iconAlign = get(props, `${property}.iconAlign`, "");
  const propertiesToUpdate = [{ propertyPath, propertyValue }];

  if (iconAlign) {
    propertiesToUpdate.push({
      propertyPath: "iconAlign",
      propertyValue: Alignment.LEFT,
    });
  }

  return propertiesToUpdate;
}

/*
 * Hook that updates columns order when a new column
 * gets added to the primaryColumns
 */
export const updateColumnOrderHook = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  const propertiesToUpdate: Array<{
    propertyPath: string;
    propertyValue: any;
  }> = [];
  if (props && propertyValue && /^primaryColumns\.\w+$/.test(propertyPath)) {
    const oldColumnOrder = props.columnOrder || [];
    const newColumnOrder = [...oldColumnOrder, propertyValue.id];
    propertiesToUpdate.push({
      propertyPath: "columnOrder",
      propertyValue: newColumnOrder,
    });

    const newId = propertyValue.id;
    if (newId) {
      // sets default value for some properties
      propertyValue.buttonColor = Colors.GREEN;
      propertyValue.menuColor = Colors.GREEN;
      propertyValue.labelColor = Colors.WHITE;

      propertiesToUpdate.push({
        propertyPath: `primaryColumns.${newId}`,
        propertyValue,
      });
    }
  }

  if (propertiesToUpdate.length > 0) {
    return propertiesToUpdate;
  } else {
    return;
  }
};

const ACCESSOR_PATH_REGEX = /^primaryColumns\.(\w+)\.alias$/;
/*
 * Hook that updates accesor map and computedValue when a alias
 * is updated.
 */
export const updateColumnAccessorHook = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  if (props && propertyValue && ACCESSOR_PATH_REGEX.test(propertyPath)) {
    const match = ACCESSOR_PATH_REGEX.exec(propertyPath) || [];
    const columnIdHash = match[1];
    const columnId =
      props.primaryColumns &&
      props.primaryColumns[columnIdHash] &&
      props.primaryColumns[columnIdHash].originalId;

    if (columnId) {
      const propertiesToUpdate = [];
      propertiesToUpdate.push({
        propertyPath: "aliasMap",
        propertyValue: { ...props.aliasMap, [columnId]: propertyValue },
      });

      return propertiesToUpdate;
    } else {
      return;
    }
  } else {
    return;
  }
};

const EDITABLITY_PATH_REGEX = /^primaryColumns\.(\w+)\.isCellEditable$/;
/*
 * Hook that updates column leve editability when cell level editability is
 * updaed.
 */
export const updateColumnLevelEditability = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  if (props && propertyValue && EDITABLITY_PATH_REGEX.test(propertyPath)) {
    const match = EDITABLITY_PATH_REGEX.exec(propertyPath) || [];
    const columnIdHash = match[1];

    if (columnIdHash) {
      return [
        {
          propertyPath: `primaryColumns.${columnIdHash}.isEditable`,
          propertyValue: propertyValue,
        },
      ];
    } else {
      return;
    }
  } else {
    return;
  }
};

/*
 * Gets the base property path excluding the current property.
 * For example, for  `primaryColumns[5].computedValue` it will return
 * `primaryColumns[5]`
 */
export const getBasePropertyPath = (
  propertyPath: string,
): string | undefined => {
  const propertyPathRegex = /^(.*)\.\w+$/g;
  const matches = [...propertyPath.matchAll(propertyPathRegex)][0];
  if (matches && _.isArray(matches) && matches.length === 2) {
    return matches[1];
  } else {
    return;
  }
};

/*
 * Function to check if column should be hidden, based on
 * the given columnTypes
 */
export const hideByColumnType = (
  props: TableWidgetProps,
  propertyPath: string,
  columnTypes: ColumnTypes[],
  shouldUsePropertyPath?: boolean,
) => {
  let baseProperty;

  if (shouldUsePropertyPath) {
    baseProperty = propertyPath;
  } else {
    baseProperty = getBasePropertyPath(propertyPath);
  }

  const columnType = get(props, `${baseProperty}.columnType`, "");
  return !columnTypes.includes(columnType);
};

export const SelectColumnOptionsValidations = (
  value: unknown,
  props: any,
  _?: any,
) => {
  let isValid = true;
  let parsed = value;
  let message = "";
  const expectedMessage = "value should be an array of string";

  if (typeof value === "string" && value.trim() !== "") {
    /*
     * when value is a string
     */
    try {
      /*
       * when the value is an array of string
       */
      value = JSON.parse(value);
    } catch (e) {
      /*
       * when the value is an comma seperated strings
       */
      value = (value as string).split(",").map((str) => str.trim());
    }
  }
  /*
   * when value is null, undefined and empty string
   */
  if (_.isNil(value) || value === "") {
    isValid = true;
    parsed = [];
  } else if (_.isArray(value)) {
    const hasStringOrNumber = (value as []).every(
      (item) => _.isString(item) || _.isFinite(item),
    );
    isValid = hasStringOrNumber;
    parsed = value;
    message = hasStringOrNumber ? "" : expectedMessage;
  } else if (typeof value === "number") {
    isValid = true;
    parsed = [value];
  } else {
    isValid = false;
    parsed = value;
    message = expectedMessage;
  }

  return {
    isValid,
    parsed,
    messages: [message],
  };
};

/*
 * Hook that updates column isDiabled binding when columnType is
 * changed to ColumnTypes.EDIT_ACTIONS.
 */
export const updateEditActionsColumnEventsHook = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  if (propertyValue === ColumnTypes.EDIT_ACTIONS) {
    const baseProperty = getBasePropertyPath(propertyPath);
    const isDisabled = get(props, `${baseProperty}.isDisabled`, "");
    const widgetName = get(props, "widgetName", "");
    const propertiesToUpdate = [];

    if (typeof isDisabled === "boolean" && widgetName) {
      propertiesToUpdate.push({
        propertyPath: `${baseProperty}.isDisabled`,
        propertyValue: `{{${widgetName}.processedTableData.map((currentRow, currentIndex) => ( !${widgetName}.updatedRowIndices.includes(currentIndex)))}}`,
      });
    }

    propertiesToUpdate.push({
      propertyPath: `${baseProperty}.isSaveVisible`,
      propertyValue: true,
    });
  }

  return;
};

export const updateNumberColumnTypeTextAlignment = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  const baseProperty = getBasePropertyPath(propertyPath);

  if (propertyValue === ColumnTypes.NUMBER) {
    return [
      {
        propertyPath: `${baseProperty}.horizontalAlignment`,
        propertyValue: CellAlignmentTypes.RIGHT,
      },
    ];
  } else {
    return [
      {
        propertyPath: `${baseProperty}.horizontalAlignment`,
        propertyValue: CellAlignmentTypes.LEFT,
      },
    ];
  }

  return;
};
