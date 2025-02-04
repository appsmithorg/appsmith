import { Colors } from "constants/Colors";
import { FontStyleTypes } from "constants/WidgetConstants";
import _, { filter, isBoolean, isObject, uniq, without } from "lodash";
import type {
  CellLayoutProperties,
  ColumnProperties,
  ReactTableColumnProps,
  TableColumnProps,
  TableStyles,
} from "../component/Constants";
import { StickyType } from "../component/Constants";
import {
  ColumnTypes,
  DEFAULT_BUTTON_COLOR,
  DEFAULT_COLUMN_WIDTH,
  TABLE_COLUMN_ORDER_KEY,
  ORIGINAL_INDEX_KEY,
} from "../constants";
import { SelectColumnOptionsValidations } from "./propertyUtils";
import type { TableWidgetProps } from "../constants";
import { getNextEntityName } from "utils/AppsmithUtils";
import { dateFormatOptions } from "WidgetProvider/constants";
import { format, parse, isValid } from "date-fns";
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
    const selectedRow = tableData.find(
      (row) => row[primaryColumnId] === primaryKey,
    );

    if (selectedRow) {
      index = selectedRow[ORIGINAL_INDEX_KEY] as number;
    }
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
) {
  const columnProps = {
    allowCellWrapping: false,
    allowSameOptionsInNewRow: true,
    index: index,
    width: DEFAULT_COLUMN_WIDTH,
    originalId: id,
    id: sanitizedId,
    alias: id,
    horizontalAlignment: columnType === ColumnTypes.NUMBER ? "end" : "start",
    verticalAlignment: "center",
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
    sticky: StickyType.NONE,
    validation: {},
    currencyCode: "USD",
    decimals: 0,
    thousandSeparator: true,
    notation: "standard" as Intl.NumberFormatOptions["notation"],
    buttonColor: "accent",
  } as ColumnProperties;

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
) => {
  if (columnProperties) {
    return {
      cellColor: getPropertyValue(columnProperties.cellColor, rowIndex, true),
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
      buttonColor: getPropertyValue(
        columnProperties.buttonColor,
        rowIndex,
        true,
      ),
      buttonLabel: getPropertyValue(
        columnProperties.buttonLabel,
        rowIndex,
        true,
      ),
      iconName: getPropertyValue(columnProperties.iconName, rowIndex, true),
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
      iconButtonStyle: getPropertyValue(
        columnProperties.iconButtonStyle,
        rowIndex,
        true,
      ),
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
      allowCellWrapping: getBooleanPropertyValue(
        columnProperties.allowCellWrapping,
        rowIndex,
      ),
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
  const column = {
    ...createColumn(props, "EditActions"),
    ...getEditActionColumnProperties(),
    columnType: ColumnTypes.EDIT_ACTIONS,
    label: "Save / Discard",
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
    case "string":
      return dateFormatOptions.some(({ value: dateFormat }) =>
        isValid(parse(columnValue as string, dateFormat, new Date())),
      )
        ? ColumnTypes.DATE
        : ColumnTypes.TEXT;
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
 * returns the highlight position when the column header is dragged
 *
 * @param currentIndex: current dragging item index
 * @param targetIndex: Index poistion of of header that is being hovered
 * @returns "start" | "end" | "none
 */
export const getHighlightPosition = (
  currentIndex: number,
  targetIndex: number,
) => {
  let position = "none";

  if (currentIndex !== -1) {
    if (targetIndex > currentIndex) {
      position = "end";
    } else if (targetIndex < currentIndex) {
      position = "start";
    }
  }

  return position;
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
    const parentTargetElem = targetElem.closest("th");

    const currentIndex = getIndexByColumnName(
      currentDraggedColumn.current,
      columnOrder,
    );

    if (parentTargetElem) {
      if (parentTargetElem) {
        parentTargetElem.dataset.highlightPosition = getHighlightPosition(
          currentIndex,
          targetIndex,
        );
      }
    }

    e.stopPropagation();
    e.preventDefault();
  };

  const onDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const targetElem = e.target as HTMLDivElement;

    targetElem.dataset.status = "";
    e.preventDefault();
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    const targetElem = e.target as HTMLDivElement;
    const parentTargetElem = targetElem.closest("th");

    if (parentTargetElem) {
      parentTargetElem.dataset.highlightPosition = "none";
    }

    e.preventDefault();
  };
  const onDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    targetIndex: number,
  ) => {
    // We get the parent element(.th) so as to apply left and right highlighting
    const targetElem = e.target as HTMLDivElement;
    const parentTargetElem = targetElem.closest("th");

    const currentIndex = getIndexByColumnName(
      currentDraggedColumn.current,
      columnOrder,
    );

    if (parentTargetElem) {
      parentTargetElem.dataset.highlightPosition = getHighlightPosition(
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

    targetElem.dataset.status = "dragging";
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

    targetElem.dataset.status = "";
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

export function convertNumToCompactString(num: number) {
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + "M";
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + "K";
  } else {
    return num.toString();
  }
}
