import React, { lazy, Suspense } from "react";
import BaseWidget, { WidgetState } from "../BaseWidget";
import { RenderModes, WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/ActionConstants";
import {
  compare,
  getDefaultColumnProperties,
  renderCell,
  renderDropdown,
  renderActions,
  sortTableFunction,
  reorderColumns,
} from "components/designSystems/appsmith/TableComponent/TableUtilities";
import { getAllTableColumnKeys } from "components/designSystems/appsmith/TableComponent/TableHelpers";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import {
  BASE_WIDGET_VALIDATION,
  WidgetPropertyValidationType,
} from "utils/WidgetValidation";
import { TriggerPropertiesMap } from "utils/WidgetFactory";
import Skeleton from "components/utils/Skeleton";
import moment from "moment";
import { isNumber, isString, isUndefined, isEqual } from "lodash";
import * as Sentry from "@sentry/react";
import { retryPromise } from "utils/AppsmithUtils";
import withMeta from "../MetaHOC";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import log from "loglevel";
import { ReactTableFilter } from "components/designSystems/appsmith/TableComponent/TableFilters";
import { TableWidgetProps } from "./TableWidgetConstants";

import {
  ColumnProperties,
  CellLayoutProperties,
  ReactTableColumnProps,
  ColumnTypes,
  Operator,
  OperatorTypes,
  TABLE_SIZES,
  CompactModeTypes,
  CompactMode,
} from "components/designSystems/appsmith/TableComponent/Constants";
import tableProperyPaneConfig from "./TablePropertyPaneConfig";

const ReactTableComponent = lazy(() =>
  retryPromise(() =>
    import("components/designSystems/appsmith/TableComponent"),
  ),
);

class TableWidget extends BaseWidget<TableWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      tableData: VALIDATION_TYPES.TABLE_DATA,
      nextPageKey: VALIDATION_TYPES.TEXT,
      prevPageKey: VALIDATION_TYPES.TEXT,
      label: VALIDATION_TYPES.TEXT,
      searchText: VALIDATION_TYPES.TEXT,
      defaultSearchText: VALIDATION_TYPES.TEXT,
      primaryColumns: VALIDATION_TYPES.COLUMN_PROPERTIES_ARRAY,
      derviedColumns: VALIDATION_TYPES.COLUMN_PROPERTIES_ARRAY,
      defaultSelectedRow: VALIDATION_TYPES.DEFAULT_SELECTED_ROW,
    };
  }

  static getPropertyPaneConfig() {
    return tableProperyPaneConfig;
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      pageNo: 1,
      pageSize: undefined,
      selectedRowIndex: undefined,
      selectedRowIndices: undefined,
      searchText: undefined,
      selectedRow: {},
      selectedRows: [],
      // The following meta property is used for rendering the table.
      filteredTableData: undefined,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      searchText: "defaultSearchText",
      selectedRowIndex: "defaultSelectedRow",
      selectedRowIndices: "defaultSelectedRow",
    };
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onRowSelected: true,
      onPageChange: true,
      onSearchTextChanged: true,
      columnActions: true,
    };
  }

  getPropertyValue = (value: any, index: number) => {
    if (value && Array.isArray(value) && value[index]) {
      return value[index].toString().toUpperCase();
    } else if (value) {
      return value.toString().toUpperCase();
    } else {
      return value;
    }
  };

  getCellProperties = (
    columnProperties: ColumnProperties,
    rowIndex: number,
  ) => {
    const cellProperties: CellLayoutProperties = {
      horizontalAlignment: this.getPropertyValue(
        columnProperties.horizontalAlignment,
        rowIndex,
      ),
      verticalAlignment: this.getPropertyValue(
        columnProperties.verticalAlignment,
        rowIndex,
      ),
      cellBackground: this.getPropertyValue(
        columnProperties.cellBackground,
        rowIndex,
      ),
      buttonStyle: this.getPropertyValue(
        columnProperties.buttonStyle,
        rowIndex,
      ),
      buttonLabelColor: this.getPropertyValue(
        columnProperties.buttonLabelColor,
        rowIndex,
      ),
      buttonLabel: this.getPropertyValue(
        columnProperties.buttonLabel,
        rowIndex,
      ),
      textSize: this.getPropertyValue(columnProperties.textSize, rowIndex),
      textColor: this.getPropertyValue(columnProperties.textColor, rowIndex),
      fontStyle: this.getPropertyValue(columnProperties.fontStyle, rowIndex), //Fix this
    };
    return cellProperties;
  };

  getTableColumns = () => {
    let columns: ReactTableColumnProps[] = [];
    const hiddenColumns: ReactTableColumnProps[] = [];
    const {
      primaryColumns,
      sortedColumn,
      columnOrder,
      columnSizeMap,
    } = this.props;
    let allColumns = [...(primaryColumns || [])];
    const sortColumn = sortedColumn?.column;
    const sortOrder = sortedColumn?.asc;
    if (columnOrder) {
      allColumns = reorderColumns(allColumns, columnOrder);
    }
    for (let index = 0; index < allColumns.length; index++) {
      const columnProperties = allColumns[index];
      const isHidden = !columnProperties.isVisible;
      const accessor = columnProperties.id;
      const columnData = {
        Header: columnProperties.label,
        accessor: accessor,
        width: columnSizeMap?.[accessor] || columnProperties.width,
        minWidth: 60,
        draggable: true,
        isHidden: false,
        isAscOrder: columnProperties.id === sortColumn ? sortOrder : undefined,
        isDerived: columnProperties.isDerived,
        metaProperties: {
          isHidden: isHidden,
          type: columnProperties.columnType,
          format: columnProperties?.outputFormat || "",
          inputFormat: columnProperties?.inputFormat || "",
        },
        columnProperties: JSON.stringify(columnProperties),
        Cell: (props: any) => {
          const rowIndex: number = props.cell.row.index;
          const cellProperties = this.getCellProperties(
            columnProperties,
            rowIndex,
          );
          if (columnProperties.columnType === "button") {
            const buttonProps = {
              isSelected: !!props.row.isSelected,
              onCommandClick: (action: string, onComplete: () => void) =>
                this.onCommandClick(rowIndex, action, onComplete),
              backgroundColor: cellProperties.buttonStyle || "#29CCA3",
              buttonLabelColor: cellProperties.buttonLabelColor || "#FFFFFF",
              columnActions: [
                {
                  id: columnProperties.id,
                  label: cellProperties.buttonLabel || "Action",
                  dynamicTrigger: columnProperties.onClick || "",
                },
              ],
            };
            return renderActions(buttonProps, isHidden);
          } else if (columnProperties.columnType === "dropdown") {
            let options = [];
            try {
              options = JSON.parse(columnProperties.dropdownOptions || "");
            } catch (e) {}
            return renderDropdown({
              options: options,
              onItemSelect: this.onItemSelect,
              onOptionChange: columnProperties.onOptionChange || "",
              selectedIndex: isNumber(props.cell.value)
                ? props.cell.value
                : undefined,
            });
          } else {
            return renderCell(
              props.cell.value,
              columnProperties.columnType,
              isHidden,
              cellProperties,
            );
          }
        },
      };
      if (isHidden) {
        columnData.isHidden = true;
        hiddenColumns.push(columnData);
      } else {
        columns.push(columnData);
      }
    }
    if (hiddenColumns.length && this.props.renderMode === RenderModes.CANVAS) {
      columns = columns.concat(hiddenColumns);
    }
    return columns.filter((column: ReactTableColumnProps) => column.accessor);
  };

  transformData = (
    tableData: Array<Record<string, unknown>>,
    columns: ReactTableColumnProps[],
  ) => {
    const updatedTableData = [];
    for (let row = 0; row < tableData.length; row++) {
      const data: { [key: string]: any } = tableData[row];
      const tableRow: { [key: string]: any } = {};
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const column = columns[colIndex];
        const { accessor } = column;
        let value = data[accessor];
        if (column.metaProperties) {
          const type = column.metaProperties.type;
          const format = column.metaProperties.format;
          switch (type) {
            case ColumnTypes.CURRENCY:
              if (!isNaN(value)) {
                tableRow[accessor] = `${format}${value ? value : ""}`;
              } else {
                tableRow[accessor] = "Invalid Value";
              }
              break;
            case ColumnTypes.DATE:
              let isValidDate = true;
              let outputFormat = column.metaProperties.format;
              let inputFormat;
              try {
                const type = column.metaProperties.inputFormat;
                if (type !== "EPOCH" && type !== "Milliseconds") {
                  inputFormat = type;
                  moment(value, inputFormat);
                } else if (!isNumber(value)) {
                  isValidDate = false;
                }
              } catch (e) {
                isValidDate = false;
              }
              if (isValidDate) {
                if (outputFormat === "SAME_AS_INPUT") {
                  outputFormat = inputFormat;
                }
                if (column.metaProperties.inputFormat === "Milliseconds") {
                  value = 1000 * Number(value);
                }
                tableRow[accessor] = moment(value, inputFormat).format(
                  outputFormat,
                );
              } else if (value) {
                tableRow[accessor] = "Invalid Value";
              } else {
                tableRow[accessor] = "";
              }
              break;
            case ColumnTypes.TIME:
              let isValidTime = true;
              if (isNaN(value)) {
                const time = Date.parse(value);
                if (isNaN(time)) {
                  isValidTime = false;
                }
              }
              if (isValidTime) {
                tableRow[accessor] = moment(value).format("HH:mm");
              } else if (value) {
                tableRow[accessor] = "Invalid Value";
              } else {
                tableRow[accessor] = "";
              }
              break;
            default:
              const data =
                isString(value) || isNumber(value)
                  ? value
                  : isUndefined(value)
                  ? ""
                  : JSON.stringify(value);
              tableRow[accessor] = data;
              break;
          }
        }
      }
      updatedTableData.push(tableRow);
    }
    return updatedTableData;
  };

  filterTableData = () => {
    const { searchText, sortedColumn, filters, tableData } = this.props;
    if (!tableData || !tableData.length) {
      return [];
    }
    const derivedTableData: Array<Record<string, unknown>> = [...tableData];
    if (this.props.primaryColumns) {
      for (let i = 0; i < this.props.primaryColumns.length; i++) {
        const column: ColumnProperties = this.props.primaryColumns[i];
        const columnId = column.id;
        if (column.computedValue && Array.isArray(column.computedValue)) {
          try {
            let computedValues: Array<unknown> = [];
            if (isString(column.computedValue)) {
              computedValues = JSON.parse(column.computedValue);
            } else {
              computedValues = column.computedValue;
            }
            for (let index = 0; index < computedValues.length; index++) {
              derivedTableData[index] = {
                ...derivedTableData[index],
                [columnId]: computedValues[index],
              };
            }
          } catch (e) {
            console.log({ e });
          }
        }
      }
    }
    let sortedTableData: any[];
    const columns = this.getTableColumns();
    const searchKey = searchText ? searchText.toUpperCase() : "";
    if (sortedColumn) {
      const sortColumn = sortedColumn.column;
      const sortOrder = sortedColumn.asc;
      sortedTableData = sortTableFunction(
        derivedTableData,
        columns,
        sortColumn,
        sortOrder,
      );
    } else {
      sortedTableData = [...derivedTableData];
    }
    return sortedTableData.filter((item: { [key: string]: any }) => {
      const searchFound = searchKey
        ? Object.values(item)
            .join(", ")
            .toUpperCase()
            .includes(searchKey)
        : true;
      if (!searchFound) return false;
      if (!filters || filters.length === 0) return true;
      const filterOperator: Operator =
        filters.length >= 2 ? filters[1].operator : OperatorTypes.OR;
      let filter = filterOperator === OperatorTypes.AND;
      for (let i = 0; i < filters.length; i++) {
        const filterValue = compare(
          item[filters[i].column],
          filters[i].value,
          filters[i].condition,
        );
        if (filterOperator === OperatorTypes.AND) {
          filter = filter && filterValue;
        } else {
          filter = filter || filterValue;
        }
      }
      return filter;
    });
  };

  getEmptyRow = () => {
    const columnKeys: string[] = getAllTableColumnKeys(this.props.tableData);
    const selectedRow: { [key: string]: any } = {};
    for (let i = 0; i < columnKeys.length; i++) {
      selectedRow[columnKeys[i]] = undefined;
    }
    return selectedRow;
  };

  getSelectedRow = (
    filteredTableData: Array<Record<string, unknown>>,
    selectedRowIndex?: number,
  ) => {
    if (selectedRowIndex === undefined || selectedRowIndex === -1) {
      return this.getEmptyRow();
    }
    return filteredTableData[selectedRowIndex];
  };

  createTablePrimaryColumns = () => {
    const { tableData } = this.props;
    if (tableData) {
      const tableColumns: ColumnProperties[] = [];
      const columnKeys: string[] = getAllTableColumnKeys(tableData);
      for (let index = 0; index < columnKeys.length; index++) {
        const i = columnKeys[index];
        tableColumns.push(
          getDefaultColumnProperties(i, index, this.props.widgetName),
        );
      }
      super.updateWidgetProperty("primaryColumns", tableColumns);
    }
  };
  getSelectedRows = (
    filteredTableData: Array<Record<string, unknown>>,
    selectedRowIndices: Array<number>,
  ) => {
    return filteredTableData.filter(
      (item: Record<string, unknown>, i: number) => {
        return selectedRowIndices.includes(i);
      },
    );
  };

  componentDidMount() {
    const filteredTableData = this.filterTableData();
    const selectedRow = this.getSelectedRow(
      filteredTableData,
      this.props.selectedRowIndex,
    );
    this.props.updateWidgetMetaProperty("filteredTableData", filteredTableData);
    this.props.updateWidgetMetaProperty("selectedRow", selectedRow);
    setTimeout(() => {
      if (
        !this.props.primaryColumns ||
        this.props.primaryColumns.length === 0
      ) {
        this.createTablePrimaryColumns();
      }
    }, 0);
  }

  componentDidUpdate(prevProps: TableWidgetProps) {
    const tableDataModified =
      JSON.stringify(this.props.tableData) !==
      JSON.stringify(prevProps.tableData);
    if (
      tableDataModified ||
      JSON.stringify(this.props.filters) !==
        JSON.stringify(prevProps.filters) ||
      this.props.searchText !== prevProps.searchText ||
      JSON.stringify(this.props.sortedColumn) !==
        JSON.stringify(prevProps.sortedColumn) ||
      !this.props.filteredTableData
    ) {
      const filteredTableData = this.filterTableData();
      this.props.updateWidgetMetaProperty(
        "filteredTableData",
        filteredTableData,
      );
      if (!this.props.multiRowSelection) {
        const selectedRowIndex =
          this.props.selectedRowIndex !== -1 &&
          this.props.selectedRowIndex !== undefined &&
          filteredTableData[this.props.selectedRowIndex]
            ? this.props.selectedRowIndex
            : isNumber(this.props.defaultSelectedRow)
            ? this.props.defaultSelectedRow
            : -1;
        this.props.updateWidgetMetaProperty(
          "selectedRowIndex",
          selectedRowIndex,
        );
        this.props.updateWidgetMetaProperty(
          "selectedRow",
          this.getSelectedRow(filteredTableData, selectedRowIndex),
        );
      } else {
        const selectedRowIndices = this.props.selectedRowIndices.length
          ? this.props.selectedRowIndices
          : Array.isArray(this.props.defaultSelectedRow)
          ? this.props.defaultSelectedRow
          : [];
        this.props.updateWidgetMetaProperty(
          "selectedRowIndices",
          selectedRowIndices,
        );
        this.props.updateWidgetMetaProperty(
          "selectedRows",
          this.getSelectedRows(filteredTableData, selectedRowIndices),
        );
      }
    }
    // console.log(
    //   "Table Data:",
    //   { tableDataModified },
    //   this.props.primaryColumns,
    //   this.props.filteredTableData,
    // );
    if (tableDataModified) {
      const columnKeys: string[] = getAllTableColumnKeys(
        this.props.tableData,
      ).sort((a: string, b: string) => {
        return a > b ? 1 : a < b ? -1 : 0;
      });
      const primaryColumnKeys = (this.props.columns || [])
        .filter((column: ColumnProperties) => {
          return !column.isDerived;
        })
        .map((column: ColumnProperties) => {
          return column.id;
        })
        .sort((a: string, b: string) => {
          return a > b ? 1 : a < b ? -1 : 0;
        });
      if (JSON.stringify(columnKeys) !== JSON.stringify(primaryColumnKeys)) {
        this.createTablePrimaryColumns();
      }
    }
    if (
      JSON.stringify(this.props.primaryColumns) !==
      JSON.stringify(prevProps.primaryColumns)
    ) {
      const filteredTableData = this.filterTableData();
      this.props.updateWidgetMetaProperty(
        "filteredTableData",
        filteredTableData,
      );
      if (!this.props.multiRowSelection) {
        this.props.updateWidgetMetaProperty(
          "selectedRow",
          this.getSelectedRow(filteredTableData),
        );
      } else {
        this.props.updateWidgetMetaProperty(
          "selectedRows",
          filteredTableData.filter(
            (item: Record<string, unknown>, i: number) => {
              return this.props.selectedRowIndices.includes(i);
            },
          ),
        );
      }
    }
    if (this.props.multiRowSelection !== prevProps.multiRowSelection) {
      if (this.props.multiRowSelection) {
        const selectedRowIndices = this.props.selectedRowIndex
          ? [this.props.selectedRowIndex]
          : [];
        this.props.updateWidgetMetaProperty(
          "selectedRowIndices",
          selectedRowIndices,
        );
        this.props.updateWidgetMetaProperty("selectedRowIndex", -1);
        const filteredTableData = this.filterTableData();
        this.props.updateWidgetMetaProperty(
          "selectedRows",
          this.getSelectedRows(filteredTableData, selectedRowIndices),
        );
        this.props.updateWidgetMetaProperty(
          "selectedRow",
          this.getSelectedRow(filteredTableData),
        );
      } else {
        const filteredTableData = this.filterTableData();
        this.props.updateWidgetMetaProperty("selectedRowIndices", []);
        this.props.updateWidgetMetaProperty("selectedRows", []);
        this.props.updateWidgetMetaProperty(
          "selectedRow",
          this.getSelectedRow(filteredTableData),
        );
      }
    }
    if (!isEqual(this.props.defaultSelectedRow, prevProps.defaultSelectedRow)) {
      //Runs only when defaultSelectedRow is changed from property pane
      if (!this.props.multiRowSelection) {
        const selectedRowIndex = isNumber(this.props.defaultSelectedRow)
          ? this.props.defaultSelectedRow
          : -1;
        this.props.updateWidgetMetaProperty(
          "selectedRowIndex",
          selectedRowIndex,
        );
        this.props.updateWidgetMetaProperty(
          "selectedRow",
          this.getSelectedRow(this.props.filteredTableData, selectedRowIndex),
        );
      } else {
        const selectedRowIndices = Array.isArray(this.props.defaultSelectedRow)
          ? this.props.defaultSelectedRow
          : [];
        this.props.updateWidgetMetaProperty(
          "selectedRowIndices",
          selectedRowIndices,
        );
        this.props.updateWidgetMetaProperty(
          "selectedRows",
          this.getSelectedRows(
            this.props.filteredTableData,
            selectedRowIndices,
          ),
        );
      }
    }
  }

  getSelectedRowIndexes = (selectedRowIndices: string) => {
    return selectedRowIndices
      ? selectedRowIndices.split(",").map(i => Number(i))
      : [];
  };

  getPageView() {
    const { hiddenColumns, filteredTableData } = this.props;
    const computedSelectedRowIndices = Array.isArray(
      this.props.selectedRowIndices,
    )
      ? this.props.selectedRowIndices
      : [];
    const tableColumns = this.getTableColumns();

    const transformedData = this.transformData(
      filteredTableData || [],
      tableColumns,
    );
    const serverSidePaginationEnabled = (this.props
      .serverSidePaginationEnabled &&
      this.props.serverSidePaginationEnabled) as boolean;
    let pageNo = this.props.pageNo;

    if (pageNo === undefined) {
      pageNo = 1;
      this.props.updateWidgetMetaProperty("pageNo", pageNo);
    }
    const { componentWidth, componentHeight } = this.getComponentDimensions();
    const tableSizes =
      TABLE_SIZES[this.props.compactMode || CompactModeTypes.DEFAULT];
    let pageSize = Math.floor(
      (componentHeight -
        tableSizes.TABLE_HEADER_HEIGHT -
        tableSizes.COLUMN_HEADER_HEIGHT) /
        tableSizes.ROW_HEIGHT,
    );
    if (
      componentHeight -
        (tableSizes.TABLE_HEADER_HEIGHT +
          tableSizes.COLUMN_HEADER_HEIGHT +
          tableSizes.ROW_HEIGHT * pageSize) >
      0
    )
      pageSize += 1;

    if (pageSize !== this.props.pageSize) {
      this.props.updateWidgetMetaProperty("pageSize", pageSize);
    }
    return (
      <Suspense fallback={<Skeleton />}>
        <ReactTableComponent
          height={componentHeight}
          width={componentWidth}
          tableData={transformedData}
          columns={tableColumns}
          isLoading={this.props.isLoading}
          widgetId={this.props.widgetId}
          widgetName={this.props.widgetName}
          searchKey={this.props.searchText}
          editMode={this.props.renderMode === RenderModes.CANVAS}
          hiddenColumns={hiddenColumns}
          columnOrder={this.props.columnOrder}
          columnSizeMap={this.props.columnSizeMap}
          pageSize={pageSize}
          onCommandClick={this.onCommandClick}
          selectedRowIndex={
            this.props.selectedRowIndex === undefined
              ? -1
              : this.props.selectedRowIndex
          }
          multiRowSelection={this.props.multiRowSelection}
          selectedRowIndices={computedSelectedRowIndices}
          serverSidePaginationEnabled={serverSidePaginationEnabled}
          onRowClick={this.handleRowClick}
          pageNo={pageNo}
          nextPageClick={this.handleNextPageClick}
          prevPageClick={this.handlePrevPageClick}
          updateColumnSize={(columnSizeMap: { [key: string]: number }) => {
            super.updateWidgetProperty("columnSizeMap", columnSizeMap);
          }}
          updatePageNo={this.updatePageNumber}
          updateHiddenColumns={(hiddenColumns?: string[]) => {
            super.updateWidgetProperty("hiddenColumns", hiddenColumns);
          }}
          handleReorderColumn={(columnOrder: string[]) => {
            super.updateWidgetProperty("columnOrder", columnOrder);
          }}
          disableDrag={(disable: boolean) => {
            this.disableDrag(disable);
          }}
          searchTableData={this.handleSearchTable}
          filters={this.props.filters}
          applyFilter={(filters: ReactTableFilter[]) => {
            this.resetSelectedRowIndex();
            this.props.updateWidgetMetaProperty("filters", filters);
          }}
          compactMode={this.props.compactMode || CompactModeTypes.DEFAULT}
          updateCompactMode={(compactMode: CompactMode) => {
            if (this.props.renderMode === RenderModes.CANVAS) {
              this.props.updateWidgetMetaProperty("compactMode", compactMode);
            } else {
              this.props.updateWidgetMetaProperty("compactMode", compactMode);
            }
          }}
          sortTableColumn={this.handleColumnSorting}
        />
      </Suspense>
    );
  }

  handleColumnSorting = (column: string, asc: boolean) => {
    this.resetSelectedRowIndex();
    if (column === "") {
      this.props.updateWidgetMetaProperty("sortedColumn", undefined);
    } else {
      this.props.updateWidgetMetaProperty("sortedColumn", {
        column: column,
        asc: asc,
      });
    }
  };

  handleSearchTable = (searchKey: any) => {
    const { onSearchTextChanged } = this.props;
    this.resetSelectedRowIndex();
    this.props.updateWidgetMetaProperty("pageNo", 1);
    this.props.updateWidgetMetaProperty("searchText", searchKey, {
      dynamicString: onSearchTextChanged,
      event: {
        type: EventType.ON_SEARCH,
      },
    });
  };

  updateHiddenColumns = (hiddenColumns?: string[]) => {
    super.updateWidgetProperty("hiddenColumns", hiddenColumns);
  };

  onCommandClick = (
    rowIndex: number,
    action: string,
    onComplete: () => void,
  ) => {
    try {
      const rowData = [this.props.filteredTableData[rowIndex]];
      const { jsSnippets } = getDynamicBindings(action);
      const modifiedAction = jsSnippets.reduce((prev: string, next: string) => {
        return prev + `{{(currentRow) => { ${next} }}} `;
      }, "");
      super.executeAction({
        dynamicString: modifiedAction,
        event: {
          type: EventType.ON_CLICK,
          callback: onComplete,
        },
        responseData: rowData,
      });
    } catch (error) {
      log.debug("Error parsing row action", error);
    }
  };

  onItemSelect = (action: string) => {
    super.executeAction({
      dynamicString: action,
      event: {
        type: EventType.ON_OPTION_CHANGE,
      },
    });
  };

  handleRowClick = (rowData: Record<string, unknown>, index: number) => {
    const { selectedRowIndices } = this.props;
    if (this.props.multiRowSelection) {
      if (selectedRowIndices.includes(index)) {
        const rowIndex = selectedRowIndices.indexOf(index);
        selectedRowIndices.splice(rowIndex, 1);
      } else {
        selectedRowIndices.push(index);
      }
      this.props.updateWidgetMetaProperty(
        "selectedRowIndices",
        selectedRowIndices,
      );
      this.props.updateWidgetMetaProperty(
        "selectedRows",
        this.props.filteredTableData.filter(
          (item: Record<string, unknown>, i: number) => {
            return selectedRowIndices.includes(i);
          },
        ),
      );
    } else {
      this.props.updateWidgetMetaProperty("selectedRowIndex", index);
      this.props.updateWidgetMetaProperty(
        "selectedRow",
        this.props.filteredTableData[index],
        {
          dynamicString: this.props.onRowSelected,
          event: {
            type: EventType.ON_ROW_SELECTED,
          },
        },
      );
    }
  };

  updatePageNumber = (pageNo: number, event?: EventType) => {
    if (event) {
      this.props.updateWidgetMetaProperty("pageNo", pageNo, {
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
    let pageNo = this.props.pageNo || 1;
    pageNo = pageNo + 1;
    this.props.updateWidgetMetaProperty("pageNo", pageNo, {
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
    if (!this.props.multiRowSelection) {
      const selectedRowIndex = isNumber(this.props.defaultSelectedRow)
        ? this.props.defaultSelectedRow
        : -1;
      this.props.updateWidgetMetaProperty("selectedRowIndex", selectedRowIndex);
      this.props.updateWidgetMetaProperty(
        "selectedRow",
        this.getSelectedRow(this.props.filteredTableData, selectedRowIndex),
      );
    } else {
      const selectedRowIndices = Array.isArray(this.props.defaultSelectedRow)
        ? this.props.defaultSelectedRow
        : [];
      this.props.updateWidgetMetaProperty(
        "selectedRowIndices",
        selectedRowIndices,
      );
      this.props.updateWidgetMetaProperty(
        "selectedRows",
        this.getSelectedRows(this.props.filteredTableData, selectedRowIndices),
      );
    }
  };

  handlePrevPageClick = () => {
    let pageNo = this.props.pageNo || 1;
    pageNo = pageNo - 1;
    if (pageNo >= 1) {
      this.props.updateWidgetMetaProperty("pageNo", pageNo, {
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

  getWidgetType(): WidgetType {
    return "TABLE_WIDGET";
  }
}

export default TableWidget;
export const ProfiledTableWidget = Sentry.withProfiler(withMeta(TableWidget));
