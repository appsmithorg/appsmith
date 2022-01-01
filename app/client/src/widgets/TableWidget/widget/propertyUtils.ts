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

export function defaultSelectedRowValidation(
  value: unknown,
  props: TableWidgetProps,
  _: any,
) {
  if (props) {
    if (props.multiRowSelection) {
      if (_.isString(value)) {
        const trimmed = (value as string).trim();
        try {
          const parsedArray = JSON.parse(trimmed);
          if (Array.isArray(parsedArray)) {
            const sanitized = parsedArray.filter((entry) => {
              return (
                Number.isInteger(parseInt(entry, 10)) &&
                parseInt(entry, 10) > -1
              );
            });
            return { isValid: true, parsed: sanitized };
          } else {
            throw Error("Not a stringified array");
          }
        } catch (e) {
          // If cannot be parsed as an array
          const arrayEntries = trimmed.split(",");
          const result: number[] = [];
          arrayEntries.forEach((entry: string) => {
            if (
              Number.isInteger(parseInt(entry, 10)) &&
              parseInt(entry, 10) > -1
            ) {
              if (!_.isNil(entry)) result.push(parseInt(entry, 10));
            }
          });
          return { isValid: true, parsed: result };
        }
      }
      if (Array.isArray(value)) {
        const sanitized = value.filter((entry) => {
          return (
            Number.isInteger(parseInt(entry, 10)) && parseInt(entry, 10) > -1
          );
        });
        return { isValid: true, parsed: sanitized };
      }
      if (Number.isInteger(value) && (value as number) > -1) {
        return { isValid: true, parsed: [value] };
      }
      return {
        isValid: false,
        parsed: [],
        message: `This value does not match type: number[]`,
      };
    } else {
      try {
        const _value: string = value as string;

        if (_value === "") {
          return {
            isValid: true,
            parsed: undefined,
          };
        }
        if (Number.isInteger(parseInt(_value, 10)) && parseInt(_value, 10) > -1)
          return { isValid: true, parsed: parseInt(_value, 10) };

        return {
          isValid: true,
          parsed: -1,
        };
      } catch (e) {
        return {
          isValid: true,
          parsed: -1,
        };
      }
    }
  }
  return {
    isValid: true,
    parsed: value,
  };
}

export function totalRecordsCountValidation(
  value: unknown,
  props: TableWidgetProps,
  _?: any,
) {
  if (_.isNil(value) || value === "") {
    return {
      isValid: true,
      parsed: 0,
      message: "",
    };
  }
  if (!Number.isFinite(value) && !_.isString(value)) {
    return {
      isValid: false,
      parsed: 0,
      message: "This value must be a number",
    };
  }
  if (_.isString(value) && !/^\d+\.?\d*$/.test(value as string)) {
    return {
      isValid: false,
      parsed: 0,
      message: "This value must be a number",
    };
  }
  return {
    isValid: true,
    parsed: Number(value),
    message: "",
  };
}

export function uniqueColumnNameValidation(
  value: unknown,
  props: TableWidgetProps,
  _?: any,
) {
  const tableColumns = _.map(value, "label");
  const duplicates = tableColumns.filter(
    (val: string, index: number, arr: string[]) => arr.indexOf(val) !== index,
  );
  const hasError = !!duplicates.length;
  if (value && hasError) {
    return {
      isValid: false,
      parsed: value,
      messages: ["Column names should be unique."],
    };
  }
  return {
    isValid: true,
    parsed: value,
    messages: [],
  };
}

// A hook to update all column styles when global table styles are updated
export const updateColumnStyles = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  const { primaryColumns, derivedColumns = {} } = props;
  const propertiesToUpdate: Array<{
    propertyPath: string;
    propertyValue: any;
  }> = [];
  const tokens = propertyPath.split("."); // horizontalAlignment/textStyle
  const currentStyleName = tokens[0];
  // TODO: Figure out how propertyPaths will work when a nested property control is updating another property
  if (primaryColumns && currentStyleName) {
    // The style being updated currently

    // for each primary column
    Object.values(primaryColumns).map((column: ColumnProperties) => {
      // Current column property path
      const propertyPath = `primaryColumns.${column.id}.${currentStyleName}`;
      // Is current column a derived column
      const isDerived = primaryColumns[column.id].isDerived;

      // If it is a derived column and it exists in derivedColumns
      if (isDerived && derivedColumns[column.id]) {
        propertiesToUpdate.push({
          propertyPath: `derivedColumns.${column.id}.${currentStyleName}`,
          propertyValue: propertyValue,
        });
      }
      // Is this a dynamic binding property?
      const notADynamicBinding =
        !props.dynamicBindingPathList ||
        props.dynamicBindingPathList.findIndex(
          (item) => item.key === propertyPath,
        ) === -1;

      if (notADynamicBinding) {
        propertiesToUpdate.push({
          propertyPath: `primaryColumns.${column.id}.${currentStyleName}`,
          propertyValue: propertyValue,
        });
      }
    });
    if (propertiesToUpdate.length > 0) return propertiesToUpdate;
  }
  return;
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
