import React, { lazy, Suspense } from "react";
import log from "loglevel";
import moment, { MomentInput } from "moment";
import _, {
  isNumber,
  isString,
  isNil,
  isEqual,
  xor,
  without,
  isBoolean,
  isArray,
  xorWith,
  isEmpty,
  union,
} from "lodash";

import BaseWidget, { WidgetState } from "widgets/BaseWidget";
import { RenderModes, WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import Skeleton from "components/utils/Skeleton";
import { noop, retryPromise } from "utils/AppsmithUtils";

import { getDynamicBindings } from "utils/DynamicBindingUtils";
import { ReactTableFilter, OperatorTypes } from "../component/Constants";
import {
  ColumnTypes,
  COLUMN_MIN_WIDTH,
  DEFAULT_BUTTON_COLOR,
  DEFAULT_BUTTON_LABEL,
  DEFAULT_BUTTON_LABEL_COLOR,
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_MENU_BUTTON_LABEL,
  DEFAULT_MENU_VARIANT,
  EditableCellActions,
  OnColumnEventArgs,
  ORIGINAL_INDEX_KEY,
  TableWidgetProps,
  TransientDataPayload,
} from "../constants";
import derivedProperties from "./parseDerivedProperties";
import {
  getAllTableColumnKeys,
  getDefaultColumnProperties,
  getDerivedColumns,
  getTableStyles,
  getSelectRowIndex,
  getSelectRowIndices,
  getCellProperties,
} from "./utilities";

import {
  ColumnProperties,
  ReactTableColumnProps,
  CompactModeTypes,
  SortOrderTypes,
} from "../component/Constants";
import tablePropertyPaneConfig from "./propertyConfig";
import { BatchPropertyUpdatePayload } from "actions/controlActions";
import { IconName } from "@blueprintjs/icons";
import { Colors } from "constants/Colors";
import { IconNames } from "@blueprintjs/core/node_modules/@blueprintjs/icons";
import equal from "fast-deep-equal/es6";
import { sanitizeKey } from "widgets/WidgetUtils";
import { renderDefault } from "../component/renderHelpers/DefaultRenderer";
import { renderButton } from "../component/renderHelpers/ButtonRenderer";
import { renderSelect } from "../component/renderHelpers/SelectRenderer";
import {
  renderMenuButton,
  RenderMenuButtonProps,
} from "../component/renderHelpers/MenuButtonRenderer";
import { renderImage } from "../component/renderHelpers/ImageRenderer";
import { renderVideo } from "../component/renderHelpers/VideoRenders";
import { renderIconButton } from "../component/renderHelpers/IconButtonRenderer";

const ReactTableComponent = lazy(() =>
  retryPromise(() => import("../component")),
);
const defaultFilter = [
  {
    column: "",
    operator: OperatorTypes.OR,
    value: "",
    condition: "",
  },
];

class TableWidgetV2 extends BaseWidget<TableWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return tablePropertyPaneConfig;
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      pageNo: 1,
      selectedRowIndex: undefined,
      selectedRowIndices: undefined,
      searchText: undefined,
      triggeredRowIndex: undefined,
      filters: [],
      sortOrder: {
        column: "",
        order: null,
      },
      transientTableData: {},
      editableCell: {},
    };
  }

  static getDerivedPropertiesMap() {
    return {
      selectedRow: `{{(()=>{${derivedProperties.getSelectedRow}})()}}`,
      triggeredRow: `{{(()=>{${derivedProperties.getTriggeredRow}})()}}`,
      selectedRows: `{{(()=>{${derivedProperties.getSelectedRows}})()}}`,
      pageSize: `{{(()=>{${derivedProperties.getPageSize}})()}}`,
      triggerRowSelection: "{{!!this.onRowSelected}}",
      processedTableData: `{{(()=>{${derivedProperties.getProcessedTableData}})()}}`,
      orderedTableColumns: `{{(()=>{${derivedProperties.getOrderedTableColumns}})()}}`,
      filteredTableData: `{{(()=>{ ${derivedProperties.getFilteredTableData}})()}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      searchText: "defaultSearchText",
      selectedRowIndex: "defaultSelectedRowIndex",
      selectedRowIndices: "defaultSelectedRowIndices",
    };
  }

  /*
   * Function to get the table columns with appropriate render functions
   * based on columnType
   */
  getTableColumns = () => {
    const {
      columnWidthMap = {},
      filteredTableData = [],
      multiRowSelection,
      selectedRowIndex,
      selectedRowIndices,
      orderedTableColumns = [],
    } = this.props;
    let columns: ReactTableColumnProps[] = [];
    const hiddenColumns: ReactTableColumnProps[] = [];

    const { componentWidth } = this.getComponentDimensions();
    const compactMode = this.props.compactMode || CompactModeTypes.DEFAULT;
    let totalColumnWidth = 0;

    orderedTableColumns.forEach((column: any) => {
      const isHidden = !column.isVisible;
      const columnData = {
        id: column.id,
        Header: column.label,
        alias: column.alias,
        accessor: (row: any) => row[column.alias],
        width: columnWidthMap[column.id] || DEFAULT_COLUMN_WIDTH,
        minWidth: COLUMN_MIN_WIDTH,
        draggable: true,
        isHidden: false,
        isAscOrder: column.isAscOrder,
        isDerived: column.isDerived,
        metaProperties: {
          isHidden: isHidden,
          type: column.columnType,
          format: column.outputFormat || "",
          inputFormat: column.inputFormat || "",
        },
        columnProperties: column,
        Cell: (props: any) => {
          const rowIndex: number = props.cell.row.index;
          const row = filteredTableData[rowIndex];
          const originalIndex = row[ORIGINAL_INDEX_KEY] ?? rowIndex;

          // cellProperties order or size does not change when filter/sorting/grouping is applied
          // on the data thus original index is needed to identify the column's cell property.
          const cellProperties = getCellProperties(column, originalIndex);
          let isSelected = false;

          if (multiRowSelection) {
            isSelected =
              _.isArray(selectedRowIndices) &&
              selectedRowIndices.includes(rowIndex);
          } else {
            isSelected = selectedRowIndex === rowIndex;
          }

          const isColumnEditable = column.isEditable;

          switch (column.columnType) {
            case ColumnTypes.BUTTON:
              const buttonProps = {
                compactMode,
                isSelected: isSelected,
                onCommandClick: (action: string, onComplete: () => void) =>
                  this.onColumnEvent({
                    rowIndex,
                    action,
                    onComplete,
                    triggerPropertyName: "onClick",
                    eventType: EventType.ON_CLICK,
                  }),
                backgroundColor:
                  cellProperties.buttonColor || DEFAULT_BUTTON_COLOR,
                buttonLabelColor:
                  cellProperties.buttonLabelColor || DEFAULT_BUTTON_LABEL_COLOR,
                isDisabled: !!cellProperties.isDisabled,
                isCellVisible: cellProperties.isCellVisible ?? true,
                columnActions: [
                  {
                    id: column.id,
                    label: cellProperties.buttonLabel || DEFAULT_BUTTON_LABEL,
                    dynamicTrigger: column.onClick || "",
                  },
                ],
              };
              return renderButton(buttonProps, isHidden, cellProperties);

            case ColumnTypes.SELECT:
              const onSelect = (value: string) => {
                this.updateTransientTableData({
                  __original_index__: this.getRowOriginalIndex(rowIndex),
                  [props.cell.column.columnProperties.alias]: value,
                });

                if (column.onOptionChange) {
                  this.onColumnEvent({
                    rowIndex,
                    action: column.onOptionChange,
                    triggerPropertyName: "onOptionChange",
                    eventType: EventType.ON_OPTION_CHANGE,
                  });
                }
              };

              return renderSelect({
                cellProperties: cellProperties,
                compactMode,
                options: column.selectOptions,
                onItemSelect: onSelect,
                isCellVisible: cellProperties.isCellVisible ?? true,
                isEditable: isColumnEditable,
                isHidden,
                tableWidth: componentWidth,
                value: props.cell.value,
                width:
                  this.props.columnWidthMap?.[column.id] ||
                  DEFAULT_COLUMN_WIDTH,
              });

            case ColumnTypes.IMAGE:
              const onClick = column.onClick
                ? () =>
                    this.onColumnEvent({
                      rowIndex,
                      action: column.onClick,
                      triggerPropertyName: "onClick",
                      eventType: EventType.ON_CLICK,
                    })
                : noop;

              return renderImage({
                compactMode,
                value: props.cell.value,
                isHidden: isHidden,
                cellProperties: cellProperties,
                isCellVisible: cellProperties.isCellVisible ?? true,
                onClick: onClick,
                isSelected: isSelected,
              });

            case ColumnTypes.MENU_BUTTON:
              const menuButtonProps: RenderMenuButtonProps = {
                compactMode,
                isSelected: isSelected,
                onCommandClick: (action: string, onComplete?: () => void) =>
                  this.onColumnEvent({
                    rowIndex,
                    action,
                    onComplete,
                    triggerPropertyName: "onClick",
                    eventType: EventType.ON_CLICK,
                  }),
                isDisabled: !!cellProperties.isDisabled,
                menuItems: cellProperties.menuItems,
                isCompact: !!cellProperties.isCompact,
                menuVariant: cellProperties.menuVariant ?? DEFAULT_MENU_VARIANT,
                menuColor: cellProperties.menuColor || Colors.GREEN,
                borderRadius: cellProperties.borderRadius,
                boxShadow: cellProperties.boxShadow,
                boxShadowColor: cellProperties.boxShadowColor,
                iconName: cellProperties.iconName,
                iconAlign: cellProperties.iconAlign,
                isCellVisible: cellProperties.isCellVisible ?? true,
                label:
                  cellProperties.menuButtonLabel ?? DEFAULT_MENU_BUTTON_LABEL,
              };

              return renderMenuButton(
                menuButtonProps,
                isHidden,
                cellProperties,
              );

            case ColumnTypes.ICON_BUTTON:
              const iconButtonProps = {
                compactMode,
                isSelected: isSelected,
                onCommandClick: (action: string, onComplete: () => void) =>
                  this.onColumnEvent({
                    rowIndex,
                    action,
                    onComplete,
                    triggerPropertyName: "onClick",
                    eventType: EventType.ON_CLICK,
                  }),
                columnActions: [
                  {
                    id: column.id,
                    dynamicTrigger: column.onClick || "",
                  },
                ],
                iconName: (cellProperties.iconName ||
                  IconNames.ADD) as IconName,
                buttonColor: cellProperties.buttonColor || Colors.GREEN,
                buttonVariant: cellProperties.buttonVariant || "PRIMARY",
                borderRadius: cellProperties.borderRadius || "SHARP",
                boxShadow: cellProperties.boxShadow || "NONE",
                boxShadowColor: cellProperties.boxShadowColor || "",
                isCellVisible: cellProperties.isCellVisible ?? true,
                disabled: !!cellProperties.isDisabled,
              };

              return renderIconButton(
                iconButtonProps,
                isHidden,
                cellProperties,
              );

            case ColumnTypes.VIDEO:
              return renderVideo({
                compactMode,
                value: props.cell.value,
                isHidden: isHidden,
                cellProperties: cellProperties,
                isCellVisible: cellProperties.isCellVisible ?? true,
              });

            default:
              const isCellEditMode =
                props.cell.column.alias === this.props.editableCell.column &&
                rowIndex === this.props.editableCell.index;
              return renderDefault({
                compactMode,
                value: props.cell.value,
                columnType: column.columnType,
                isHidden: isHidden,
                cellProperties: cellProperties,
                tableWidth: componentWidth,
                isCellEditable:
                  (isColumnEditable && cellProperties.isCellEditable) ?? false,
                isCellVisible: cellProperties.isCellVisible ?? true,
                isCellEditMode: isCellEditMode,
                onCellTextChange: (data: string) => {
                  this.props.updateWidgetMetaProperty("editableCell", {
                    ...this.props.editableCell,
                    value: data,
                  });
                },
                toggleCellEditMode: (
                  enable: boolean,
                  action?: EditableCellActions,
                ) => {
                  if (enable) {
                    this.props.updateWidgetMetaProperty("editableCell", {
                      column: props.cell.column.alias,
                      index: rowIndex,
                      value: props.cell.value,
                      // To revert back to previous on discard
                      initialValue: props.cell.value,
                    });

                    /*
                     * We need to clear the selectedRowIndex and selectedRowIndices
                     * if the rows are sorted, to avoid selectedRow jumping to
                     * different page.
                     */
                    if (this.props.sortOrder.column) {
                      if (this.props.multiRowSelection) {
                        this.props.updateWidgetMetaProperty(
                          "selectedRowIndices",
                          [],
                        );
                      } else {
                        this.props.updateWidgetMetaProperty(
                          "selectedRowIndex",
                          -1,
                        );
                      }
                    }
                  } else {
                    if (
                      action === EditableCellActions.SAVE &&
                      props.cell.value !== this.props.editableCell.initialValue
                    ) {
                      this.updateTransientTableData({
                        __original_index__: this.getRowOriginalIndex(rowIndex),
                        [props.cell.column.columnProperties.alias]:
                          props.cell.value,
                      });

                      if (props.cell.column.columnProperties.onSubmit) {
                        this.onColumnEvent({
                          rowIndex: rowIndex,
                          action: props.cell.column.columnProperties.onSubmit,
                          triggerPropertyName: "onSubmit",
                          eventType: EventType.ON_SUBMIT,
                        });
                      }
                    }
                    this.props.updateWidgetMetaProperty("editableCell", {});
                    /*
                     * We need to let the evaulations compute derived property (filteredTableData)
                     * before we clear the editableCell to avoid the text flickering
                     * TODO(Balaji): Need to find a different way to wait before clearing
                     */
                    // setTimeout(() => {
                    //   this.props.updateWidgetMetaProperty("editableCell", {});
                    // }, 100);
                  }
                },
              });
          }
        },
      };

      const isAllCellVisible: boolean | boolean[] = column.isCellVisible;

      /*
       * If all cells are not visible or column itself is not visible,
       * set isHidden and push it to hiddenColumns array else columns array
       */
      if (
        (isBoolean(isAllCellVisible) && !isAllCellVisible) ||
        (isArray(isAllCellVisible) &&
          isAllCellVisible.every((visibility) => visibility === false)) ||
        isHidden
      ) {
        columnData.isHidden = true;
        hiddenColumns.push(columnData);
      } else {
        totalColumnWidth += columnData.width;
        columns.push(columnData);
      }
    });

    if (totalColumnWidth < componentWidth) {
      const lastColumnIndex = columns.length - 1;

      if (columns[lastColumnIndex]) {
        const lastColumnWidth =
          columns[lastColumnIndex].width || DEFAULT_COLUMN_WIDTH;
        const remainingWidth = componentWidth - totalColumnWidth;

        columns[lastColumnIndex].width =
          lastColumnWidth +
          (remainingWidth < DEFAULT_COLUMN_WIDTH
            ? DEFAULT_COLUMN_WIDTH
            : remainingWidth);
      }
    }

    if (hiddenColumns.length && this.props.renderMode === RenderModes.CANVAS) {
      columns = columns.concat(hiddenColumns);
    }

    return columns.filter((column: ReactTableColumnProps) => !!column.id);
  };

  transformData = (
    tableData: Array<Record<string, unknown>>,
    columns: ReactTableColumnProps[],
  ) => {
    return tableData.map((row, rowIndex) => {
      const newRow: { [key: string]: any } = {};

      columns.forEach((column) => {
        const { alias } = column;
        let value = row[alias];

        if (column.metaProperties) {
          switch (column.metaProperties.type) {
            case ColumnTypes.DATE:
              let isValidDate = true;
              let outputFormat = _.isArray(column.metaProperties.format)
                ? column.metaProperties.format[rowIndex]
                : column.metaProperties.format;
              let inputFormat;

              try {
                const type = _.isArray(column.metaProperties.inputFormat)
                  ? column.metaProperties.inputFormat[rowIndex]
                  : column.metaProperties.inputFormat;

                if (type !== "Epoch" && type !== "Milliseconds") {
                  inputFormat = type;
                  moment(value as MomentInput, inputFormat);
                } else if (!isNumber(value)) {
                  isValidDate = false;
                }
              } catch (e) {
                isValidDate = false;
              }

              if (isValidDate && value) {
                try {
                  if (outputFormat === "SAME_AS_INPUT") {
                    outputFormat = inputFormat;
                  }

                  if (column.metaProperties.inputFormat === "Milliseconds") {
                    value = Number(value);
                  } else if (column.metaProperties.inputFormat === "Epoch") {
                    value = 1000 * Number(value);
                  }

                  newRow[alias] = moment(
                    value as MomentInput,
                    inputFormat,
                  ).format(outputFormat);
                } catch (e) {
                  log.debug("Unable to parse Date:", { e });
                  newRow[alias] = "";
                }
              } else if (value) {
                newRow[alias] = "Invalid Value";
              } else {
                newRow[alias] = "";
              }
              break;
            default:
              let data;

              if (_.isString(value) || _.isNumber(value)) {
                data = value;
              } else if (isNil(value)) {
                data = "";
              } else {
                data = JSON.stringify(value);
              }

              newRow[alias] = data;
              break;
          }
        }
      });

      /*
       * Inject the edited cell value from the editableCell object
       */
      if (this.props.editableCell.index === rowIndex) {
        const { column, value } = this.props.editableCell;

        newRow[column] = value;
      }

      return newRow;
    });
  };

  updateDerivedColumnsIndex = (
    derivedColumns: Record<string, ColumnProperties>,
    tableColumnCount: number,
  ) => {
    if (!derivedColumns) {
      return [];
    }

    //update index property of all columns in new derived columns
    return Object.values(derivedColumns).map(
      (column: ColumnProperties, index: number) => {
        return {
          ...column,
          index: index + tableColumnCount,
        };
      },
    );
  };

  /*
   * Function to create new primary Columns from the tableData
   * gets called on component mount and on component update
   */
  createTablePrimaryColumns = ():
    | Record<string, ColumnProperties>
    | undefined => {
    const { tableData = [], primaryColumns = {} } = this.props;

    if (!_.isArray(tableData) || tableData.length === 0) {
      return;
    }

    const existingColumnIds = Object.keys(primaryColumns);
    const newTableColumns: Record<string, ColumnProperties> = {};
    const tableStyles = getTableStyles(this.props);
    const columnKeys: string[] = getAllTableColumnKeys(tableData);

    /*
     * Generate default column properties for all columns
     * But do not replace existing columns with the same id
     */
    columnKeys.forEach((columnKey, index) => {
      const existingColumn = this.getColumnByOriginalId(columnKey);

      if (!!existingColumn) {
        // Use the existing column properties
        newTableColumns[existingColumn.id] = existingColumn;
      } else {
        const hashedColumnKey = sanitizeKey(columnKey, {
          existingKeys: union(existingColumnIds, Object.keys(newTableColumns)),
        });
        // Create column properties for the new column
        const columnProperties = getDefaultColumnProperties(
          columnKey,
          hashedColumnKey,
          index,
          this.props.widgetName,
        );

        newTableColumns[columnProperties.id] = {
          ...columnProperties,
          ...tableStyles,
        };
      }
    });

    const derivedColumns: Record<string, ColumnProperties> = getDerivedColumns(
      primaryColumns,
    );

    const updatedDerivedColumns = this.updateDerivedColumnsIndex(
      derivedColumns,
      Object.keys(newTableColumns).length,
    );

    //add derived columns to new Table columns
    updatedDerivedColumns.forEach((derivedColumn: ColumnProperties) => {
      newTableColumns[derivedColumn.id] = derivedColumn;
    });

    const newColumnIds = Object.keys(newTableColumns);

    // check if the columns ids differ
    if (_.xor(existingColumnIds, newColumnIds).length > 0) {
      return newTableColumns;
    } else {
      return;
    }
  };

  /*
   * Function to update primaryColumns when the tablData schema changes
   */
  updateColumnProperties = (
    tableColumns?: Record<string, ColumnProperties>,
  ) => {
    const { columnOrder = [], primaryColumns = {} } = this.props;
    const derivedColumns = getDerivedColumns(primaryColumns);

    if (tableColumns) {
      const existingColumnIds = Object.keys(primaryColumns);
      const existingDerivedColumnIds = Object.keys(derivedColumns);

      const newColumnIds = Object.keys(tableColumns);

      //Check if there is any difference in the existing and new columns ids
      if (_.xor(existingColumnIds, newColumnIds).length > 0) {
        const newColumnIdsToAdd = _.without(newColumnIds, ...existingColumnIds);

        const propertiesToAdd: Record<string, unknown> = {};

        newColumnIdsToAdd.forEach((columnId: string) => {
          // id could be an empty string
          if (!!columnId) {
            Object.entries(tableColumns[columnId]).forEach(([key, value]) => {
              propertiesToAdd[`primaryColumns.${columnId}.${key}`] = value;
            });
          }
        });

        /*
         * If new columnOrders have different values from the original columnOrders
         * Only update when there are new Columns(Derived or Primary)
         */
        if (
          !!newColumnIds.length &&
          !!_.xor(newColumnIds, columnOrder).length &&
          !_.isEqual(_.sortBy(newColumnIds), _.sortBy(existingDerivedColumnIds))
        ) {
          propertiesToAdd["columnOrder"] = Object.keys(tableColumns);
        }

        const aliasMap: Record<string, string> = {};

        Object.values(tableColumns).forEach((column) => {
          aliasMap[column.originalId] = column.alias || column.originalId;
        });

        propertiesToAdd["aliasMap"] = aliasMap;

        const propertiesToUpdate: BatchPropertyUpdatePayload = {
          modify: propertiesToAdd,
        };

        const pathsToDelete: string[] = [];
        const columnsIdsToDelete = without(existingColumnIds, ...newColumnIds);

        if (!!columnsIdsToDelete.length) {
          columnsIdsToDelete.forEach((id: string) => {
            if (!primaryColumns[id].isDerived) {
              pathsToDelete.push(`primaryColumns.${id}`);
            }
          });
          propertiesToUpdate.remove = pathsToDelete;
        }

        super.batchUpdateWidgetProperty(propertiesToUpdate, false);
      }
    }
  };

  componentDidMount() {
    const { tableData } = this.props;

    if (_.isArray(tableData) && !!tableData.length) {
      const newPrimaryColumns = this.createTablePrimaryColumns();

      // When the Table data schema changes
      if (newPrimaryColumns && !!Object.keys(newPrimaryColumns).length) {
        this.updateColumnProperties(newPrimaryColumns);
      }
    }
  }

  componentDidUpdate(prevProps: TableWidgetProps) {
    const {
      defaultSelectedRowIndex,
      defaultSelectedRowIndices,
      onPageSizeChange,
      pageNo,
      pageSize,
      primaryColumns = {},
      serverSidePaginationEnabled,
      totalRecordsCount,
      multiRowSelection,
    } = this.props;

    // Bail out if tableData is a string. This signifies an error in evaluations
    if (isString(this.props.tableData)) {
      return;
    }

    // Check if tableData is modifed
    const isTableDataModified = !equal(
      this.props.tableData,
      prevProps.tableData,
    );

    // If the user has changed the tableData OR
    // The binding has returned a new value
    if (isTableDataModified) {
      this.updateMetaRowData(
        prevProps.filteredTableData,
        this.props.filteredTableData,
      );

      this.resetWidgetDefault();

      const newColumnIds: string[] = getAllTableColumnKeys(
        this.props.tableData,
      );
      const primaryColumnIds = Object.keys(primaryColumns).filter(
        (id: string) => !primaryColumns[id].isDerived,
      );

      if (xor(newColumnIds, primaryColumnIds).length > 0) {
        const newTableColumns = this.createTablePrimaryColumns();

        if (newTableColumns) {
          this.updateColumnProperties(newTableColumns);
        }
      }
    }

    /*
     * Clear transient table data and editablecell when tableData changes
     */
    if (isTableDataModified) {
      this.props.updateWidgetMetaProperty("transientTableData", {});
      this.props.updateWidgetMetaProperty("editableCell", {});
    }

    if (!pageNo) {
      this.props.updateWidgetMetaProperty("pageNo", 1);
    }

    //check if pageNo does not excede the max Page no, due to change of totalRecordsCount
    if (serverSidePaginationEnabled && totalRecordsCount) {
      const maxAllowedPageNumber = Math.ceil(totalRecordsCount / pageSize);

      if (pageNo > maxAllowedPageNumber) {
        this.props.updateWidgetMetaProperty("pageNo", maxAllowedPageNumber);
      }
    } else if (
      serverSidePaginationEnabled !== prevProps.serverSidePaginationEnabled
    ) {
      //reset pageNo when serverSidePaginationEnabled is toggled
      this.props.updateWidgetMetaProperty("pageNo", 1);
    }

    /*
     * When defaultSelectedRowIndex or defaultSelectedRowIndices
     * is changed from property pane
     */
    if (
      !isEqual(defaultSelectedRowIndex, prevProps.defaultSelectedRowIndex) ||
      !isEqual(defaultSelectedRowIndices, prevProps.defaultSelectedRowIndices)
    ) {
      this.updateSelectedRowIndex();
    }

    if (pageSize !== prevProps.pageSize) {
      this.props.updateWidgetMetaProperty("pageNo", 1);

      if (onPageSizeChange) {
        super.executeAction({
          triggerPropertyName: "onPageSizeChange",
          dynamicString: onPageSizeChange,
          event: {
            type: EventType.ON_PAGE_SIZE_CHANGE,
          },
        });
      }
    }

    if (multiRowSelection !== prevProps.multiRowSelection) {
      if (multiRowSelection) {
        if (
          defaultSelectedRowIndices &&
          _.isArray(defaultSelectedRowIndices) &&
          defaultSelectedRowIndices.every((i) => _.isFinite(i))
        ) {
          this.props.updateWidgetMetaProperty(
            "selectedRowIndices",
            defaultSelectedRowIndices,
          );
        }

        this.props.updateWidgetMetaProperty("selectedRowIndex", -1);
      } else {
        if (!isNil(defaultSelectedRowIndex) && defaultSelectedRowIndex > -1) {
          this.props.updateWidgetMetaProperty(
            "selectedRowIndex",
            defaultSelectedRowIndex,
          );
        }

        this.props.updateWidgetMetaProperty("selectedRowIndices", []);
      }
    }
  }

  /*
   *  Function to reset filter and triggeredRowIndex when
   *  component props change
   */
  resetWidgetDefault = () => {
    const defaultFilter = [
      {
        column: "",
        operator: OperatorTypes.OR,
        value: "",
        condition: "",
      },
    ];

    this.props.updateWidgetMetaProperty("filters", defaultFilter);
    this.props.updateWidgetMetaProperty("triggeredRowIndex", undefined);
  };

  /*
   * Function to update selectedRowIndices & selectedRowIndex from
   * defaultSelectedRowIndices & defaultSelectedRowIndex respectively
   */
  updateSelectedRowIndex = () => {
    const {
      defaultSelectedRowIndex,
      defaultSelectedRowIndices,
      multiRowSelection,
    } = this.props;

    if (multiRowSelection) {
      this.props.updateWidgetMetaProperty(
        "selectedRowIndices",
        defaultSelectedRowIndices,
      );
    } else {
      this.props.updateWidgetMetaProperty(
        "selectedRowIndex",
        defaultSelectedRowIndex,
      );
    }
  };

  /*
   * Function to update selectedRow details when order of tableData changes
   */
  updateMetaRowData = (
    oldTableData: Array<Record<string, unknown>>,
    newTableData: Array<Record<string, unknown>>,
  ) => {
    const {
      defaultSelectedRowIndex,
      defaultSelectedRowIndices,
      multiRowSelection,
      primaryColumnId,
      selectedRowIndex,
      selectedRowIndices,
    } = this.props;

    if (multiRowSelection) {
      const indices = getSelectRowIndices(
        oldTableData,
        newTableData,
        defaultSelectedRowIndices,
        selectedRowIndices,
        primaryColumnId,
      );

      this.props.updateWidgetMetaProperty("selectedRowIndices", indices);
    } else {
      const index = getSelectRowIndex(
        oldTableData,
        newTableData,
        defaultSelectedRowIndex,
        selectedRowIndex,
        primaryColumnId,
      );

      this.props.updateWidgetMetaProperty("selectedRowIndex", index);
    }
  };

  //TODO(balaji): Move to utilities and write test cases
  getSelectedRowIndices = () => {
    const { multiRowSelection, selectedRowIndices } = this.props;

    let indices: number[] | undefined;

    if (multiRowSelection) {
      if (_.isArray(selectedRowIndices)) {
        indices = selectedRowIndices;
      } else if (_.isNumber(selectedRowIndices)) {
        indices = [selectedRowIndices];
      } else {
        indices = [];
      }
    } else {
      indices = undefined;
    }

    return indices;
  };

  updateFilters = (filters: ReactTableFilter[]) => {
    this.resetSelectedRowIndex();
    this.props.updateWidgetMetaProperty("filters", filters);

    // Reset Page only when a filter is added
    if (!isEmpty(xorWith(filters, defaultFilter, isEqual))) {
      this.props.updateWidgetMetaProperty("pageNo", 1);
    }
  };

  toggleDrag = (disable: boolean) => {
    this.disableDrag(disable);
  };

  getPageView() {
    const {
      totalRecordsCount,
      delimiter,
      pageSize,
      filteredTableData = [],
      isVisibleDownload,
      isVisibleFilters,
      isVisiblePagination,
      isVisibleSearch,
    } = this.props;
    const tableColumns = this.getTableColumns() || [];
    const transformedData = this.transformData(filteredTableData, tableColumns);
    const isVisibleHeaderOptions =
      isVisibleDownload ||
      isVisibleFilters ||
      isVisiblePagination ||
      isVisibleSearch;

    const { componentHeight, componentWidth } = this.getComponentDimensions();

    return (
      <Suspense fallback={<Skeleton />}>
        <ReactTableComponent
          applyFilter={this.updateFilters}
          columnWidthMap={this.props.columnWidthMap}
          columns={tableColumns}
          compactMode={this.props.compactMode || CompactModeTypes.DEFAULT}
          delimiter={delimiter}
          disableDrag={this.toggleDrag}
          editMode={this.props.renderMode === RenderModes.CANVAS}
          editableCell={this.props.editableCell}
          filters={this.props.filters}
          handleReorderColumn={this.handleReorderColumn}
          handleResizeColumn={this.handleResizeColumn}
          height={componentHeight}
          isLoading={this.props.isLoading}
          isSortable={this.props.isSortable ?? true}
          isVisibleDownload={isVisibleDownload}
          isVisibleFilters={isVisibleFilters}
          isVisiblePagination={isVisiblePagination}
          isVisibleSearch={isVisibleSearch}
          multiRowSelection={this.props.multiRowSelection}
          nextPageClick={this.handleNextPageClick}
          onRowClick={this.handleRowClick}
          pageNo={this.props.pageNo}
          pageSize={
            isVisibleHeaderOptions ? Math.max(1, pageSize) : pageSize + 1
          }
          prevPageClick={this.handlePrevPageClick}
          searchKey={this.props.searchText}
          searchTableData={this.handleSearchTable}
          selectAllRow={this.handleAllRowSelect}
          selectedRowIndex={
            this.props.selectedRowIndex === undefined
              ? -1
              : this.props.selectedRowIndex
          }
          selectedRowIndices={this.getSelectedRowIndices()}
          serverSidePaginationEnabled={!!this.props.serverSidePaginationEnabled}
          sortTableColumn={this.handleColumnSorting}
          tableData={transformedData}
          totalRecordsCount={totalRecordsCount}
          triggerRowSelection={this.props.triggerRowSelection}
          unSelectAllRow={this.unSelectAllRow}
          updatePageNo={this.updatePageNumber}
          widgetId={this.props.widgetId}
          widgetName={this.props.widgetName}
          width={componentWidth}
        />
      </Suspense>
    );
  }

  handleReorderColumn = (columnOrder: string[]) => {
    columnOrder = columnOrder.map((alias) => this.getColumnIdByAlias(alias));

    if (this.props.renderMode === RenderModes.CANVAS) {
      super.updateWidgetProperty("columnOrder", columnOrder);
    } else {
      this.props.updateWidgetMetaProperty("columnOrder", columnOrder);
    }
  };

  handleColumnSorting = (columnAccessor: string, isAsc: boolean) => {
    const columnId = this.getColumnIdByAlias(columnAccessor);
    this.resetSelectedRowIndex();

    let sortOrderProps;

    if (columnId) {
      sortOrderProps = {
        column: columnId,
        order: isAsc ? SortOrderTypes.asc : SortOrderTypes.desc,
      };
    } else {
      sortOrderProps = {
        column: "",
        order: null,
      };
    }

    this.props.updateWidgetMetaProperty("sortOrder", sortOrderProps, {
      triggerPropertyName: "onSort",
      dynamicString: this.props.onSort,
      event: {
        type: EventType.ON_SORT,
      },
    });
  };

  handleResizeColumn = (columnWidthMap: { [key: string]: number }) => {
    if (this.props.renderMode === RenderModes.CANVAS) {
      super.updateWidgetProperty("columnWidthMap", columnWidthMap);
    } else {
      this.props.updateWidgetMetaProperty("columnWidthMap", columnWidthMap);
    }
  };

  handleSearchTable = (searchKey: any) => {
    const { multiRowSelection, onSearchTextChanged } = this.props;

    /*
     * Clear rowSelection to avoid selecting filtered rows
     * based on stale selection indices
     */
    if (multiRowSelection) {
      this.props.updateWidgetMetaProperty("selectedRowIndices", []);
    } else {
      this.props.updateWidgetMetaProperty("selectedRowIndex", -1);
    }

    this.props.updateWidgetMetaProperty("pageNo", 1);
    this.props.updateWidgetMetaProperty("searchText", searchKey, {
      triggerPropertyName: "onSearchTextChanged",
      dynamicString: onSearchTextChanged,
      event: {
        type: EventType.ON_SEARCH,
      },
    });
  };

  /*
   * Function to handle customColumn button type click interactions
   */
  onColumnEvent = ({
    rowIndex,
    action,
    onComplete = noop,
    triggerPropertyName,
    eventType,
  }: OnColumnEventArgs) => {
    const { filteredTableData = [] } = this.props;

    try {
      const row = filteredTableData[rowIndex];

      const { jsSnippets } = getDynamicBindings(action);
      const modifiedAction = jsSnippets.reduce((prev: string, next: string) => {
        return prev + `{{ ${next} }} `;
      }, "");

      if (modifiedAction) {
        this.props.updateWidgetMetaProperty(
          "triggeredRowIndex",
          row[ORIGINAL_INDEX_KEY],
          {
            triggerPropertyName: triggerPropertyName,
            dynamicString: modifiedAction,
            event: {
              type: eventType,
              callback: onComplete,
            },
            globalContext: { currentRow: row },
          },
        );
      } else {
        onComplete();
      }
    } catch (error) {
      log.debug("Error parsing row action", error);
    }
  };

  onDropdownOptionSelect = (action: string) => {
    super.executeAction({
      dynamicString: action,
      event: {
        type: EventType.ON_OPTION_CHANGE,
      },
    });
  };

  handleAllRowSelect = (pageData: Record<string, unknown>[]) => {
    if (this.props.multiRowSelection) {
      const selectedRowIndices = pageData.map(
        (row: Record<string, unknown>) => row.index,
      );
      this.props.updateWidgetMetaProperty(
        "selectedRowIndices",
        selectedRowIndices,
      );
    }
  };

  handleRowClick = (row: Record<string, unknown>, selectedIndex: number) => {
    const {
      multiRowSelection,
      selectedRowIndex,
      selectedRowIndices,
    } = this.props;

    if (multiRowSelection) {
      let indices: Array<number>;

      if (_.isArray(selectedRowIndices)) {
        indices = [...selectedRowIndices];
      } else {
        indices = [];
      }

      /*
       * Deselect if the index is already present
       */
      if (indices.includes(selectedIndex)) {
        indices.splice(indices.indexOf(selectedIndex), 1);
        this.props.updateWidgetMetaProperty("selectedRowIndices", indices);
      } else {
        /*
         * select if the index is not present already
         */
        indices.push(selectedIndex);

        this.props.updateWidgetMetaProperty("selectedRowIndices", indices, {
          triggerPropertyName: "onRowSelected",
          dynamicString: this.props.onRowSelected,
          event: {
            type: EventType.ON_ROW_SELECTED,
          },
        });
      }
    } else {
      let index;

      if (isNumber(selectedRowIndex)) {
        index = selectedRowIndex;
      } else {
        index = -1;
      }

      if (index !== selectedIndex) {
        this.props.updateWidgetMetaProperty("selectedRowIndex", selectedIndex, {
          triggerPropertyName: "onRowSelected",
          dynamicString: this.props.onRowSelected,
          event: {
            type: EventType.ON_ROW_SELECTED,
          },
        });
      } else {
        this.props.updateWidgetMetaProperty("selectedRowIndex", -1);
      }
    }
  };

  updatePageNumber = (pageNo: number, event?: EventType) => {
    if (event) {
      this.props.updateWidgetMetaProperty("pageNo", pageNo, {
        triggerPropertyName: "onPageChange",
        dynamicString: this.props.onPageChange,
        event: {
          type: event,
        },
      });
    } else {
      this.props.updateWidgetMetaProperty("pageNo", pageNo);
    }

    if (this.props.onPageChange) {
      this.resetSelectedRowIndex();
    }
  };

  handleNextPageClick = () => {
    const pageNo = (this.props.pageNo || 1) + 1;

    this.props.updateWidgetMetaProperty("pageNo", pageNo, {
      triggerPropertyName: "onPageChange",
      dynamicString: this.props.onPageChange,
      event: {
        type: EventType.ON_NEXT_PAGE,
      },
    });

    if (this.props.onPageChange) {
      this.resetSelectedRowIndex();
    }
  };

  resetSelectedRowIndex = () => {
    const {
      defaultSelectedRowIndex,
      defaultSelectedRowIndices,
      multiRowSelection,
    } = this.props;

    if (multiRowSelection) {
      this.props.updateWidgetMetaProperty(
        "selectedRowIndices",
        defaultSelectedRowIndices,
      );
    } else {
      this.props.updateWidgetMetaProperty(
        "selectedRowIndex",
        defaultSelectedRowIndex,
      );
    }
  };

  unSelectAllRow = () => {
    this.props.updateWidgetMetaProperty("selectedRowIndices", []);
  };

  handlePrevPageClick = () => {
    const pageNo = (this.props.pageNo || 1) - 1;

    if (pageNo >= 1) {
      this.props.updateWidgetMetaProperty("pageNo", pageNo, {
        triggerPropertyName: "onPageChange",
        dynamicString: this.props.onPageChange,
        event: {
          type: EventType.ON_PREV_PAGE,
        },
      });

      if (this.props.onPageChange) {
        this.resetSelectedRowIndex();
      }
    }
  };

  static getWidgetType(): WidgetType {
    return "TABLE_WIDGET_V2";
  }

  getColumnIdByAlias(alias: string) {
    const { primaryColumns } = this.props;

    if (primaryColumns) {
      const column = Object.values(primaryColumns).find(
        (column) => column.alias === alias,
      );

      if (column) {
        return column.id;
      }
    }

    return alias;
  }

  getColumnByOriginalId(originalId: string) {
    return Object.values(this.props.primaryColumns).find((column) => {
      return column.originalId === originalId;
    });
  }
  updateTransientTableData = (data: TransientDataPayload) => {
    const { __original_index__, ...transientData } = data;

    this.props.updateWidgetMetaProperty("transientTableData", {
      ...this.props.transientTableData,
      [__original_index__]: {
        ...this.props.transientTableData[__original_index__],
        ...transientData,
      },
    });
  };

  getRowOriginalIndex = (index: number) => {
    const { filteredTableData } = this.props;

    if (filteredTableData) {
      const row = filteredTableData[index];

      if (row) {
        return row[ORIGINAL_INDEX_KEY];
      }
    }

    return -1;
  };
}

export default TableWidgetV2;
