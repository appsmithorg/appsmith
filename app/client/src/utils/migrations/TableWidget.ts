import {
  FontStyleTypes,
  TextSizes,
  GridDefaults,
} from "constants/WidgetConstants";
import {
  generateTableColumnId,
  getAllTableColumnKeys,
} from "widgets/TableWidget/component/TableHelpers";
import type { ColumnProperties } from "widgets/TableWidget/component/Constants";
import {
  CellAlignmentTypes,
  VerticalAlignmentTypes,
  ColumnTypes,
} from "widgets/TableWidget/component/Constants";
import { Colors } from "constants/Colors";
import type { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { cloneDeep, isString } from "lodash";
import type { WidgetProps } from "widgets/BaseWidget";
import type { DSLWidget } from "widgets/constants";
import { getSubstringBetweenTwoWords } from "utils/helpers";
import { traverseDSLAndMigrate } from "utils/WidgetMigrationUtils";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { stringToJS } from "components/editorComponents/ActionCreator/utils";
import {
  type ColumnProperties as ColumnPropertiesV2,
  StickyType,
} from "widgets/TableWidgetV2/component/Constants";
import {
  ORIGINAL_INDEX_KEY,
  PRIMARY_COLUMN_KEY_VALUE,
} from "widgets/TableWidgetV2/constants";

export const isSortableMigration = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "TABLE_WIDGET" && !child.hasOwnProperty("isSortable")) {
      child["isSortable"] = true;
    } else if (child.children && child.children.length > 0) {
      child = isSortableMigration(child);
    }
    return child;
  });
  return currentDSL;
};
export const tableWidgetPropertyPaneMigrations = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((_child: WidgetProps) => {
    let child = cloneDeep(_child);
    // If the current child is a TABLE_WIDGET
    if (child.type === "TABLE_WIDGET") {
      const hiddenColumns = child.hiddenColumns || [];
      const columnNameMap = child.columnNameMap;
      const columnSizeMap = child.columnSizeMap;
      const columnTypeMap = child.columnTypeMap;
      let tableColumns: string[] = [];
      const dynamicBindingPathList = child.dynamicBindingPathList;
      if (child.tableData.length) {
        let tableData = [];
        // Try parsing the table data, if it parses great
        // If it does not parse, assign tableData the value as is.
        try {
          tableData = JSON.parse(child.tableData);
        } catch (e) {
          tableData = child.tableData;
        }
        if (
          !isString(tableData) &&
          dynamicBindingPathList?.findIndex((item) => item.key !== "tableData")
        ) {
          // Get the list of column ids
          tableColumns = getAllTableColumnKeys(tableData);
        } else {
          child.migrated = false;
        }
      }
      // Get primaryColumns to be the list of column keys
      // Use the old order if it exists, else use the new order
      const primaryColumns = child.columnOrder?.length
        ? child.columnOrder
        : tableColumns;
      child.primaryColumns = {};

      // const hasActions = child.columnActions && child.columnActions.length > 0;
      // Generate new primarycolumns
      primaryColumns.forEach((accessor: string, index: number) => {
        // Get the column type from the columnTypeMap
        let columnType =
          columnTypeMap && columnTypeMap[accessor]
            ? columnTypeMap[accessor].type
            : ColumnTypes.TEXT;
        // If the columnType is currency make it a text type
        // We're deprecating currency types
        if (columnType === "currency") {
          columnType = ColumnTypes.TEXT;
        }
        // Get a full set of column properties
        const column: ColumnProperties = {
          index, // Use to maintain order of columns
          // The widget of the column
          width:
            columnSizeMap && columnSizeMap[accessor]
              ? columnSizeMap[accessor]
              : 150,
          // id of the column
          id: accessor,
          // default horizontal alignment
          horizontalAlignment: CellAlignmentTypes.LEFT,
          // default vertical alignment
          verticalAlignment: VerticalAlignmentTypes.CENTER,
          // columnType
          columnType,
          // default text color
          textColor: Colors.THUNDER,
          // default text size
          textSize: TextSizes.PARAGRAPH,
          // default font size
          fontStyle: FontStyleTypes.REGULAR,
          enableFilter: true,
          enableSort: true,
          // hide the column if it was hidden earlier using hiddenColumns
          isVisible: hiddenColumns.includes(accessor) ? false : true,
          // We did not have a concept of derived columns so far
          isDerived: false,
          // Use renamed names from the map
          // or use the newly generated name
          label:
            columnNameMap && columnNameMap[accessor]
              ? columnNameMap[accessor]
              : accessor,
          // Generate computed value
          computedValue: `{{${child.widgetName}.sanitizedTableData.map((currentRow) => ( currentRow.${accessor})}}`,
        };
        // copy inputForma nd outputFormat for date column types
        if (columnTypeMap && columnTypeMap[accessor]) {
          column.outputFormat = columnTypeMap[accessor].format || "";
          column.inputFormat = columnTypeMap[accessor].inputFormat || "";
        }
        child.primaryColumns[column.id] = column;
      });

      // Get all column actions
      const columnActions = child.columnActions || [];
      // Get dynamicTriggerPathList
      let dynamicTriggerPathList: Array<{ key: string }> =
        child.dynamicTriggerPathList || [];

      const columnPrefix = "customColumn";
      const updatedDerivedColumns: Record<string, ColumnProperties> = {};
      // Add derived column for each column action
      columnActions.forEach((action: ColumnAction, index: number) => {
        const column = {
          index: child.primaryColumns.length + index, // Add to the end of the columns list
          width: 150, // Default width
          id: `${columnPrefix}${index + 1}`, // A random string which was generated previously
          label: action.label, // Revert back to "Actions"
          columnType: "button", // All actions are buttons
          isVisible: true,
          isDisabled: false,
          isDerived: true,
          buttonLabel: action.label,
          buttonStyle: "rgb(3, 179, 101)",
          buttonLabelColor: "#FFFFFF",
          onClick: action.dynamicTrigger,
          computedValue: "",
        };
        dynamicTriggerPathList.push({
          key: `primaryColumns.${columnPrefix}${index + 1}.onClick`,
        });
        updatedDerivedColumns[column.id] = column;
        child.primaryColumns[column.id] = column;
      });

      if (Object.keys(updatedDerivedColumns).length) {
        dynamicTriggerPathList = dynamicTriggerPathList.filter(
          (triggerPath: Record<string, string>) => {
            triggerPath.key !== "columnActions";
          },
        );
      }
      child.dynamicTriggerPathList = dynamicTriggerPathList;
      child.textSize = TextSizes.PARAGRAPH;
      child.horizontalAlignment = CellAlignmentTypes.LEFT;
      child.verticalAlignment = VerticalAlignmentTypes.CENTER;
      child.fontStyle = FontStyleTypes.REGULAR;

      child.derivedColumns = updatedDerivedColumns;
    } else if (child.children && child.children.length > 0) {
      child = tableWidgetPropertyPaneMigrations(child);
    }
    return child;
  });
  return currentDSL;
};

const removeSpecialChars = (value: string, limit?: number) => {
  const separatorRegex = /\W+/;
  return value
    .split(separatorRegex)
    .join("_")
    .slice(0, limit || 30);
};

export const migrateTablePrimaryColumnsBindings = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "TABLE_WIDGET") {
      if (
        child.primaryColumns &&
        Object.keys(child.primaryColumns).length > 0
      ) {
        const newPrimaryColumns: Record<string, ColumnProperties> = {};
        for (const [key, value] of Object.entries(
          child.primaryColumns as Record<string, ColumnProperties>,
        )) {
          const sanitizedKey = removeSpecialChars(key, 200);
          const newComputedValue = value.computedValue
            ? value.computedValue.replace(
                `${child.widgetName}.tableData.map`,
                `${child.widgetName}.sanitizedTableData.map`,
              )
            : "";
          newPrimaryColumns[sanitizedKey] = {
            ...value,
            computedValue: newComputedValue,
          };
        }
        child.primaryColumns = newPrimaryColumns;
        child.dynamicBindingPathList = child.dynamicBindingPathList?.map(
          (path) => {
            path.key = path.key.split(" ").join("_");
            return path;
          },
        );
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateTablePrimaryColumnsBindings(child);
    }
    return child;
  });
  return currentDSL;
};

export const migrateTableWidgetParentRowSpaceProperty = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "TABLE_WIDGET") {
      if (child.parentRowSpace === 40) {
        child.parentRowSpace = GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateTableWidgetParentRowSpaceProperty(child);
    }
    return child;
  });
  return currentDSL;
};

export const migrateTableWidgetHeaderVisibilityProperties = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "TABLE_WIDGET") {
      if (!("isVisibleSearch" in child)) {
        child.isVisibleSearch = true;
        child.isVisibleFilters = true;
        child.isVisibleDownload = true;
        child.isVisiblePagination = true;
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateTableWidgetHeaderVisibilityProperties(child);
    }
    return child;
  });
  return currentDSL;
};

export const migrateTableWidgetDelimiterProperties = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "TABLE_WIDGET") {
      if (!child.delimiter) {
        child.delimiter = ",";
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateTableWidgetDelimiterProperties(child);
    }
    return child;
  });
  return currentDSL;
};

export const migrateTablePrimaryColumnsComputedValue = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "TABLE_WIDGET") {
      if (
        child.primaryColumns &&
        Object.keys(child.primaryColumns).length > 0
      ) {
        const newPrimaryColumns: Record<string, ColumnProperties> = {};
        for (const [key, value] of Object.entries(
          child.primaryColumns as Record<string, ColumnProperties>,
        )) {
          const sanitizedKey = removeSpecialChars(key, 200);
          let newComputedValue = "";
          if (value.computedValue) {
            newComputedValue = value.computedValue.replace(
              `${child.widgetName}.sanitizedTableData.map((currentRow) => { return`,
              `${child.widgetName}.sanitizedTableData.map((currentRow) => (`,
            );
            // change matching "}" bracket with ")"
            const lastParanthesesInd = newComputedValue.length - 4;
            newComputedValue =
              newComputedValue.substring(0, lastParanthesesInd) +
              ")" +
              newComputedValue.substring(lastParanthesesInd + 1);
          }
          newPrimaryColumns[sanitizedKey] = {
            ...value,
            computedValue: newComputedValue,
          };
        }
        child.primaryColumns = newPrimaryColumns;
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateTablePrimaryColumnsComputedValue(child);
    }
    return child;
  });
  return currentDSL;
};

const getUpdatedColumns = (
  widgetName: string,
  columns: Record<string, ColumnProperties>,
) => {
  const updatedColumns: Record<string, ColumnProperties> = {};
  if (columns && Object.keys(columns).length > 0) {
    for (const [columnId, columnProps] of Object.entries(columns)) {
      const sanitizedColumnId = removeSpecialChars(columnId, 200);
      const selectedRowBindingValue = `${widgetName}.selectedRow`;
      let newOnClickBindingValue = undefined;
      if (
        columnProps.onClick &&
        columnProps.onClick.includes(selectedRowBindingValue)
      ) {
        newOnClickBindingValue = columnProps.onClick.replace(
          selectedRowBindingValue,
          "currentRow",
        );
      }
      updatedColumns[sanitizedColumnId] = columnProps;
      if (newOnClickBindingValue)
        updatedColumns[sanitizedColumnId].onClick = newOnClickBindingValue;
    }
  }
  return updatedColumns;
};

export const migrateTableWidgetSelectedRowBindings = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "TABLE_WIDGET") {
      child.derivedColumns = getUpdatedColumns(
        child.widgetName,
        child.derivedColumns as Record<string, ColumnProperties>,
      );
      child.primaryColumns = getUpdatedColumns(
        child.widgetName,
        child.primaryColumns as Record<string, ColumnProperties>,
      );
    } else if (child.children && child.children.length > 0) {
      child = migrateTableWidgetSelectedRowBindings(child);
    }
    return child;
  });
  return currentDSL;
};

/**
 * This migration sanitizes the following properties -
 * primaryColumns object key, for the value of each key - id, computedValue are sanitized
 * columnOrder
 * dynamicBindingPathList
 *
 * This migration solves the following issue -
 * https://github.com/appsmithorg/appsmith/issues/6897
 */
export const migrateTableSanitizeColumnKeys = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "TABLE_WIDGET") {
      const primaryColumnEntries: [string, ColumnProperties][] = Object.entries(
        child.primaryColumns || {},
      );

      const newPrimaryColumns: Record<string, ColumnProperties> = {};
      if (primaryColumnEntries.length) {
        for (const [, primaryColumnEntry] of primaryColumnEntries.entries()) {
          // Value is reassigned when its invalid(Faulty DSL  https://github.com/appsmithorg/appsmith/issues/8979)
          const [key] = primaryColumnEntry;
          let [, value] = primaryColumnEntry;
          const sanitizedKey = removeSpecialChars(key, 200);
          let id = "";
          if (value.id) {
            id = removeSpecialChars(value.id, 200);
          }
          // When id is undefined it's likely value isn't correct and needs fixing
          else if (Object.keys(value)) {
            const onlyKey = Object.keys(value)[0] as keyof ColumnProperties;
            const obj: ColumnProperties = value[onlyKey] as any;
            if (!obj.id && !obj.columnType) {
              continue;
            }
            value = obj;
            id = removeSpecialChars(value.id, 200);
          }

          // Sanitizes "{{Table1.sanitizedTableData.map((currentRow) => ( currentRow.$$$random_header))}}"
          // to "{{Table1.sanitizedTableData.map((currentRow) => ( currentRow._random_header))}}"
          const computedValue = (value?.computedValue || "").replace(
            key,
            sanitizedKey,
          );

          newPrimaryColumns[sanitizedKey] = {
            ...value,
            computedValue,
            id,
          };
        }

        child.primaryColumns = newPrimaryColumns;
      }

      // Sanitizes [ "id", "name", $$$random_header ]
      // to [ "id", "name", _random_header ]
      child.columnOrder = (child.columnOrder || []).map((co: string) =>
        removeSpecialChars(co, 200),
      );

      // Sanitizes [ {key: primaryColumns.$random.header.computedValue }]
      // to [ {key: primaryColumns._random_header.computedValue }]
      child.dynamicBindingPathList = (child.dynamicBindingPathList || []).map(
        (path) => {
          const pathChunks = path.key.split("."); // primaryColumns.$random.header.computedValue -> [ "primaryColumns", "$random", "header", "computedValue"]

          // tableData is a valid dynamicBindingPath and pathChunks would have just one entry
          if (pathChunks.length < 2) {
            return path;
          }

          const firstPart = pathChunks[0] + "."; // "primaryColumns."
          const lastPart = "." + pathChunks[pathChunks.length - 1]; // ".computedValue"

          const key = getSubstringBetweenTwoWords(
            path.key,
            firstPart,
            lastPart,
          ); // primaryColumns.$random.header.computedValue -> $random.header

          const sanitizedPrimaryColumnKey = removeSpecialChars(key, 200);

          return {
            key: firstPart + sanitizedPrimaryColumnKey + lastPart,
          };
        },
      );
    } else if (child.children && child.children.length > 0) {
      child = migrateTableSanitizeColumnKeys(child);
    }

    return child;
  });

  return currentDSL;
};

export const migrateTableWidgetIconButtonVariant = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "TABLE_WIDGET") {
      const primaryColumns = child.primaryColumns as Record<
        string,
        ColumnProperties
      >;
      Object.keys(primaryColumns).forEach((accessor: string) => {
        const primaryColumn = primaryColumns[accessor];

        if (primaryColumn.columnType === "iconButton") {
          if (!("buttonVariant" in primaryColumn)) {
            primaryColumn.buttonVariant = "TERTIARY";
          }
        }
      });
    } else if (child.children && child.children.length > 0) {
      child = migrateTableWidgetIconButtonVariant(child);
    }
    return child;
  });
  return currentDSL;
};

/*
 * DO NOT USE THIS. it overwrites conputedValues of the Table Columns
 */
export const migrateTableWidgetNumericColumnName = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "TABLE_WIDGET") {
      child.columnOrder = (child.columnOrder || []).map((col: string) =>
        generateTableColumnId(col),
      );

      const primaryColumns = { ...child.primaryColumns };
      // clear old primaryColumns
      child.primaryColumns = {};
      for (const key in primaryColumns) {
        if (Object.prototype.hasOwnProperty.call(primaryColumns, key)) {
          const column = primaryColumns[key];
          const columnId = generateTableColumnId(key);
          const newComputedValue = `{{${child.widgetName}.sanitizedTableData.map((currentRow) => ( currentRow.${columnId}))}}`;
          // added column with old accessor
          child.primaryColumns[columnId] = {
            ...column,
            id: columnId,
            computedValue: newComputedValue,
          };
        }
      }

      child.dynamicBindingPathList = (child.dynamicBindingPathList || []).map(
        (path) => {
          const pathChunks = path.key.split(".");
          // tableData is a valid dynamicBindingPath and pathChunks would have just one entry
          if (pathChunks.length < 2) {
            return path;
          }
          const firstPart = pathChunks[0] + "."; // "primaryColumns."
          const lastPart = "." + pathChunks.pop(); // ".computedValue"
          const key = getSubstringBetweenTwoWords(
            path.key,
            firstPart,
            lastPart,
          ); // primaryColumns.$random.header.computedValue -> $random.header

          const sanitizedPrimaryColumnKey = generateTableColumnId(key);
          return {
            key: firstPart + sanitizedPrimaryColumnKey + lastPart,
          };
        },
      );
    } else if (child.children && child.children.length > 0) {
      child = migrateTableWidgetNumericColumnName(child);
    }
    return child;
  });
  return currentDSL;
};

/*
 * Adds validation object to each column in the primaryColumns
 */
export const migrateTableWidgetV2Validation = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "TABLE_WIDGET_V2") {
      const primaryColumns = child.primaryColumns;

      for (const key in primaryColumns) {
        if (primaryColumns.hasOwnProperty(key)) {
          primaryColumns[key].validation = {};
        }
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateTableWidgetV2Validation(child);
    }
    return child;
  });

  return currentDSL;
};

const oldBindingPrefix = `{{
  (
    (editedValue, currentRow, currentIndex) => (
`;
const newBindingPrefix = `{{
  (
    (editedValue, currentRow, currentIndex, isNewRow) => (
`;

const oldBindingSuffix = (tableId: string, columnName: string) => `
  ))
  (
    ${tableId}.columnEditableCellValue.${columnName} || "",
    ${tableId}.processedTableData[${tableId}.editableCell.index] ||
      Object.keys(${tableId}.processedTableData[0])
        .filter(key => ["__originalIndex__", "__primaryKey__"].indexOf(key) === -1)
        .reduce((prev, curr) => {
          prev[curr] = "";
          return prev;
        }, {}),
    ${tableId}.editableCell.index)
}}
`;
const newBindingSuffix = (tableId: string, columnName: string) => {
  return `
    ))
    (
      (${tableId}.isAddRowInProgress ? ${tableId}.newRow.${columnName} : ${tableId}.columnEditableCellValue.${columnName}) || "",
      ${tableId}.isAddRowInProgress ? ${tableId}.newRow : (${tableId}.processedTableData[${tableId}.editableCell.index] ||
        Object.keys(${tableId}.processedTableData[0])
          .filter(key => ["__originalIndex__", "__primaryKey__"].indexOf(key) === -1)
          .reduce((prev, curr) => {
            prev[curr] = "";
            return prev;
          }, {})),
      ${tableId}.isAddRowInProgress ? -1 : ${tableId}.editableCell.index,
      ${tableId}.isAddRowInProgress
    )
  }}
  `;
};

export const migrateTableWidgetV2ValidationBinding = (
  currentDSL: DSLWidget,
) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type === "TABLE_WIDGET_V2") {
      const primaryColumns = widget.primaryColumns;

      for (const column in primaryColumns) {
        if (
          primaryColumns.hasOwnProperty(column) &&
          primaryColumns[column].validation &&
          primaryColumns[column].validation.isColumnEditableCellValid &&
          isDynamicValue(
            primaryColumns[column].validation.isColumnEditableCellValid,
          )
        ) {
          const propertyValue =
            primaryColumns[column].validation.isColumnEditableCellValid;

          const binding = propertyValue
            .replace(oldBindingPrefix, "")
            .replace(oldBindingSuffix(widget.widgetName, column), "");

          primaryColumns[column].validation.isColumnEditableCellValid =
            newBindingPrefix +
            binding +
            newBindingSuffix(widget.widgetName, column);
        }
      }
    }
  });
};

export const migrateTableWidgetV2SelectOption = (currentDSL: DSLWidget) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type === "TABLE_WIDGET_V2") {
      Object.values(
        widget.primaryColumns as Record<
          string,
          { columnType: string; selectOptions: string }
        >,
      )
        .filter((column) => column.columnType === "select")
        .forEach((column) => {
          const selectOptions = column.selectOptions;

          if (selectOptions && isDynamicValue(selectOptions)) {
            column.selectOptions = `{{${
              widget.widgetName
            }.processedTableData.map((currentRow, currentIndex) => ( ${stringToJS(
              selectOptions,
            )}))}}`;
          }
        });
    }
  });
};

export const migrateMenuButtonDynamicItemsInsideTableWidget = (
  currentDSL: DSLWidget,
) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type === "TABLE_WIDGET_V2") {
      const primaryColumns = widget.primaryColumns;

      if (primaryColumns) {
        for (const column in primaryColumns) {
          if (
            primaryColumns.hasOwnProperty(column) &&
            primaryColumns[column].columnType === "menuButton" &&
            !primaryColumns[column].menuItemsSource
          ) {
            primaryColumns[column].menuItemsSource = "STATIC";
          }
        }
      }
    }
  });
};

export const migrateColumnFreezeAttributes = (currentDSL: DSLWidget) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type === "TABLE_WIDGET_V2") {
      const primaryColumns = widget?.primaryColumns;

      // Assign default sticky value to each column
      if (primaryColumns) {
        for (const column in primaryColumns) {
          if (!primaryColumns[column].hasOwnProperty("sticky")) {
            primaryColumns[column].sticky = StickyType.NONE;
          }
        }
      }

      widget.canFreezeColumn = false;
      widget.columnUpdatedAt = Date.now();
    }
  });
};

export const migrateTableSelectOptionAttributesForNewRow = (
  currentDSL: DSLWidget,
) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type === "TABLE_WIDGET_V2") {
      const primaryColumns = widget?.primaryColumns as ColumnPropertiesV2;

      // Set default value for allowSameOptionsInNewRow
      if (primaryColumns) {
        Object.values(primaryColumns).forEach((column) => {
          if (
            column.hasOwnProperty("columnType") &&
            column.columnType === "select"
          ) {
            column.allowSameOptionsInNewRow = true;
          }
        });
      }
    }
  });
};

export const migrateBindingPrefixSuffixForInlineEditValidationControl = (
  currentDSL: DSLWidget,
) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type == "TABLE_WIDGET_V2") {
      const tableId = widget.widgetName;

      const oldBindingPrefix = `{{((isNewRow)=>(`;
      const newBindingPrefix = `{{
        (
          (isNewRow, currentIndex, currentRow) => (
      `;

      const oldBindingSuffix = `))(${tableId}.isAddRowInProgress)}}`;
      const newBindingSuffix = `
      ))
      (
        ${tableId}.isAddRowInProgress,
        ${tableId}.isAddRowInProgress ? -1 : ${tableId}.editableCell.index,
        ${tableId}.isAddRowInProgress ? ${tableId}.newRow : (${tableId}.processedTableData[${tableId}.editableCell.index] ||
          Object.keys(${tableId}.processedTableData[0])
            .filter(key => ["${ORIGINAL_INDEX_KEY}", "${PRIMARY_COLUMN_KEY_VALUE}"].indexOf(key) === -1)
            .reduce((prev, curr) => {
              prev[curr] = "";
              return prev;
            }, {}))
      )
    }}
    `;
      const applicableValidationNames = [
        "min",
        "max",
        "regex",
        "errorMessage",
        "isColumnEditableCellRequired",
      ];
      const primaryColumns = widget?.primaryColumns as ColumnPropertiesV2;
      Object.values(primaryColumns).forEach((column) => {
        if (column.hasOwnProperty("validation")) {
          const validations = column.validation;
          for (const validationName in validations) {
            if (applicableValidationNames.indexOf(validationName) == -1) {
              continue;
            }
            const validationValue = validations[validationName];
            let compressedValidationValue = validationValue.replace(/\s/g, "");
            compressedValidationValue = compressedValidationValue.replaceAll(
              oldBindingPrefix,
              newBindingPrefix,
            );
            compressedValidationValue = compressedValidationValue.replaceAll(
              oldBindingSuffix,
              newBindingSuffix,
            );
            validations[validationName] = compressedValidationValue;
          }
        }
      });
    }
  });
};
