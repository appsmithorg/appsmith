import { Alignment } from "@blueprintjs/core";
import type { ColumnProperties } from "../component/Constants";
import { StickyType } from "../component/Constants";
import { CellAlignmentTypes } from "../component/Constants";
import type { TableWidgetProps } from "../constants";
import { ColumnTypes, InlineEditingSaveOptions } from "../constants";
import _, { findIndex, get, isBoolean } from "lodash";
import { Colors } from "constants/Colors";
import {
  combineDynamicBindings,
  getDynamicBindings,
} from "utils/DynamicBindingUtils";
import {
  createEditActionColumn,
  generateNewColumnOrderFromStickyValue,
} from "./utilities";
import type { PropertyUpdates } from "WidgetProvider/constants";
import { MenuItemsSource } from "widgets/MenuButtonWidget/constants";
import type { ValidationConfig } from "constants/PropertyControlConstants";
import type { ValidationResponse } from "constants/WidgetValidation";

export function totalRecordsCountValidation(
  value: unknown,
  props: TableWidgetProps,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      messages: [],
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
      messages: [{ name: "ValidationError", message: ERROR_MESSAGE }],
    };
  } else {
    /*
     * Number or number type cast-able
     */
    return {
      isValid: true,
      parsed: Number(value),
      messages: [],
    };
  }
}

export function uniqueColumnNameValidation(
  value: unknown,
  props: TableWidgetProps,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  propertyValue: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  const { primaryColumns = {} } = props;
  const propertiesToUpdate: Array<{
    propertyPath: string;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  propertyValue: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  const propertiesToUpdate: Array<{
    propertyPath: string;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propertyValue: any;
  }> = [];

  if (props && propertyValue && /^primaryColumns\.\w+$/.test(propertyPath)) {
    const newColumnOrder = [...(props.columnOrder || [])];

    const rightColumnIndex = findIndex(
      newColumnOrder,
      (colName: string) =>
        props.primaryColumns[colName]?.sticky === StickyType.RIGHT,
    );

    if (rightColumnIndex !== -1) {
      newColumnOrder.splice(rightColumnIndex, 0, propertyValue.id);
    } else {
      newColumnOrder.splice(newColumnOrder.length, 0, propertyValue.id);
    }

    propertiesToUpdate.push({
      propertyPath: "columnOrder",
      propertyValue: newColumnOrder,
    });

    const newId = propertyValue.id;

    if (newId) {
      // sets default value for some properties
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

const EDITABLITY_PATH_REGEX = /^primaryColumns\.(\w+)\.isEditable$/;

function isMatchingEditablePath(propertyPath: string) {
  return (
    EDITABLITY_PATH_REGEX.test(propertyPath) ||
    CELL_EDITABLITY_PATH_REGEX.test(propertyPath)
  );
}

export const updateInlineEditingOptionDropdownVisibilityHook = (
  props: TableWidgetProps,
  propertyPath: string,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  propertyValue: any,
): Array<PropertyUpdates> | undefined => {
  let propertiesToUpdate = [];

  if (
    props &&
    !props.showInlineEditingOptionDropdown &&
    propertyValue &&
    isMatchingEditablePath(propertyPath)
  ) {
    propertiesToUpdate.push({
      propertyPath: `showInlineEditingOptionDropdown`,
      propertyValue: true,
    });
  }

  if (
    props &&
    isMatchingEditablePath(propertyPath) &&
    props.inlineEditingSaveOption === InlineEditingSaveOptions.ROW_LEVEL &&
    isBoolean(propertyValue)
  ) {
    if (propertyValue) {
      const editActionsColumn = Object.values(props.primaryColumns).find(
        (column) => column.columnType === ColumnTypes.EDIT_ACTIONS,
      );

      if (!editActionsColumn) {
        propertiesToUpdate = [
          ...propertiesToUpdate,
          ...createEditActionColumn(props),
        ];
      }
    } else {
      const regex = /^primaryColumns\.(\w+)\.(\w+)$/;
      const columnIdMatcher = propertyPath.match(regex);
      const columnId = columnIdMatcher && columnIdMatcher[1];
      const isAtleastOneColumnEditablePresent = Object.values(
        props.primaryColumns,
      ).some((column) => column.id !== columnId && column.isEditable);

      if (!isAtleastOneColumnEditablePresent) {
        const columnsArray = Object.values(props.primaryColumns);
        const edtiActionColumn = columnsArray.find(
          (column) => column.columnType === ColumnTypes.EDIT_ACTIONS,
        );

        if (edtiActionColumn && edtiActionColumn.id) {
          const newColumnOrder = _.difference(props.columnOrder, [
            edtiActionColumn.id,
          ]);

          propertiesToUpdate = [
            ...propertiesToUpdate,
            {
              propertyPath: `primaryColumns.${edtiActionColumn.id}`,
              shouldDeleteProperty: true,
            },
            {
              propertyPath: "columnOrder",
              propertyValue: newColumnOrder,
            },
          ];
        }
      }
    }
  }

  if (propertiesToUpdate.length) {
    return propertiesToUpdate;
  }

  return;
};

const CELL_EDITABLITY_PATH_REGEX = /^primaryColumns\.(\w+)\.isCellEditable$/;

/**
 * Hook that updates frozen column's old indices and also adds columns to the frozen positions.
 */
export const updateColumnOrderWhenFrozen = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: string,
) => {
  if (props && props.columnOrder) {
    const newColumnOrder = generateNewColumnOrderFromStickyValue(
      props.primaryColumns,
      props.columnOrder,
      propertyPath.split(".")[1],
      propertyValue,
    );

    return [
      {
        propertyPath: "columnOrder",
        propertyValue: newColumnOrder,
      },
    ];
  }
};
/*
 * Hook that updates column level editability when cell level editability is
 * updaed.
 */
export const updateColumnLevelEditability = (
  props: TableWidgetProps,
  propertyPath: string,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  propertyValue: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  if (
    props &&
    CELL_EDITABLITY_PATH_REGEX.test(propertyPath) &&
    isBoolean(propertyValue)
  ) {
    const match = CELL_EDITABLITY_PATH_REGEX.exec(propertyPath) || [];
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

/*
 * Function to check if column should be shown, based on
 * the given columnTypes
 */
export const showByColumnType = (
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

  return columnTypes.includes(columnType);
};

export const SelectColumnOptionsValidations = (
  value: unknown,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
export const updateInlineEditingSaveOptionHook = (
  props: TableWidgetProps,
  propertyPath: string,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  propertyValue: any,
): Array<PropertyUpdates> | undefined => {
  if (propertyValue !== InlineEditingSaveOptions.ROW_LEVEL) {
    const columnsArray = Object.values(props.primaryColumns);
    const edtiActionColumn = columnsArray.find(
      (column) => column.columnType === ColumnTypes.EDIT_ACTIONS,
    );

    if (edtiActionColumn && edtiActionColumn.id) {
      const newColumnOrder = _.difference(props.columnOrder, [
        edtiActionColumn.id,
      ]);

      return [
        {
          propertyPath: `primaryColumns.${edtiActionColumn.id}`,
          shouldDeleteProperty: true,
        },
        {
          propertyPath: "columnOrder",
          propertyValue: newColumnOrder,
        },
      ];
    }
  } else {
    const columnIdMatcher = propertyPath.match(EDITABLITY_PATH_REGEX);
    const columnId = columnIdMatcher && columnIdMatcher[1];
    const isAtleastOneEditableColumnPresent = Object.values(
      props.primaryColumns,
    ).some((column) => column.id !== columnId && column.isEditable);

    if (isAtleastOneEditableColumnPresent) {
      return createEditActionColumn(props);
    }
  }
};

export const updateNumberColumnTypeTextAlignment = (
  props: TableWidgetProps,
  propertyPath: string,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  propertyValue: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

/**
 * updates theme stylesheets
 *
 * @param props
 * @param propertyPath
 * @param propertyValue
 */
export function updateThemeStylesheetsInColumns(
  props: TableWidgetProps,
  propertyPath: string,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  propertyValue: any,
): Array<PropertyUpdates> | undefined {
  const regex = /^primaryColumns\.(\w+)\.(.*)$/;
  const matches = propertyPath.match(regex);
  const columnId = matches?.[1];
  const columnProperty = matches?.[2];

  if (columnProperty === "columnType") {
    const propertiesToUpdate: Array<PropertyUpdates> = [];
    const oldColumnType = get(props, `primaryColumns.${columnId}.columnType`);
    const newColumnType = propertyValue;

    const propertiesToRemove = Object.keys(
      props.childStylesheet[oldColumnType] || {},
    );

    const propertiesToAdd = Object.keys(
      props.childStylesheet[newColumnType] || {},
    );

    propertiesToRemove.forEach((propertyKey) => {
      propertiesToUpdate.push({
        propertyPath: `primaryColumns.${columnId}.${propertyKey}`,
        shouldDeleteProperty: true,
      });
    });

    propertiesToAdd.forEach((propertyKey) => {
      const { jsSnippets, stringSegments } = getDynamicBindings(
        props.childStylesheet[newColumnType][propertyKey],
      );

      const js = combineDynamicBindings(jsSnippets, stringSegments);

      propertiesToUpdate.push({
        propertyPath: `primaryColumns.${columnId}.${propertyKey}`,
        propertyValue: `{{${props.widgetName}.processedTableData.map((currentRow, currentIndex) => ( ${js}))}}`,
      });
    });

    if (propertiesToUpdate.length) {
      /*
       * Temporary patch to make evaluations to compute inverseDependencyMap when
       * column type is changed.
       * TODO(Balaji): remove once https://github.com/appsmithorg/appsmith/issues/14436 gets fixed
       */
      propertiesToUpdate.push({
        propertyPath: `primaryColumns.${columnId}.customAlias`,
        propertyValue: "",
      });

      return propertiesToUpdate;
    }
  }
}

/**
 * A function for updateHook to remove the boxShadowColor property post migration.
 * @param props
 * @param propertyPath
 * @param propertyValue
 */
export const removeBoxShadowColorProp = (
  props: TableWidgetProps,
  propertyPath: string,
) => {
  const boxShadowColorPath = replacePropertyName(
    propertyPath,
    "boxShadowColor",
  );

  return [
    {
      propertyPath: boxShadowColorPath,
      propertyValue: undefined,
    },
  ];
};

/**
 * This function will replace the property present at the end of the propertyPath with the targetPropertyName.
 * e.g.
 * propertyPath = primaryColumns.action.boxShadow
 * Running this function will give the new propertyPath like below:
 * propertyPath = primaryColumns.action.boxShadowColor
 *
 * @param propertyPath The property path inside a widget
 * @param targetPropertyName Target property name
 * @returns New property path with target property name at the end.
 */
export const replacePropertyName = (
  propertyPath: string,
  targetPropertyName: string,
) => {
  const path = propertyPath.split(".");

  path.pop();

  return `${path.join(".")}.${targetPropertyName}`;
};

export const updateCustomColumnAliasOnLabelChange = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: unknown,
): Array<PropertyUpdates> | undefined => {
  // alias will be updated along with label change only for custom columns
  const regex = /^primaryColumns\.(customColumn\d+)\.label$/;

  if (propertyPath?.length && regex.test(propertyPath)) {
    return [
      {
        propertyPath: propertyPath.replace("label", "alias"),
        propertyValue: propertyValue,
      },
    ];
  }
};

export const allowedFirstDayOfWeekRange = (value: number) => {
  const allowedValues = [0, 1, 2, 3, 4, 5, 6];
  const isValid = allowedValues.includes(Number(value));

  return {
    isValid: isValid,
    parsed: isValid ? Number(value) : 0,
    messages: isValid ? [] : ["Number should be between 0-6."],
  };
};

export const hideByMenuItemsSource = (
  props: TableWidgetProps,
  propertyPath: string,
  menuItemsSource: MenuItemsSource,
) => {
  const baseProperty = getBasePropertyPath(propertyPath);
  const currentMenuItemsSource = get(
    props,
    `${baseProperty}.menuItemsSource`,
    "",
  );

  return currentMenuItemsSource === menuItemsSource;
};

export const hideIfMenuItemsSourceDataIsFalsy = (
  props: TableWidgetProps,
  propertyPath: string,
) => {
  const baseProperty = getBasePropertyPath(propertyPath);
  const sourceData = get(props, `${baseProperty}.sourceData`, "");

  return !sourceData;
};

export const updateMenuItemsSource = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: unknown,
): Array<{ propertyPath: string; propertyValue: unknown }> | undefined => {
  const propertiesToUpdate: Array<{
    propertyPath: string;
    propertyValue: unknown;
  }> = [];
  const baseProperty = getBasePropertyPath(propertyPath);
  const menuItemsSource = get(props, `${baseProperty}.menuItemsSource`);

  if (propertyValue === ColumnTypes.MENU_BUTTON && !menuItemsSource) {
    // Sets the default value for menuItemsSource to static when
    // selecting the menu button column type for the first time
    propertiesToUpdate.push({
      propertyPath: `${baseProperty}.menuItemsSource`,
      propertyValue: MenuItemsSource.STATIC,
    });
  } else {
    const sourceData = get(props, `${baseProperty}.sourceData`);
    const configureMenuItems = get(props, `${baseProperty}.configureMenuItems`);
    const isMenuItemsSourceChangedFromStaticToDynamic =
      menuItemsSource === MenuItemsSource.STATIC &&
      propertyValue === MenuItemsSource.DYNAMIC;

    if (isMenuItemsSourceChangedFromStaticToDynamic) {
      if (!sourceData) {
        propertiesToUpdate.push({
          propertyPath: `${baseProperty}.sourceData`,
          propertyValue: [],
        });
      }

      if (!configureMenuItems) {
        propertiesToUpdate.push({
          propertyPath: `${baseProperty}.configureMenuItems`,
          propertyValue: {
            label: "Configure menu items",
            id: "config",
            config: {
              id: "config",
              label: "Menu Item",
              isVisible: true,
              isDisabled: false,
            },
          },
        });
      }
    }
  }

  return propertiesToUpdate?.length ? propertiesToUpdate : undefined;
};

export const updateCurrencyDefaultValues = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: unknown,
): Array<{ propertyPath: string; propertyValue: unknown }> | undefined => {
  const propertiesToUpdate: Array<{
    propertyPath: string;
    propertyValue: unknown;
  }> = [];
  const baseProperty = getBasePropertyPath(propertyPath);

  if (propertyValue === ColumnTypes.CURRENCY) {
    if (!get(props, `${baseProperty}.currencyCode`)) {
      propertiesToUpdate.push({
        propertyPath: `${baseProperty}.currencyCode`,
        propertyValue: "USD",
      });
    }

    if (get(props, `${baseProperty}.decimals`) === undefined) {
      propertiesToUpdate.push({
        propertyPath: `${baseProperty}.decimals`,
        propertyValue: 0,
      });
    }

    if (get(props, `${baseProperty}.notation`) === undefined) {
      propertiesToUpdate.push({
        propertyPath: `${baseProperty}.notation`,
        propertyValue: "standard",
      });
    }

    if (get(props, `${baseProperty}.thousandSeparator`) === undefined) {
      propertiesToUpdate.push({
        propertyPath: `${baseProperty}.thousandSeparator`,
        propertyValue: true,
      });
    }
  }

  return propertiesToUpdate?.length ? propertiesToUpdate : undefined;
};

export function selectColumnOptionsValidation(
  value: unknown,
  props: TableWidgetProps,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _?: any,
) {
  let _isValid = true,
    _parsed,
    _message = "";
  let uniqueValues: Set<unknown>;
  const invalidArrayValueMessage = `This value does not evaluate to type: { "label": string | number, "value": string | number | boolean }`;
  const invalidMessage = `This value does not evaluate to type Array<{ "label": string | number, "value": string | number | boolean }>`;
  const allowedValueTypes = ["string", "number", "boolean"];
  const allowedLabelTypes = ["string", "number"];

  const generateErrorMessagePrefix = (
    rowIndex: number | null,
    optionIndex: number,
  ) => {
    return `Invalid entry at${
      rowIndex !== null ? ` Row: ${rowIndex}` : ""
    } index: ${optionIndex}.`;
  };

  const generateInvalidArrayValueMessage = (
    rowIndex: number | null,
    optionIndex: number,
  ) =>
    `${generateErrorMessagePrefix(
      rowIndex,
      optionIndex,
    )} ${invalidArrayValueMessage}`;

  const validateOption = (
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    option: any,
    rowIndex: number | null,
    optionIndex: number,
  ) => {
    /*
     *  Option should
     *    1. be an object
     *    2. have label property
     *    3. label should be of type string | number
     *    4. have value property
     *    5. value should be of type string | number | boolean
     *    6. value should be unique amoig the options array
     */
    if (!_.isObject(option)) {
      // 1
      return `${generateErrorMessagePrefix(
        rowIndex,
        optionIndex,
      )} This value does not evaluate to type: { "label": string | number, "value": string | number | boolean }`;
    }

    if (!option.hasOwnProperty("label")) {
      // 2
      return `${generateErrorMessagePrefix(
        rowIndex,
        optionIndex,
      )} Missing required key: label`;
    }

    if (!allowedLabelTypes.includes(typeof option.label)) {
      // 3
      return `${generateErrorMessagePrefix(
        rowIndex,
        optionIndex,
      )} label does not evaluate to type ${allowedLabelTypes.join(" | ")}`;
    }

    if (!option.hasOwnProperty("value")) {
      // 4
      return `${generateErrorMessagePrefix(
        rowIndex,
        optionIndex,
      )} Missing required key: value`;
    }

    if (!allowedValueTypes.includes(typeof option.value)) {
      // 5
      return `${generateErrorMessagePrefix(
        rowIndex,
        optionIndex,
      )} value does not evaluate to type ${allowedValueTypes.join(" | ")}`;
    }

    if (uniqueValues.has(option.value)) {
      // 6
      return `Duplicate values found for the following properties, in the array entries, that must be unique -- value.`;
    } else {
      uniqueValues.add(option.value);
    }

    return "";
  };

  try {
    if (value === "" || _.isNil(value)) {
      // empty values
      return {
        isValid: true,
        parsed: [],
        messages: [""],
      };
    } else if (typeof value === "string") {
      // json string
      const _value = JSON.parse(value);

      if (Array.isArray(_value)) {
        value = _value;
      } else {
        _isValid = false;
        _message = invalidMessage;
      }
    }

    if (Array.isArray(value)) {
      if (value.length) {
        //when value is array of option json string
        if (value.every((d) => _.isString(d))) {
          value = value.map((d) => JSON.parse(d));
        }

        if (Array.isArray(value) && Array.isArray(value[0])) {
          // value is array of array of label, value
          //Value should be an array of array
          if (!value.every((d) => Array.isArray(d))) {
            _parsed = [];
            _isValid = false;
            _message = invalidMessage;
          } else {
            _parsed = value;
            _isValid = true;

            for (let i = 0; i < value.length; i++) {
              uniqueValues = new Set();

              for (let j = 0; j < value[i].length; j++) {
                if (_.isNil(value[i][j])) {
                  _isValid = false;
                  _message = generateInvalidArrayValueMessage(i, j);
                  _parsed = [];
                  break;
                }

                if ((_message = validateOption(value[i][j], i, j))) {
                  _isValid = false;
                  break;
                }
              }

              if (!_isValid) {
                break;
              }
            }
          }
        } else {
          uniqueValues = new Set();
          _parsed = value;
          _isValid = true;

          for (let i = 0; i < (value as Array<unknown>).length; i++) {
            if (_.isNil((value as Array<unknown>)[i])) {
              _isValid = false;
              _message = generateInvalidArrayValueMessage(null, i);
              _parsed = [];
              break;
            }

            if (
              (_message = validateOption((value as Array<unknown>)[i], null, i))
            ) {
              _isValid = false;
              break;
            }
          }
        }
      } else {
        _isValid = true;
        _parsed = [];
      }
    } else {
      _parsed = [];
      _isValid = false;
      _message = invalidMessage;
    }
  } catch (e) {
    _parsed = [];
    _isValid = false;
    _message = invalidMessage;
  }

  return {
    isValid: _isValid,
    parsed: _parsed,
    messages: [_message],
  };
}

export const getColumnPath = (propPath: string) =>
  propPath.split(".").slice(0, 2).join(".");

export const tableDataValidation = (
  value: unknown,
  props: TableWidgetProps,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _?: any,
) => {
  const invalidResponse = {
    isValid: false,
    parsed: [],
    messages: [
      {
        name: "TypeError",
        message: `Invalid value. This field expects an array of objects(Array<Object>) or the result of a Query such as "{{query1.data}}".`,
      },
    ],
  };

  if (value === "") {
    return {
      isValid: true,
      parsed: [],
    };
  }

  if (value === undefined || value === null) {
    return {
      isValid: false,
      parsed: [],
      messages: [
        {
          name: "ValidationError",
          message: "Data is undefined, re-run your query or fix the data",
        },
      ],
    };
  }

  if (!_.isString(value) && !Array.isArray(value)) {
    return invalidResponse;
  }

  let parsed = value;

  if (_.isString(value)) {
    try {
      parsed = JSON.parse(value as string);
    } catch (e) {
      return invalidResponse;
    }
  }

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return {
        isValid: true,
        parsed: [],
      };
    }

    for (let i = 0; i < parsed.length; i++) {
      if (!_.isPlainObject(parsed[i])) {
        return {
          isValid: false,
          parsed: [],
          messages: [
            {
              name: "ValidationError",
              message: `Invalid object at index ${i}`,
            },
          ],
        };
      }
    }

    return { isValid: true, parsed };
  }

  return invalidResponse;
};

export function textForEachRowValidation(
  value: unknown,
  props: TableWidgetProps,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _: any,
): ValidationResponse {
  const generateResponseAndReturn = (
    isValid = false,
    message = { name: "", message: "" },
  ) => {
    return {
      isValid,
      parsed: isValid ? value : [],
      messages: [message],
    };
  };

  const DEFAULT_MESSAGE = {
    name: "TypeError",
    message: "The evaluated value should be either a string or a number.",
  };

  if (
    _.isString(value) ||
    _.isNumber(value) ||
    Array.isArray(value) ||
    value === undefined
  ) {
    if (Array.isArray(value)) {
      const isValid = value.every((item) => {
        if (_.isString(item) || _.isNumber(item) || item === undefined) {
          return true;
        }

        if (Array.isArray(item)) {
          return item.every(
            (subItem) =>
              _.isString(subItem) ||
              _.isNumber(subItem) ||
              subItem === undefined,
          );
        }

        return false;
      });

      return isValid
        ? generateResponseAndReturn(true)
        : generateResponseAndReturn(false, DEFAULT_MESSAGE);
    }

    return generateResponseAndReturn(true);
  }

  return generateResponseAndReturn(false, DEFAULT_MESSAGE);
}

export function booleanForEachRowValidation(
  value: unknown,
): ValidationResponse {
  const generateResponseAndReturn = (
    isValid = false,
    message = { name: "", message: "" },
  ) => {
    return {
      isValid,
      parsed: isValid ? value : true,
      messages: [message],
    };
  };

  const isBoolean = (value: unknown) => {
    const isABoolean = value === true || value === false;
    const isStringTrueFalse = value === "true" || value === "false";

    return isABoolean || isStringTrueFalse || value === undefined;
  };

  const DEFAULT_MESSAGE = {
    name: "TypeError",
    message: "The evaluated value should be a boolean.",
  };

  if (isBoolean(value)) {
    return generateResponseAndReturn(true);
  }

  if (Array.isArray(value)) {
    const isValid = value.every((item) => {
      if (isBoolean(item)) {
        return true;
      }

      if (Array.isArray(item)) {
        return item.every((subItem) => isBoolean(subItem));
      }

      return false;
    });

    return isValid
      ? generateResponseAndReturn(true)
      : generateResponseAndReturn(false, DEFAULT_MESSAGE);
  }

  return generateResponseAndReturn(false, DEFAULT_MESSAGE);
}

export function iconNamesForEachRowValidation(
  value: unknown,
  props: TableWidgetProps,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  moment: any,
  propertyPath: string,
  config: ValidationConfig,
): ValidationResponse {
  const generateResponseAndReturn = (
    isValid = false,
    message = { name: "", message: "" },
  ) => {
    return {
      isValid,
      parsed: isValid ? value : true,
      messages: [message],
    };
  };

  const DEFAULT_MESSAGE = {
    name: "TypeError",
    message:
      "The evaluated value should either be an icon name, undefined, null, or an empty string. We currently use the icons from the Blueprint library. You can see the list of icons at https://blueprintjs.com/docs/#icons",
  };

  const isIconName = (value: unknown) => {
    return (
      config?.params?.allowedValues?.includes(value as string) ||
      value === undefined ||
      value === null ||
      value === ""
    );
  };

  if (isIconName(value)) {
    return generateResponseAndReturn(true);
  }

  if (Array.isArray(value)) {
    const isValid = value.every((item) => {
      if (isIconName(item)) {
        return true;
      }

      if (Array.isArray(item)) {
        return item.every((subItem) => isIconName(subItem));
      }

      return false;
    });

    return isValid
      ? generateResponseAndReturn(true)
      : generateResponseAndReturn(false, DEFAULT_MESSAGE);
  }

  return generateResponseAndReturn(false, DEFAULT_MESSAGE);
}

export function iconPositionForEachRowValidation(
  value: unknown,
  props: TableWidgetProps,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  moment: any,
  propertyPath: string,
  config: ValidationConfig,
): ValidationResponse {
  const generateResponseAndReturn = (
    isValid = false,
    message = { name: "", message: "" },
  ) => {
    return {
      isValid,
      parsed: isValid ? value : true,
      messages: [message],
    };
  };

  const DEFAULT_MESSAGE = {
    name: "TypeError",
    message: `The evaluated value should be one of the allowed values => ${config?.params?.allowedValues?.join(
      ", ",
    )}, undefined, null, or an empty string`,
  };

  const isIconPosition = (value: unknown) => {
    return (
      config?.params?.allowedValues?.includes(value as string) ||
      value === undefined ||
      value === null ||
      value === ""
    );
  };

  if (isIconPosition(value)) {
    return generateResponseAndReturn(true);
  }

  if (Array.isArray(value)) {
    const isValid = value.every((item) => {
      if (isIconPosition(item)) {
        return true;
      }

      if (Array.isArray(item)) {
        return item.every((subItem) => isIconPosition(subItem));
      }

      return false;
    });

    return isValid
      ? generateResponseAndReturn(true)
      : generateResponseAndReturn(false, DEFAULT_MESSAGE);
  }

  return generateResponseAndReturn(false, DEFAULT_MESSAGE);
}

export function colorForEachRowValidation(
  value: unknown,
  props: TableWidgetProps,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  moment: any,
  propertyPath: string,
  config: ValidationConfig,
): ValidationResponse {
  const generateResponseAndReturn = (
    isValid = false,
    message = { name: "", message: "" },
  ) => {
    return {
      isValid,
      parsed: isValid ? value : true,
      messages: [message],
    };
  };

  const DEFAULT_MESSAGE = {
    name: "TypeError",
    message: `The evaluated value should match ${config?.params?.regex}`,
  };

  const isColor = (value: unknown) => {
    return config?.params?.regex?.test(value as string);
  };

  if (isColor(value)) {
    return generateResponseAndReturn(true);
  }

  if (Array.isArray(value)) {
    const isValid = value.every((item) => {
      if (isColor(item)) {
        return true;
      }

      if (Array.isArray(item)) {
        return item.every((subItem) => isColor(subItem));
      }

      return false;
    });

    return isValid
      ? generateResponseAndReturn(true)
      : generateResponseAndReturn(false, DEFAULT_MESSAGE);
  }

  return generateResponseAndReturn(false, DEFAULT_MESSAGE);
}

// Infinite scroll not supported for add new row yet
export const updateAllowAddNewRowOnInfiniteScrollChange = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: boolean,
): Array<{ propertyPath: string; propertyValue: unknown }> | undefined => {
  return [
    {
      propertyPath: "allowAddNewRow",
      propertyValue: !propertyValue,
    },
  ];
};

// Infinite scroll not supported for search, sort and filters yet
export const updateSearchSortFilterOnInfiniteScrollChange = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: boolean,
): Array<{ propertyPath: string; propertyValue: unknown }> | undefined => {
  return [
    {
      propertyPath: "isVisibleSearch",
      propertyValue: !propertyValue,
    },
    {
      propertyPath: "isVisibleFilters",
      propertyValue: !propertyValue,
    },
    {
      propertyPath: "isSortable",
      propertyValue: !propertyValue,
    },
  ];
};

// Disable cell editability when infinite scroll is enabled
export const updateCellEditabilityOnInfiniteScrollChange = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: boolean,
): Array<{ propertyPath: string; propertyValue: unknown }> | undefined => {
  if (!props.primaryColumns) return;

  const updates: Array<{ propertyPath: string; propertyValue: unknown }> = [];

  Object.entries(props.primaryColumns).forEach(([, column]) => {
    const columnName = column.alias;

    updates.push({
      propertyPath: `primaryColumns.${columnName}.isCellEditable`,
      propertyValue: !propertyValue,
    });

    updates.push({
      propertyPath: `primaryColumns.${columnName}.isEditable`,
      propertyValue: !propertyValue,
    });
  });

  return updates.length > 0 ? updates : undefined;
};

export const updateServerSidePaginationOnInfiniteScrollChange = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: boolean,
): Array<{ propertyPath: string; propertyValue: boolean }> | undefined => {
  if (propertyValue === true && !props.serverSidePaginationEnabled) {
    return [
      {
        propertyPath: "serverSidePaginationEnabled",
        propertyValue,
      },
    ];
  }

  return undefined;
};
