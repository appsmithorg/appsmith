import { Colors } from "constants/Colors";
import { FontStyleTypes } from "constants/WidgetConstants";
import _, { filter, isBoolean, isObject, uniq, without } from "lodash";
import tinycolor from "tinycolor2";
import type {
  CellLayoutProperties,
  ColumnProperties,
  ReactTableColumnProps,
  TableColumnProps,
  TableStyles,
} from "../component/Constants";
import {
  CellAlignmentTypes,
  StickyType,
  VerticalAlignmentTypes,
} from "../component/Constants";
import {
  ColumnTypes,
  DEFAULT_BUTTON_COLOR,
  DEFAULT_COLUMN_WIDTH,
  TABLE_COLUMN_ORDER_KEY,
} from "../constants";
import { SelectColumnOptionsValidations } from "./propertyUtils";
import type { TableWidgetProps } from "../constants";
import { get } from "lodash";
import { getNextEntityName } from "utils/AppsmithUtils";
import {
  combineDynamicBindings,
  getDynamicBindings,
} from "utils/DynamicBindingUtils";
import { ButtonVariantTypes } from "components/constants";
import { dateFormatOptions } from "WidgetProvider/constants";
import moment from "moment";
import type { Stylesheet } from "entities/AppTheming";
import { getKeysFromSourceDataForEventAutocomplete } from "widgets/MenuButtonWidget/widget/helper";
import log from "loglevel";
import type React from "react";

type TableData = Array<Record<string, unknown>>;

/*
 * When the table data changes we need to find the new index of the
 * selectedRow by using the primary key
 */
export const getOriginalRowIndex = (
  prevTableData: TableData,
  tableData: TableData,
  selectedRowIndex: number | undefined,
  primaryColumnId: string,
): number => {
  let primaryKey = "";
  let index = -1;

  if (prevTableData && prevTableData.length == 0) {
    return selectedRowIndex ?? index;
  }

  if (
    !_.isNil(selectedRowIndex) &&
    prevTableData &&
    prevTableData[selectedRowIndex]
  ) {
    primaryKey = prevTableData[selectedRowIndex][primaryColumnId] as string;
  }

  if (!!primaryKey && tableData) {
    index = tableData.findIndex((row) => row[primaryColumnId] === primaryKey);
  }

  return index;
};

export const getSelectRowIndex = (
  prevTableData: TableData,
  tableData: TableData,
  defaultSelectedRowIndex: string | number | number[] | undefined,
  selectedRowIndex: number | undefined,
  primaryColumnId: string | undefined,
) => {
  let index = _.isNumber(defaultSelectedRowIndex)
    ? defaultSelectedRowIndex
    : -1;

  if (
    selectedRowIndex !== -1 &&
    !_.isNil(selectedRowIndex) &&
    primaryColumnId
  ) {
    index = getOriginalRowIndex(
      prevTableData,
      tableData,
      selectedRowIndex,
      primaryColumnId,
    );
  }

  return index;
};

export const getSelectRowIndices = (
  prevTableData: TableData,
  tableData: TableData,
  defaultSelectedRowIndices: string | number | number[] | undefined,
  selectedRowIndices: number[] | undefined,
  primaryColumnId: string | undefined,
) => {
  let indices: number[];

  if (primaryColumnId && _.isArray(selectedRowIndices)) {
    indices = selectedRowIndices;
  } else if (_.isArray(defaultSelectedRowIndices)) {
    indices = defaultSelectedRowIndices;
  } else {
    indices = [];
  }

  if (primaryColumnId) {
    return indices
      .map((index: number) =>
        getOriginalRowIndex(prevTableData, tableData, index, primaryColumnId),
      )
      .filter((index) => index !== -1);
  } else {
    return indices;
  }
};

//TODO(Balaji): we shouldn't replace special characters
export const removeSpecialChars = (value: string, limit?: number) => {
  const separatorRegex = /\W+/;

  return value
    .split(separatorRegex)
    .join("_")
    .slice(0, limit || 30);
};

/*
 * Function to get list of columns from the tabledata
 */
export const getAllTableColumnKeys = (
  tableData?: Array<Record<string, unknown>>,
) => {
  const columnKeys: Set<string> = new Set();

  if (_.isArray(tableData)) {
    tableData.forEach((row) => {
      Object.keys(row).forEach((key) => {
        columnKeys.add(key);
      });
    });
  }

  return Array.from(columnKeys);
};

export function getTableStyles(props: TableStyles) {
  return {
    textColor: props.textColor,
    textSize: props.textSize,
    fontStyle: props.fontStyle,
    cellBackground: props.cellBackground,
    verticalAlignment: props.verticalAlignment,
    horizontalAlignment: props.horizontalAlignment,
  };
}

export function escapeString(str: string) {
  /*
   * Match all the unescaped `"`
   *  match `"` that follows any character except `\`. ([^\\]\")
   */
  return str.replace(/[^\\]"/g, (match) => {
    return match.substr(0, match.length - 1) + `\"`;
  });
}

export function getDefaultColumnProperties(
  id: string,
  sanitizedId: string,
  index: number,
  widgetName: string,
  isDerived?: boolean,
  columnType?: string,
): ColumnProperties {
  const columnProps = {
    allowCellWrapping: false,
    allowSameOptionsInNewRow: true,
    index: index,
    width: DEFAULT_COLUMN_WIDTH,
    originalId: id,
    id: sanitizedId,
    alias: id,
    horizontalAlignment: CellAlignmentTypes.LEFT,
    verticalAlignment: VerticalAlignmentTypes.CENTER,
    columnType: columnType || ColumnTypes.TEXT,
    textColor: Colors.THUNDER,
    textSize: "0.875rem",
    fontStyle: FontStyleTypes.REGULAR,
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isDisabled: false,
    isCellEditable: false,
    isEditable: false,
    isCellVisible: true,
    isDerived: !!isDerived,
    label: id,
    isSaveVisible: true,
    isDiscardVisible: true,
    computedValue: isDerived
      ? ""
      : `{{${widgetName}.processedTableData.map((currentRow, currentIndex) => ( currentRow["${escapeString(
          id,
        )}"]))}}`,
    sticky: StickyType.NONE,
    validation: {},
    currencyCode: "USD",
    decimals: 0,
    thousandSeparator: true,
    notation: "standard" as Intl.NumberFormatOptions["notation"],
  };

  return columnProps;
}

/*
 * Function to extract derived columns from the primary columns
 */
export function getDerivedColumns(
  primaryColumns: Record<string, ColumnProperties>,
): Record<string, ColumnProperties> {
  const derivedColumns: Record<string, ColumnProperties> = {};

  if (primaryColumns) {
    Object.keys(primaryColumns).forEach((columnId) => {
      if (primaryColumns[columnId] && primaryColumns[columnId].isDerived) {
        derivedColumns[columnId] = primaryColumns[columnId];
      }
    });
  }

  return derivedColumns;
}

export const getPropertyValue = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  index: number,
  preserveCase = false,
  isSourceData = false,
) => {
  if (value && isObject(value) && !Array.isArray(value)) {
    return value;
  }

  if (value && Array.isArray(value) && value[index]) {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getValueForSourceData = (value: any, index: number) => {
      return Array.isArray(value[index]) ? value[index] : value;
    };

    return isSourceData
      ? getValueForSourceData(value, index)
      : preserveCase
        ? value[index].toString()
        : value[index].toString().toUpperCase();
  } else if (value) {
    return preserveCase ? value.toString() : value.toString().toUpperCase();
  } else {
    return value;
  }
};
export const getBooleanPropertyValue = (value: unknown, index: number) => {
  if (isBoolean(value)) {
    return value;
  }

  if (Array.isArray(value) && isBoolean(value[index])) {
    return value[index];
  }

  return !!value;
};

export const getArrayPropertyValue = (value: unknown, index: number) => {
  if (Array.isArray(value) && value.length > 0) {
    if (Array.isArray(value[0])) {
      // value is array of arrays of label value
      return value[index];
    } else {
      // value is array of label value
      return value;
    }
  } else {
    return value;
  }
};

export const getCellProperties = (
  columnProperties: ColumnProperties,
  rowIndex: number,
  isAddRowInProgress = false,
) => {
  if (columnProperties) {
    return {
      horizontalAlignment: getPropertyValue(
        columnProperties.horizontalAlignment,
        rowIndex,
      ),
      verticalAlignment: getPropertyValue(
        columnProperties.verticalAlignment,
        rowIndex,
      ),
      cellBackground: getPropertyValue(
        columnProperties.cellBackground,
        rowIndex,
      ),
      buttonColor: getPropertyValue(columnProperties.buttonColor, rowIndex),
      buttonLabel: getPropertyValue(
        columnProperties.buttonLabel,
        rowIndex,
        true,
      ),
      menuButtonLabel: getPropertyValue(
        columnProperties.menuButtonLabel,
        rowIndex,
        true,
      ),
      iconName: getPropertyValue(columnProperties.iconName, rowIndex, true),
      menuButtoniconName: getPropertyValue(
        columnProperties.menuButtoniconName,
        rowIndex,
        true,
      ),
      menuItemsSource: getPropertyValue(
        columnProperties.menuItemsSource,
        rowIndex,
        true,
      ),
      sourceData: getPropertyValue(
        columnProperties.sourceData,
        rowIndex,
        false,
        true,
      ),
      configureMenuItems: columnProperties.configureMenuItems,
      buttonVariant: getPropertyValue(
        columnProperties.buttonVariant,
        rowIndex,
        true,
      ),
      borderRadius: getPropertyValue(
        columnProperties.borderRadius,
        rowIndex,
        true,
      ),
      boxShadow: getPropertyValue(columnProperties.boxShadow, rowIndex, true),
      iconButtonStyle: getPropertyValue(
        columnProperties.iconButtonStyle,
        rowIndex,
        true,
      ),
      textSize: getPropertyValue(columnProperties.textSize, rowIndex),
      textColor: getPropertyValue(columnProperties.textColor, rowIndex),
      fontStyle: getPropertyValue(columnProperties.fontStyle, rowIndex), //Fix this
      isVisible: getBooleanPropertyValue(columnProperties.isVisible, rowIndex),
      isDisabled: getBooleanPropertyValue(
        columnProperties.isDisabled,
        rowIndex,
      ),
      isCellVisible: getBooleanPropertyValue(
        columnProperties.isCellVisible,
        rowIndex,
      ),
      displayText: getPropertyValue(
        columnProperties.displayText,
        rowIndex,
        true,
      ),
      iconAlign: getPropertyValue(columnProperties.iconAlign, rowIndex, true),
      isCompact: getPropertyValue(columnProperties.isCompact, rowIndex),
      menuColor: getPropertyValue(columnProperties.menuColor, rowIndex, true),
      menuItems: getPropertyValue(columnProperties.menuItems, rowIndex),
      menuVariant: getPropertyValue(
        columnProperties.menuVariant,
        rowIndex,
        true,
      ),
      isCellEditable: getBooleanPropertyValue(
        columnProperties.isCellEditable,
        rowIndex,
      ),
      allowCellWrapping: getBooleanPropertyValue(
        columnProperties.allowCellWrapping,
        rowIndex,
      ),
      // EditActions related properties
      saveButtonVariant: getPropertyValue(
        columnProperties.saveButtonVariant,
        rowIndex,
        true,
      ),
      saveButtonColor: getPropertyValue(
        columnProperties.saveButtonColor,
        rowIndex,
        true,
      ),
      saveIconAlign: getPropertyValue(
        columnProperties.saveIconAlign,
        rowIndex,
        true,
      ),
      saveBorderRadius: getPropertyValue(
        columnProperties.saveBorderRadius,
        rowIndex,
        true,
      ),
      saveActionLabel: getPropertyValue(
        columnProperties.saveActionLabel,
        rowIndex,
        true,
      ),
      saveActionIconName: getPropertyValue(
        columnProperties.saveActionIconName,
        rowIndex,
        true,
      ),
      isSaveVisible: getBooleanPropertyValue(
        columnProperties.isSaveVisible,
        rowIndex,
      ),
      isSaveDisabled: getBooleanPropertyValue(
        columnProperties.isSaveDisabled,
        rowIndex,
      ),
      discardButtonVariant: getPropertyValue(
        columnProperties.discardButtonVariant,
        rowIndex,
        true,
      ),
      discardButtonColor: getPropertyValue(
        columnProperties.discardButtonColor,
        rowIndex,
        true,
      ),
      discardIconAlign: getPropertyValue(
        columnProperties.discardIconAlign,
        rowIndex,
        true,
      ),
      discardBorderRadius: getPropertyValue(
        columnProperties.discardBorderRadius,
        rowIndex,
        true,
      ),
      discardActionLabel: getPropertyValue(
        columnProperties.discardActionLabel,
        rowIndex,
        true,
      ),
      discardActionIconName: getPropertyValue(
        columnProperties.discardActionIconName,
        rowIndex,
        true,
      ),
      isDiscardVisible: getBooleanPropertyValue(
        columnProperties.isDiscardVisible,
        rowIndex,
      ),
      isDiscardDisabled: getBooleanPropertyValue(
        columnProperties.isDiscardDisabled,
        rowIndex,
      ),
      imageSize: getPropertyValue(columnProperties.imageSize, rowIndex, true),
      isFilterable: getBooleanPropertyValue(
        columnProperties.isFilterable,
        rowIndex,
      ),
      serverSideFiltering: getBooleanPropertyValue(
        columnProperties.serverSideFiltering,
        rowIndex,
      ),
      placeholderText: getPropertyValue(
        columnProperties.placeholderText,
        rowIndex,
        true,
      ),
      resetFilterTextOnClose: getPropertyValue(
        columnProperties.resetFilterTextOnClose,
        rowIndex,
      ),
      inputFormat: getPropertyValue(
        columnProperties.inputFormat,
        rowIndex,
        true,
      ),
      outputFormat: getPropertyValue(
        columnProperties.outputFormat,
        rowIndex,
        true,
      ),
      shortcuts: getBooleanPropertyValue(columnProperties.shortcuts, rowIndex),
      selectOptions: getSelectOptions(
        isAddRowInProgress,
        rowIndex,
        columnProperties,
      ),
      timePrecision: getPropertyValue(
        columnProperties.timePrecision,
        rowIndex,
        true,
      ),
      currencyCode: getPropertyValue(
        columnProperties.currencyCode,
        rowIndex,
        true,
      ),
      decimals: columnProperties.decimals,
      thousandSeparator: getBooleanPropertyValue(
        columnProperties.thousandSeparator,
        rowIndex,
      ),
      notation: getPropertyValue(columnProperties.notation, rowIndex, true),
    } as CellLayoutProperties;
  }

  return {} as CellLayoutProperties;
};

const EdtiableColumnTypes: string[] = [
  ColumnTypes.TEXT,
  ColumnTypes.NUMBER,
  ColumnTypes.SELECT,
  ColumnTypes.CHECKBOX,
  ColumnTypes.SWITCH,
  ColumnTypes.DATE,
  ColumnTypes.CURRENCY,
];

export function isColumnTypeEditable(columnType: string) {
  return EdtiableColumnTypes.includes(columnType);
}

/*
 * Nested propeties are not validated when application is refreshed
 * TODO(Balai): Should confirm and create an issue to address this.
 */
export function getSelectColumnTypeOptions(value: unknown) {
  const result = SelectColumnOptionsValidations(value, {}, _);

  return result.parsed;
}

/**
 * returns selected row bg color
 *
 * if the color is dark, use 80% lighter color for selected row
 * if color is light, use 10% darker color for selected row
 *
 * @param accentColor
 */
export const getSelectedRowBgColor = (accentColor: string) => {
  const tinyAccentColor = tinycolor(accentColor);
  const brightness = tinycolor(accentColor).greyscale().getBrightness();

  const percentageBrightness = (brightness / 255) * 100;
  let nextBrightness = 0;

  switch (true) {
    case percentageBrightness > 70:
      nextBrightness = 10;
      break;
    case percentageBrightness > 50:
      nextBrightness = 35;
      break;
    case percentageBrightness > 50:
      nextBrightness = 55;
      break;
    default:
      nextBrightness = 60;
  }

  if (brightness > 180) {
    return tinyAccentColor.darken(10).toString();
  } else {
    return tinyAccentColor.lighten(nextBrightness).toString();
  }
};

/**
 * this is a getter function to get stylesheet value of the property from the config
 *
 * @param props
 * @param propertyPath
 * @param widgetStylesheet
 * @returns
 */
export const getStylesheetValue = (
  props: TableWidgetProps,
  propertyPath: string,
  widgetStylesheet?: Stylesheet,
) => {
  const propertyName = propertyPath.split(".").slice(-1)[0];
  const columnName = propertyPath.split(".").slice(-2)[0];
  const columnType = get(props, `primaryColumns.${columnName}.columnType`);

  return get(widgetStylesheet, `childStylesheet.${columnType}.${propertyName}`);
};

export const reorderColumns = (
  columns: Record<string, ColumnProperties>,
  columnOrder: string[],
) => {
  const newColumnsInOrder: Record<string, ColumnProperties> = {};

  uniq(columnOrder).forEach((id: string, index: number) => {
    if (columns[id]) newColumnsInOrder[id] = { ...columns[id], index };
  });
  const remaining = without(
    Object.keys(columns),
    ...Object.keys(newColumnsInOrder),
  );
  const len = Object.keys(newColumnsInOrder).length;

  if (remaining && remaining.length > 0) {
    remaining.forEach((id: string, index: number) => {
      newColumnsInOrder[id] = { ...columns[id], index: len + index };
    });
  }

  return newColumnsInOrder;
};

export const getEditActionColumnProperties = () => ({
  isSaveVisible: true,
  isDiscardVisible: true,
  saveIconAlign: "left",
  discardIconAlign: "left",
  saveActionLabel: "Save",
  discardActionLabel: "Discard",
  saveButtonColor: Colors.GREEN,
  discardButtonColor: Colors.GREEN,
});

export const getEditActionColumnDynamicProperties = (widgetName: string) => ({
  isSaveDisabled: `{{${widgetName}.processedTableData.map((currentRow, currentIndex) => ( !${widgetName}.updatedRowIndices.includes(currentIndex)))}}`,
  isDiscardDisabled: `{{${widgetName}.processedTableData.map((currentRow, currentIndex) => ( !${widgetName}.updatedRowIndices.includes(currentIndex)))}}`,
});

export const createColumn = (props: TableWidgetProps, baseName: string) => {
  const columns = props.primaryColumns || {};
  const columnsArray = Object.values(columns);
  const columnIds = columnsArray.map((column) => column.originalId);
  const newColumnName = getNextEntityName(baseName, columnIds);
  const lastItemIndex = columnsArray
    .map((column) => column.index)
    .sort()
    .pop();

  const nextIndex = lastItemIndex ? lastItemIndex + 1 : columnIds.length;

  return {
    ...getDefaultColumnProperties(
      newColumnName,
      newColumnName,
      nextIndex,
      props.widgetName,
      true,
    ),
    buttonStyle: DEFAULT_BUTTON_COLOR,
    isDisabled: false,
    ...getTableStyles(props),
  };
};

export const createEditActionColumn = (props: TableWidgetProps) => {
  const themeProps: Record<string, string> = {};

  if (props.childStylesheet[ColumnTypes.EDIT_ACTIONS]) {
    Object.entries(props.childStylesheet[ColumnTypes.EDIT_ACTIONS]).forEach(
      ([key, value]) => {
        const { jsSnippets, stringSegments } = getDynamicBindings(
          value as string,
        );

        const js = combineDynamicBindings(jsSnippets, stringSegments);

        themeProps[key] =
          `{{${props.widgetName}.processedTableData.map((currentRow, currentIndex) => ( ${js}))}}`;
      },
    );
  }

  const column = {
    ...createColumn(props, "EditActions"),
    ...getEditActionColumnProperties(),
    ...themeProps,
    columnType: ColumnTypes.EDIT_ACTIONS,
    label: "Save / Discard",
    discardButtonVariant: ButtonVariantTypes.TERTIARY,
    discardButtonColor: Colors.DANGER_SOLID,
    sticky: StickyType.RIGHT,
  };
  const columnOrder = [...(props.columnOrder || [])];
  const editActionDynamicProperties = getEditActionColumnDynamicProperties(
    props.widgetName,
  );

  const rightColumnIndex = columnOrder
    .map((column) => props.primaryColumns[column])
    .filter((col) => col.sticky !== StickyType.RIGHT).length;

  columnOrder.splice(rightColumnIndex, 0, column.id);

  return [
    {
      propertyPath: `primaryColumns.${column.id}`,
      propertyValue: {
        ...column,
        ...editActionDynamicProperties,
      },
    },
    {
      propertyPath: `columnOrder`,
      propertyValue: columnOrder,
    },
    ...Object.entries(editActionDynamicProperties).map(([key, value]) => ({
      propertyPath: `primaryColumns.${column.id}.${key}`,
      propertyValue: value,
      isDynamicPropertyPath: true,
    })),
  ];
};

export const getColumnType = (
  tableData: Array<Record<string, unknown>>,
  columnKey: string,
): string => {
  if (!_.isArray(tableData) || tableData.length === 0 || !columnKey) {
    return ColumnTypes.TEXT;
  }

  let columnValue: unknown = null,
    row = 0;
  const maxRowsToCheck = 5;

  /*
    In below while loop we are trying to get a non-null value from
    subsequent rows in case first few rows are null
    Limited to checking upto maxRowsToCheck
  */
  while (_.isNil(columnValue) && row < maxRowsToCheck) {
    if (!_.isNil(tableData?.[row]?.[columnKey])) {
      columnValue = tableData[row][columnKey];
      break;
    }

    row++;
  }

  if (_.isNil(columnValue)) {
    return ColumnTypes.TEXT;
  }

  switch (typeof columnValue) {
    case "number":
      return ColumnTypes.NUMBER;
    case "boolean":
      return ColumnTypes.CHECKBOX;
    case "string": {
      const isHTML = /<[^>]*>/.test(columnValue);

      if (isHTML) {
        return ColumnTypes.HTML;
      }

      const isAnyValidDate = dateFormatOptions.some(({ value: format }) =>
        moment(columnValue as string, format, true).isValid(),
      );

      if (isAnyValidDate) {
        return ColumnTypes.DATE;
      }

      return ColumnTypes.TEXT;
    }
    default:
      return ColumnTypes.TEXT;
  }
};

export const generateLocalNewColumnOrderFromStickyValue = (
  columnOrder: string[],
  columnName: string,
  sticky?: string,
  leftOrder?: string[],
  rightOrder?: string[],
) => {
  let newColumnOrder = [...columnOrder];

  newColumnOrder = without(newColumnOrder, columnName);

  let columnIndex = -1;

  if (sticky === StickyType.LEFT && leftOrder) {
    columnIndex = leftOrder.length;
  } else if (sticky === StickyType.RIGHT && rightOrder) {
    columnIndex =
      rightOrder.length !== 0
        ? columnOrder.indexOf(rightOrder[0]) - 1
        : columnOrder.length - 1;
  } else {
    if (leftOrder?.includes(columnName)) {
      columnIndex = leftOrder.length - 1;
    } else if (rightOrder?.includes(columnName)) {
      columnIndex =
        rightOrder.length !== 0
          ? columnOrder.indexOf(rightOrder[0])
          : columnOrder.length - 1;
    }
  }

  newColumnOrder.splice(columnIndex, 0, columnName);

  return newColumnOrder;
};
/**
 * Function to get new column order when there is a change in column's sticky value.
 */
export const generateNewColumnOrderFromStickyValue = (
  primaryColumns: Record<string, ColumnProperties>,
  columnOrder: string[],
  columnName: string,
  sticky?: string,
) => {
  let newColumnOrder = [...columnOrder];

  newColumnOrder = without(newColumnOrder, columnName);

  let columnIndex;

  if (sticky === StickyType.LEFT) {
    columnIndex = columnOrder
      .map((column) => primaryColumns[column])
      .filter((column) => column.sticky === StickyType.LEFT).length;
  } else if (sticky === StickyType.RIGHT) {
    columnIndex =
      columnOrder
        .map((column) => primaryColumns[column])
        .filter((column) => column.sticky !== StickyType.RIGHT).length - 1;
  } else {
    /**
     * This block will manage the column order when column is unfrozen.
     * Unfreezing can happen in CANVAS or PAGE mode.
     * Logic:
     * --> If the column is unfrozen when its on the left, then it should be unfrozen after the last left frozen column.
     * --> If the column is unfrozen when its on the right, then it should be unfrozen before the first right frozen column.
     */
    columnIndex = -1;

    const staleStickyValue = primaryColumns[columnName].sticky;

    if (staleStickyValue === StickyType.LEFT) {
      columnIndex = columnOrder
        .map((column) => primaryColumns[column])
        .filter(
          (column) =>
            column.sticky === StickyType.LEFT && column.id !== columnName,
        ).length;
    } else if (staleStickyValue === StickyType.RIGHT) {
      columnIndex = columnOrder
        .map((column) => primaryColumns[column])
        .filter((column) => column.sticky !== StickyType.RIGHT).length;
    }
  }

  newColumnOrder.splice(columnIndex, 0, columnName);

  return newColumnOrder;
};

export const getSourceDataAndCaluclateKeysForEventAutoComplete = (
  props: TableWidgetProps,
): unknown => {
  const { __evaluation__, primaryColumns } = props;
  const primaryColumnKeys = primaryColumns ? Object.keys(primaryColumns) : [];
  const columnName = primaryColumnKeys?.length ? primaryColumnKeys[0] : "";
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const evaluatedColumns: any = __evaluation__?.evaluatedValues?.primaryColumns;

  if (evaluatedColumns) {
    const result = getKeysFromSourceDataForEventAutocomplete(
      evaluatedColumns[columnName]?.sourceData || [],
    );

    return result;
  } else {
    return {};
  }
};

export const deleteLocalTableColumnOrderByWidgetId = (widgetId: string) => {
  try {
    const localData = localStorage.getItem(TABLE_COLUMN_ORDER_KEY);

    if (localData) {
      const localColumnOrder = JSON.parse(localData);

      delete localColumnOrder[widgetId];
      localStorage.setItem(
        TABLE_COLUMN_ORDER_KEY,
        JSON.stringify(localColumnOrder),
      );
    }
  } catch (e) {
    log.debug("Error in reading local data", e);
  }
};

export const updateAndSyncTableLocalColumnOrders = (
  columnName: string,
  leftOrder: string[],
  rightOrder: string[],
  sticky?: StickyType,
) => {
  if (sticky === StickyType.LEFT) {
    leftOrder.push(columnName);

    if (rightOrder) {
      rightOrder = without(rightOrder, columnName);
    }
  } else if (sticky === StickyType.RIGHT) {
    rightOrder.unshift(columnName);

    // When column is frozen to right from left. Remove the column name from leftOrder
    if (leftOrder) {
      leftOrder = without(leftOrder, columnName);
    }
  } else {
    // remove column from both orders:
    leftOrder = without(leftOrder, columnName);
    rightOrder = without(rightOrder, columnName);
  }

  return { leftOrder, rightOrder };
};

export const getColumnOrderByWidgetIdFromLS = (widgetId: string) => {
  const localTableWidgetColumnOrder = localStorage.getItem(
    TABLE_COLUMN_ORDER_KEY,
  );

  if (localTableWidgetColumnOrder) {
    try {
      const parsedTableWidgetColumnOrder = JSON.parse(
        localTableWidgetColumnOrder,
      );

      if (parsedTableWidgetColumnOrder[widgetId]) {
        const { columnOrder, columnUpdatedAt, leftOrder, rightOrder } =
          parsedTableWidgetColumnOrder[widgetId];

        return {
          columnOrder,
          columnUpdatedAt,
          leftOrder,
          rightOrder,
        };
      }
    } catch (e) {
      log.debug("Unable to parse local column order:", { e });
    }
  }
};

export const getAllStickyColumnsCount = (columns: TableColumnProps[]) => {
  return (
    filter(columns, { sticky: StickyType.LEFT }).length +
    filter(columns, { sticky: StickyType.RIGHT }).length
  );
};

/**
 *
 * @param currentIndex: current dragging item index
 * @param targetIndex: Index poistion of of header that is being hovered
 * @returns
 */
export const getHeaderClassNameOnDragDirection = (
  currentIndex: number,
  targetIndex: number,
) => {
  let parentClasses = "th header-reorder";

  if (currentIndex !== -1) {
    if (targetIndex > currentIndex) {
      parentClasses += " highlight-right";
    } else if (targetIndex < currentIndex) {
      parentClasses += " highlight-left";
    }
  }

  return parentClasses;
};

export const getIndexByColumnName = (
  columnName: string,
  columnOrder?: string[],
) => {
  let currentIndex = -1;

  if (columnOrder) {
    currentIndex = columnOrder.indexOf(columnName);
  }

  return currentIndex;
};

/**
 * A function to get all drag and drop handlers for HeaderCell component.
 * @param columns: React table columns
 * @param currentDraggedColumn: The Mutable ref object that references column being dragged
 * @param handleReorderColumn : Function to handle column reordering.
 * @param columnOrder
 * @returns
 */
export const getDragHandlers = (
  columns: ReactTableColumnProps[],
  currentDraggedColumn: React.MutableRefObject<string>,
  handleReorderColumn: (columnOrder: string[]) => void,
  columnOrder?: string[],
) => {
  const onDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const onDragEnter = (
    e: React.DragEvent<HTMLDivElement>,
    targetIndex: number,
  ) => {
    // We get the parent element(.th) so as to apply left and right highlighting
    const targetElem = e.target as HTMLDivElement;
    const parentTargetElem = targetElem.closest(".th.header-reorder");

    const currentIndex = getIndexByColumnName(
      currentDraggedColumn.current,
      columnOrder,
    );

    if (parentTargetElem) {
      parentTargetElem.className = getHeaderClassNameOnDragDirection(
        currentIndex,
        targetIndex,
      );
    }

    e.stopPropagation();
    e.preventDefault();
  };

  const onDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const targetElem = e.target as HTMLDivElement;

    targetElem.className = targetElem.className.replace(
      " draggable-header--dragging",
      "",
    );
    e.preventDefault();
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    const targetElem = e.target as HTMLDivElement;
    const parentTargetElem = targetElem.closest(".th.header-reorder");

    if (parentTargetElem) {
      parentTargetElem.className = "th header-reorder";
    }

    e.preventDefault();
  };
  const onDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    targetIndex: number,
  ) => {
    // We get the parent element(.th) so as to apply left and right highlighting
    const targetElem = e.target as HTMLDivElement;
    const parentTargetElem = targetElem.closest(".th.header-reorder");

    const currentIndex = getIndexByColumnName(
      currentDraggedColumn.current,
      columnOrder,
    );

    if (parentTargetElem) {
      parentTargetElem.className = getHeaderClassNameOnDragDirection(
        currentIndex,
        targetIndex,
      );
    }

    e.stopPropagation();
    e.preventDefault();
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    currentDraggedColumn.current = columns[index].alias;
    const targetElem = e.target as HTMLDivElement;

    targetElem.className = targetElem.className + " draggable-header--dragging";
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    const targetElem = e.target as HTMLDivElement;

    if (currentDraggedColumn.current) {
      const partialColumnOrder = without(
        columnOrder,
        currentDraggedColumn.current,
      );

      partialColumnOrder.splice(index, 0, currentDraggedColumn.current);
      handleReorderColumn(partialColumnOrder);
    }

    targetElem.className = targetElem.className.replace(
      " draggable-header--dragging",
      "",
    );
    e.stopPropagation();
  };

  return {
    onDrag,
    onDragEnd,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDragStart,
    onDrop,
  };
};

export const getSelectOptions = (
  isNewRow: boolean,
  rowIndex: number,
  columnProperties: ColumnProperties,
) => {
  if (isNewRow) {
    if (
      columnProperties.allowSameOptionsInNewRow &&
      columnProperties?.selectOptions
    ) {
      // Use select options from the first row
      return getArrayPropertyValue(columnProperties.selectOptions, 0);
    } else {
      return columnProperties.newRowSelectOptions;
    }
  } else {
    return getArrayPropertyValue(columnProperties.selectOptions, rowIndex);
  }
};

export function convertNumToCompactString(num: number) {
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + "M";
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + "K";
  } else {
    return num.toString();
  }
}
