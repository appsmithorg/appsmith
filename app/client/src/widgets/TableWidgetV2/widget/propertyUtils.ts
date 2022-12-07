import { Alignment } from "@blueprintjs/core";
import { CellAlignmentTypes, ColumnProperties } from "../component/Constants";
import {
  ColumnTypes,
  InlineEditingSaveOptions,
  TableWidgetProps,
} from "../constants";
import _, { get, isBoolean, without } from "lodash";
import { Colors } from "constants/Colors";
import {
  combineDynamicBindings,
  getDynamicBindings,
} from "utils/DynamicBindingUtils";
import { createEditActionColumn, updateLocalColumnOrder } from "./utilities";
import { PropertyHookUpdates } from "constants/PropertyControlConstants";
import { RenderModes } from "constants/WidgetConstants";

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
  propertyValue: any,
): Array<PropertyHookUpdates> | undefined => {
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
 * For the columns that are fixed by dev, we need to pass sticky to be undefined.
 */
export const handleColumnSticky = (
  primaryColumns: Record<string, ColumnProperties>,
  columnOrder: string[],
  columnName: string,
  sticky?: string,
  renderMode = RenderModes.CANVAS,
  canUserFreezeColumn = false,
) => {
  let newColumnOrder = [...columnOrder];
  newColumnOrder = without(newColumnOrder, columnName);

  if (renderMode === RenderModes.PAGE && canUserFreezeColumn) {
    updateLocalColumnOrder(newColumnOrder, columnName, sticky);
  }

  // Get the updated column orders
  const leftOrder = localStorage.getItem("leftOrder");
  const rightOrder = localStorage.getItem("rightOrder");

  if (sticky === "left") {
    /**
     * This block will calculate the index position for the new column that needs to be placed when frozen left.
     * This position is calculated by iterating over the columns that are already frozen.
     * lastLeftIndex: stores the index position of the new frozen column.
     */
    let lastLeftIndex = 0;

    // Iterate over the columns that are frozen by developers. Developer frozen columns are present in the primaryColumns[columnName].sticky property.
    for (let i = 0; i < columnOrder.length; i++) {
      const leftCol = columnOrder[i];
      if (primaryColumns[leftCol].sticky === "left") {
        lastLeftIndex = i + 1;
      }
    }

    /**
     * Also, iterate over the columns that are frozen by the user.
     * For column that are frozen by the user we refer to the localStorage
     */
    if (renderMode === RenderModes.PAGE && canUserFreezeColumn && leftOrder) {
      lastLeftIndex = lastLeftIndex + JSON.parse(leftOrder).length - 1;
    }

    newColumnOrder.splice(lastLeftIndex, 0, columnName);
  } else if (sticky === "right") {
    let lastRightIndex = columnOrder.length - 1;

    for (let j = 0; j < columnOrder.length; j++) {
      const rightCol = columnOrder[j];
      if (primaryColumns[rightCol].sticky === "right") {
        lastRightIndex = j - 1;
        break;
      }
    }

    // Check local right columns: local + normal:
    if (renderMode === RenderModes.PAGE && canUserFreezeColumn && rightOrder) {
      lastRightIndex = lastRightIndex - JSON.parse(rightOrder).length + 1;
    }

    newColumnOrder.splice(lastRightIndex, 0, columnName);
  } else {
    /**
     * This block will manage the unfreezing of the columns.
     * Unfreezing can happen in CANVAS or PAGE mode.
     * Logic:
     * --> If the column is unfrozen when its on the left, then it should be unfrozen after the last left frozen column.
     * --> If the column is unfrozen when its on the right, then it should be unfrozen before the first right frozen column.
     */
    let frozenColumnLastIdx = -1;
    if (renderMode === RenderModes.PAGE && canUserFreezeColumn) {
      if (leftOrder) {
        const parsedLeftOrder = JSON.parse(leftOrder);
        if (parsedLeftOrder.includes(columnName)) {
          parsedLeftOrder.forEach((colName: string) => {
            // Unfreeze user column at the index found in the original columnOrder.
            const originalIdx = columnOrder.indexOf(colName);
            frozenColumnLastIdx = originalIdx;
          });
        }
      } else if (rightOrder) {
        const parsedRightOrder = JSON.parse(rightOrder);
        if (parsedRightOrder.includes(columnName)) {
          parsedRightOrder.forEach((colName: string) => {
            const originalIdx = columnOrder.indexOf(colName);
            frozenColumnLastIdx = originalIdx;
          });
        }
      }
    } else {
      const currentPropertyValue = get(primaryColumns, `${columnName}`);

      for (let k = 0; k < columnOrder.length; k++) {
        const colName = columnOrder[k];
        if (primaryColumns[colName].sticky === currentPropertyValue.sticky) {
          if (primaryColumns[colName].sticky === "right") {
            frozenColumnLastIdx = k;
            break;
          }
          if (primaryColumns[colName].sticky === "left") {
            frozenColumnLastIdx = k;
          }
        }
      }
    }
    newColumnOrder.splice(frozenColumnLastIdx, 0, columnName);
  }
  return newColumnOrder;
};
/**
 * Hook that updates frozen column's old indices and also adds columns to the frozen positions.
 */
export const updateColumnOrderWhenFrozen = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: string,
) => {
  if (props && props.columnOrder) {
    const newColumnOrder = handleColumnSticky(
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
  } else {
    return;
  }
};
/*
 * Hook that updates column level editability when cell level editability is
 * updaed.
 */
export const updateColumnLevelEditability = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: any,
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
export const updateInlineEditingSaveOptionHook = (
  props: TableWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<PropertyHookUpdates> | undefined => {
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
  propertyValue: any,
): Array<PropertyHookUpdates> | undefined {
  const regex = /^primaryColumns\.(\w+)\.(.*)$/;
  const matches = propertyPath.match(regex);
  const columnId = matches?.[1];
  const columnProperty = matches?.[2];

  if (columnProperty === "columnType") {
    const propertiesToUpdate: Array<PropertyHookUpdates> = [];
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
): Array<PropertyHookUpdates> | undefined => {
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
