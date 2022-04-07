import { Colors } from "constants/Colors";
import { FontStyleTypes, TextSizes } from "constants/WidgetConstants";
import _, { isBoolean, isObject } from "lodash";
import {
  CellAlignmentTypes,
  CellLayoutProperties,
  ColumnProperties,
  TableStyles,
  VerticalAlignmentTypes,
} from "../component/Constants";
import {
  ColumnTypes,
  DEFAULT_COLUMN_WIDTH,
  ORIGINAL_INDEX_KEY,
} from "../constants";
import { SelectColumnOptionsValidations } from "./propertyUtils";

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

export function escapeString(str: string) {
  /*
   * Match all the unescaped `"`
   *  match `"` that follows any character except `\`. ([^\\]\")
   */
  return str.replace(/[^\\]\"/g, (match) => {
    return match.substr(0, match.length - 1) + `\\"`;
  });
}

export function getDefaultColumnProperties(
  id: string,
  sanitizedId: string,
  index: number,
  widgetName: string,
  isDerived?: boolean,
): ColumnProperties {
  const columnProps = {
    allowCellWrapping: false,
    index: index,
    width: DEFAULT_COLUMN_WIDTH,
    originalId: id,
    id: sanitizedId,
    alias: id,
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
    isCellEditable: false,
    isEditable: false,
    isCellVisible: true,
    isDerived: !!isDerived,
    label: id,
    computedValue: isDerived
      ? ""
      : `{{${widgetName}.processedTableData.map((currentRow, currentIndex) => ( currentRow["${escapeString(
          id,
        )}"]))}}`,
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
  value: any,
  index: number,
  preserveCase = false,
) => {
  if (value && isObject(value) && !Array.isArray(value)) {
    return value;
  }
  if (value && Array.isArray(value) && value[index]) {
    return preserveCase
      ? value[index].toString()
      : value[index].toString().toUpperCase();
  } else if (value) {
    return preserveCase ? value.toString() : value.toString().toUpperCase();
  } else {
    return value;
  }
};
export const getBooleanPropertyValue = (value: any, index: number) => {
  if (isBoolean(value)) {
    return value;
  }
  if (Array.isArray(value) && isBoolean(value[index])) {
    return value[index];
  }
  return !!value;
};

export const getCellProperties = (
  columnProperties: ColumnProperties,
  rowIndex: number,
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
      buttonLabelColor: getPropertyValue(
        columnProperties.buttonLabelColor,
        rowIndex,
      ),
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
      boxShadowColor: getPropertyValue(
        columnProperties.boxShadowColor,
        rowIndex,
        true,
      ),
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
      saveActionLabel: getPropertyValue(
        columnProperties.saveActionLabel,
        rowIndex,
        true,
      ),
      discardActionLabel: getPropertyValue(
        columnProperties.discardActionLabel,
        rowIndex,
        true,
      ),
    } as CellLayoutProperties;
  }
  return {} as CellLayoutProperties;
};

const EdtiableColumnTypes: string[] = [
  ColumnTypes.TEXT,
  ColumnTypes.NUMBER,
  ColumnTypes.SELECT,
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
