import { Colors } from "constants/Colors";
import { FontStyleTypes, TextSizes } from "constants/WidgetConstants";
import _ from "lodash";
import {
  CellAlignmentTypes,
  ColumnProperties,
  ColumnTypes,
  TableStyles,
  VerticalAlignmentTypes,
} from "../component/Constants";
import { ORIGINAL_INDEX_KEY } from "../constants";

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
) => {
  let primaryKey = "";
  let index = -1;

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

//TODO(Balaji): need to evaulate
export const generateTableColumnId = (accessor: string) => {
  return isNaN(Number(accessor)) ? accessor : `_${accessor}`;
};

export function getDefaultColumnProperties(
  accessor: string,
  index: number,
  widgetName: string,
  isDerived?: boolean,
): ColumnProperties {
  const id = generateTableColumnId(accessor);
  const columnProps = {
    index: index,
    width: 150,
    id,
    horizontalAlignment: CellAlignmentTypes.LEFT,
    verticalAlignment: VerticalAlignmentTypes.CENTER,
    columnType: ColumnTypes.TEXT,
    textColor: Colors.THUNDER,
    textSize: TextSizes.PARAGRAPH,
    fontStyle: FontStyleTypes.REGULAR,
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isDisabled: false,
    isCellVisible: true,
    isDerived: !!isDerived,
    label: accessor,
    computedValue: isDerived
      ? ""
      : `{{${widgetName}.sanitizedTableData.map((currentRow) => ( currentRow.${id}))}}`,
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
