import { Alignment } from "@blueprintjs/core";
import { ColumnProperties } from "../component/Constants";
import { TableWidgetProps } from "../constants";
import { Colors } from "constants/Colors";
import { get } from "lodash";

export enum ColumnTypes {
  TEXT = "text",
  URL = "url",
  NUMBER = "number",
  IMAGE = "image",
  VIDEO = "video",
  DATE = "date",
  BUTTON = "button",
  ICON_BUTTON = "iconButton",
  MENU_BUTTON = "menuButton",
}

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
  let propertiesToUpdate = [{ propertyPath, propertyValue }];
  const updateDerivedColumnsHookArr = updateDerivedColumnsHook(
    props,
    propertyPath,
    propertyValue,
  );
  if (updateDerivedColumnsHookArr) {
    propertiesToUpdate = [
      ...updateDerivedColumnsHookArr,
      ...propertiesToUpdate,
    ];
  }

  if (iconAlign) {
    propertiesToUpdate.push({
      propertyPath: "iconAlign",
      propertyValue: Alignment.LEFT,
    });
  }

  return propertiesToUpdate;
}

// A hook for handling property updates when the primaryColumns
// has changed and it is supposed to update the derivedColumns
// For example, when we add a new column or update a derived column's name
// The propertyPath will be of the type `primaryColumns.columnId`
// Handling BindingProperty of derived columns
export const updateDerivedColumnsHook = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  let propertiesToUpdate: Array<{
    propertyPath: string;
    propertyValue: any;
  }> = [];
  if (props && propertyValue) {
    // If we're adding a column, we need to add it to the `derivedColumns` property as well
    if (/^primaryColumns\.\w+$/.test(propertyPath)) {
      const newId = propertyValue.id;
      if (newId) {
        // sets default value for some properties
        propertyValue.buttonColor = Colors.GREEN;
        propertyValue.menuColor = Colors.GREEN;
        propertyValue.labelColor = Colors.WHITE;

        propertiesToUpdate = [
          {
            propertyPath: `derivedColumns.${newId}`,
            propertyValue,
          },
        ];
      }

      const oldColumnOrder = props.columnOrder || [];
      const newColumnOrder = [...oldColumnOrder, propertyValue.id];
      propertiesToUpdate.push({
        propertyPath: "columnOrder",
        propertyValue: newColumnOrder,
      });
    }
    // If we're updating a columns' name, we need to update the `derivedColumns` property as well.
    const regex = /^primaryColumns\.(\w+)\.(.*)$/;
    if (regex.test(propertyPath)) {
      const matches = propertyPath.match(regex);
      if (matches && matches.length === 3) {
        // updated to use column keys
        const columnId = matches[1];
        const columnProperty = matches[2];
        const primaryColumn = props.primaryColumns[columnId];
        const isDerived = primaryColumn ? primaryColumn.isDerived : false;

        const { derivedColumns = {} } = props;

        if (isDerived && derivedColumns && derivedColumns[columnId]) {
          propertiesToUpdate = [
            {
              propertyPath: `derivedColumns.${columnId}.${columnProperty}`,
              propertyValue: propertyValue,
            },
          ];
        }
      }
    }
    if (propertiesToUpdate.length > 0) return propertiesToUpdate;
  }
  return;
};
// Gets the base property path excluding the current property.
// For example, for  `primaryColumns[5].computedValue` it will return
// `primaryColumns[5]`
export const getBasePropertyPath = (
  propertyPath: string,
): string | undefined => {
  try {
    const propertyPathRegex = /^(.*)\.\w+$/g;
    const matches = [...propertyPath.matchAll(propertyPathRegex)][0];
    if (matches && Array.isArray(matches) && matches.length === 2) {
      return matches[1];
    }
    return;
  } catch (e) {
    return;
  }
};

// Hide column which are not included in the array params
export const hideByColumnType = (
  props: TableWidgetProps,
  propertyPath: string,
  columnTypes: ColumnTypes[],
  shouldUsePropertyPath?: boolean,
) => {
  const baseProperty = shouldUsePropertyPath
    ? propertyPath
    : getBasePropertyPath(propertyPath);
  const columnType = get(props, `${baseProperty}.columnType`, "");
  return !columnTypes.includes(columnType);
};
