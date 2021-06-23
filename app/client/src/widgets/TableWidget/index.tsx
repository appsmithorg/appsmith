import React, { lazy, Suspense } from "react";
import BaseWidget, { WidgetState } from "../BaseWidget";
import { RenderModes, WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  getDefaultColumnProperties,
  getTableStyles,
  renderCell,
  renderDropdown,
  renderActions,
} from "components/designSystems/appsmith/TableComponent/TableUtilities";
import { getAllTableColumnKeys } from "components/designSystems/appsmith/TableComponent/TableHelpers";
import Skeleton from "components/utils/Skeleton";
import moment from "moment";
import { isNumber, isString, isNil, isEqual, xor, without } from "lodash";
import * as Sentry from "@sentry/react";
import { retryPromise } from "utils/AppsmithUtils";
import withMeta from "../MetaHOC";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import log from "loglevel";
import { ReactTableFilter } from "components/designSystems/appsmith/TableComponent/TableFilters";
import { TableWidgetProps } from "./TableWidgetConstants";
import derivedProperties from "./parseDerivedProperties";

import {
  ColumnProperties,
  CellLayoutProperties,
  ReactTableColumnProps,
  ColumnTypes,
  CompactModeTypes,
  CompactMode,
} from "components/designSystems/appsmith/TableComponent/Constants";
import tablePropertyPaneConfig from "./TablePropertyPaneConfig";
import { BatchPropertyUpdatePayload } from "actions/controlActions";

const ReactTableComponent = lazy(() =>
  retryPromise(() =>
    import("components/designSystems/appsmith/TableComponent"),
  ),
);

class TableWidget extends BaseWidget<TableWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return tablePropertyPaneConfig;
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      pageNo: 1,
      selectedRowIndex: undefined,
      selectedRowIndices: undefined,
      searchText: undefined,
      // The following meta property is used for rendering the table.
      filters: [],
    };
  }

  static getDerivedPropertiesMap() {
    return {
      selectedRow: `{{(()=>{${derivedProperties.getSelectedRow}})()}}`,
      selectedRows: `{{(()=>{${derivedProperties.getSelectedRows}})()}}`,
      pageSize: `{{(()=>{${derivedProperties.getPageSize}})()}}`,
      triggerRowSelection: "{{!!this.onRowSelected}}",
      sanitizedTableData: `{{(()=>{${derivedProperties.getSanitizedTableData}})()}}`,
      tableColumns: `{{(()=>{${derivedProperties.getTableColumns}})()}}`,
      filteredTableData: `{{(()=>{ ${derivedProperties.getFilteredTableData}})()}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      searchText: "defaultSearchText",
      selectedRowIndex: "defaultSelectedRow",
      selectedRowIndices: "defaultSelectedRow",
    };
  }

  getPropertyValue = (value: any, index: number, preserveCase = false) => {
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
        true,
      ),
      textSize: this.getPropertyValue(columnProperties.textSize, rowIndex),
      textColor: this.getPropertyValue(columnProperties.textColor, rowIndex),
      fontStyle: this.getPropertyValue(columnProperties.fontStyle, rowIndex), //Fix this
      displayText: this.getPropertyValue(
        columnProperties.displayText,
        rowIndex,
        true,
      ),
    };
    return cellProperties;
  };

  getTableColumns = () => {
    let columns: ReactTableColumnProps[] = [];
    const hiddenColumns: ReactTableColumnProps[] = [];
    const { columnSizeMap } = this.props;
    const { componentWidth } = this.getComponentDimensions();

    let totalColumnSizes = 0;
    const defaultColumnWidth = 150;
    const allColumnProperties = this.props.tableColumns || [];

    for (let index = 0; index < allColumnProperties.length; index++) {
      const columnProperties = allColumnProperties[index];
      const isHidden = !columnProperties.isVisible;
      const accessor = columnProperties.id;
      const columnData = {
        Header: columnProperties.label,
        accessor: accessor,
        width:
          columnSizeMap && columnSizeMap[accessor]
            ? columnSizeMap[accessor]
            : defaultColumnWidth,
        minWidth: 60,
        draggable: true,
        isHidden: false,
        isAscOrder: columnProperties.isAscOrder,
        isDerived: columnProperties.isDerived,
        metaProperties: {
          isHidden: isHidden,
          type: columnProperties.columnType,
          format: columnProperties?.outputFormat || "",
          inputFormat: columnProperties?.inputFormat || "",
        },
        columnProperties: columnProperties,
        Cell: (props: any) => {
          let rowIndex: number = props.cell.row.index;
          const data = this.props.filteredTableData[rowIndex];
          if (data && data.__originalIndex__) rowIndex = data.__originalIndex__;

          const cellProperties = this.getCellProperties(
            columnProperties,
            rowIndex,
          );
          if (columnProperties.columnType === "button") {
            const buttonProps = {
              isSelected: !!props.row.isSelected,
              onCommandClick: (action: string, onComplete: () => void) =>
                this.onCommandClick(rowIndex, action, onComplete),
              backgroundColor: cellProperties.buttonStyle || "rgb(3, 179, 101)",
              buttonLabelColor: cellProperties.buttonLabelColor || "#FFFFFF",
              columnActions: [
                {
                  id: columnProperties.id,
                  label: cellProperties.buttonLabel || "Action",
                  dynamicTrigger: columnProperties.onClick || "",
                },
              ],
            };
            return renderActions(buttonProps, isHidden, cellProperties);
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
              componentWidth,
            );
          }
        },
      };
      if (isHidden) {
        columnData.isHidden = true;
        hiddenColumns.push(columnData);
      } else {
        totalColumnSizes += columnData.width;
        columns.push(columnData);
      }
    }
    if (totalColumnSizes < componentWidth) {
      const lastColumnIndex = columns.length - 1;
      let remainingColumnsSize = 0;
      for (let i = 0; i < columns.length - 1; i++) {
        remainingColumnsSize += columns[i].width || defaultColumnWidth;
      }
      if (columns[lastColumnIndex]) {
        columns[lastColumnIndex].width =
          componentWidth - remainingColumnsSize < defaultColumnWidth
            ? defaultColumnWidth
            : componentWidth - remainingColumnsSize; //Min remaining width to be defaultColumnWidth
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
    // For each row in the tableData (filteredTableData)
    for (let row = 0; row < tableData.length; row++) {
      // Get the row object
      const data: { [key: string]: any } = tableData[row];
      if (data) {
        const tableRow: { [key: string]: any } = {};
        // For each column in the expected columns of the table
        for (let colIndex = 0; colIndex < columns.length; colIndex++) {
          // Get the column properties
          const column = columns[colIndex];
          const { accessor } = column;
          let value = data[accessor];
          if (column.metaProperties) {
            const type = column.metaProperties.type;
            switch (type) {
              case ColumnTypes.DATE:
                let isValidDate = true;
                let outputFormat = Array.isArray(column.metaProperties.format)
                  ? column.metaProperties.format[row]
                  : column.metaProperties.format;
                let inputFormat;
                try {
                  const type = Array.isArray(column.metaProperties.inputFormat)
                    ? column.metaProperties.inputFormat[row]
                    : column.metaProperties.inputFormat;
                  if (type !== "Epoch" && type !== "Milliseconds") {
                    inputFormat = type;
                    moment(value, inputFormat);
                  } else if (!isNumber(value)) {
                    isValidDate = false;
                  }
                } catch (e) {
                  isValidDate = false;
                }
                if (isValidDate) {
                  try {
                    if (outputFormat === "SAME_AS_INPUT") {
                      outputFormat = inputFormat;
                    }
                    if (column.metaProperties.inputFormat === "Milliseconds") {
                      value = Number(value);
                    } else if (column.metaProperties.inputFormat === "Epoch") {
                      value = 1000 * Number(value);
                    }
                    tableRow[accessor] = moment(value, inputFormat).format(
                      outputFormat,
                    );
                  } catch (e) {
                    log.debug("Unable to parse Date:", { e });
                    tableRow[accessor] = "";
                  }
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
                    : isNil(value)
                    ? ""
                    : JSON.stringify(value);
                tableRow[accessor] = data;
                break;
            }
          }
        }

        updatedTableData.push(tableRow);
      }
    }

    return updatedTableData;
  };

  getParsedComputedValues = (value: string | Array<unknown>) => {
    let computedValues: Array<unknown> = [];
    if (isString(value)) {
      try {
        computedValues = JSON.parse(value);
      } catch (e) {
        log.debug("Error parsing column value: ", value);
      }
    } else if (Array.isArray(value)) {
      computedValues = value;
    } else {
      log.debug("Error parsing column values:", value);
    }
    return computedValues;
  };

  getEmptyRow = () => {
    const columnKeys: string[] = getAllTableColumnKeys(
      this.props.sanitizedTableData,
    );
    const selectedRow: { [key: string]: any } = {};
    for (let i = 0; i < columnKeys.length; i++) {
      selectedRow[columnKeys[i]] = "";
    }
    return selectedRow;
  };

  getDerivedColumns = (
    derivedColumns: Record<string, ColumnProperties>,
    tableColumnCount: number,
  ) => {
    if (!derivedColumns) return [];
    //update index property of all columns in new derived columns
    return (
      Object.keys(derivedColumns)?.map((columnId: string, index: number) => {
        return {
          ...derivedColumns[columnId],
          index: index + tableColumnCount,
        };
      }) || []
    );
  };

  createTablePrimaryColumns = ():
    | Record<string, ColumnProperties>
    | undefined => {
    const {
      sanitizedTableData = [],
      primaryColumns = {},
      columnNameMap = {},
      columnTypeMap = {},
      derivedColumns = {},
      hiddenColumns = [],
      migrated,
    } = this.props;
    // Bail out if the data doesn't exist.
    // This is a temporary measure,
    // to solve for the scenario where the column properties are getting reset
    // Repurcussion: The primary columns control will never go into the "no data" state.
    if (isString(sanitizedTableData) || sanitizedTableData.length === 0) return;

    const previousColumnIds = Object.keys(primaryColumns);
    const tableColumns: Record<string, ColumnProperties> = {};
    //Get table level styles
    const tableStyles = getTableStyles(this.props);
    const columnKeys: string[] = getAllTableColumnKeys(sanitizedTableData);
    // Generate default column properties for all columns
    // But donot replace existing columns with the same id
    for (let index = 0; index < columnKeys.length; index++) {
      const i = columnKeys[index];
      const prevIndex = previousColumnIds.indexOf(i);
      if (prevIndex > -1) {
        // we found an existing property with the same column id use the previous properties
        tableColumns[i] = primaryColumns[i];
      } else {
        const columnProperties = getDefaultColumnProperties(
          i,
          index,
          this.props.widgetName,
        );
        if (migrated === false) {
          // Update column names using the names from the table before migration
          if ((columnNameMap as Record<string, string>)[i]) {
            columnProperties.label = columnNameMap[i];
          }
          // Update column types using types from the table before migration
          if (
            (columnTypeMap as Record<
              string,
              { type: ColumnTypes; inputFormat?: string; format?: string }
            >)[i]
          ) {
            columnProperties.columnType = columnTypeMap[i].type;
            columnProperties.inputFormat = columnTypeMap[i].inputFormat;
            columnProperties.outputFormat = columnTypeMap[i].format;
          }
          // Hide columns which were hidden in the table before migration
          if (hiddenColumns.indexOf(i) > -1) {
            columnProperties.isVisible = false;
          }
        }
        //add column properties along with table level styles
        tableColumns[columnProperties.id] = {
          ...columnProperties,
          ...tableStyles,
        };
      }
    }
    // Get derived columns
    const updatedDerivedColumns = this.getDerivedColumns(
      derivedColumns,
      Object.keys(tableColumns).length,
    );

    //add derived columns to primary columns
    updatedDerivedColumns.forEach((derivedColumn: ColumnProperties) => {
      tableColumns[derivedColumn.id] = derivedColumn;
    });

    const newColumnIds = Object.keys(tableColumns);

    if (xor(previousColumnIds, newColumnIds).length > 0) return tableColumns;
    else return;
  };

  updateColumnProperties = (
    tableColumns?: Record<string, ColumnProperties>,
  ) => {
    const { primaryColumns = {} } = this.props;
    const { columnOrder, migrated } = this.props;
    if (tableColumns) {
      const previousColumnIds = Object.keys(primaryColumns);
      const newColumnIds = Object.keys(tableColumns);

      if (xor(previousColumnIds, newColumnIds).length > 0) {
        const columnIdsToAdd = without(newColumnIds, ...previousColumnIds);

        const propertiesToAdd: Record<string, unknown> = {};
        columnIdsToAdd.forEach((id: string) => {
          Object.entries(tableColumns[id]).forEach(([key, value]) => {
            propertiesToAdd[`primaryColumns.${id}.${key}`] = value;
          });
        });

        // If new columnOrders have different values from the original columnOrders
        if (xor(newColumnIds, columnOrder).length > 0) {
          propertiesToAdd["columnOrder"] = newColumnIds;
        }

        const pathsToDelete: string[] = [];
        if (migrated === false) {
          propertiesToAdd["migrated"] = true;
        }
        const propertiesToUpdate: BatchPropertyUpdatePayload = {
          modify: propertiesToAdd,
        };

        const columnsIdsToDelete = without(previousColumnIds, ...newColumnIds);
        if (columnsIdsToDelete.length > 0) {
          columnsIdsToDelete.forEach((id: string) => {
            pathsToDelete.push(`primaryColumns.${id}`);
          });
          propertiesToUpdate.remove = pathsToDelete;
        }

        super.batchUpdateWidgetProperty(propertiesToUpdate);
      }
    }
  };

  componentDidMount() {
    const { sanitizedTableData } = this.props;
    let newPrimaryColumns;
    // When we have tableData, the primaryColumns order is unlikely to change
    // When we don't have tableData primaryColumns will not be available, so let's let it be.

    if (Array.isArray(sanitizedTableData) && sanitizedTableData.length > 0) {
      newPrimaryColumns = this.createTablePrimaryColumns();
      if (newPrimaryColumns) this.updateColumnProperties(newPrimaryColumns);
    }
  }

  componentDidUpdate(prevProps: TableWidgetProps) {
    const { primaryColumns = {} } = this.props;

    // Bail out if santizedTableData is a string. This signifies an error in evaluations
    // Since, it is an error in evaluations, we should not attempt to process the data
    if (isString(this.props.sanitizedTableData)) return;

    // Check if data is modifed by comparing the stringified versions of the previous and next tableData
    const tableDataModified =
      JSON.stringify(this.props.sanitizedTableData) !==
      JSON.stringify(prevProps.sanitizedTableData);

    if (tableDataModified) {
      this.updateSelectedRowIndex();
    }

    // If the user has changed the tableData OR
    // The binding has returned a new value
    if (tableDataModified && this.props.renderMode === RenderModes.CANVAS) {
      // Get columns keys from this.props.tableData
      const columnIds: string[] = getAllTableColumnKeys(this.props.tableData);
      // Get column keys from columns except for derivedColumns
      const primaryColumnIds = Object.keys(primaryColumns).filter(
        (id: string) => {
          return !primaryColumns[id].isDerived; // Filter out the derived columns
        },
      );
      // If the keys which exist in the tableData are different from the ones available in primaryColumns
      if (xor(columnIds, primaryColumnIds).length > 0) {
        const newTableColumns = this.createTablePrimaryColumns(); // This updates the widget
        this.updateColumnProperties(newTableColumns);
      }
    }

    if (!this.props.pageNo) this.props.updateWidgetMetaProperty("pageNo", 1);

    //update pageNo when defaultPageSize or totalRecordsCount is changed
    if (
      this.props.defaultPageSize &&
      this.props.totalRecordCount &&
      this.props.pageNo
    ) {
      const maxAllowedPageNumber = Math.ceil(
        this.props.totalRecordCount / this.props.defaultPageSize,
      );
      if (this.props.pageNo > maxAllowedPageNumber) {
        this.props.updateWidgetMetaProperty("pageNo", maxAllowedPageNumber);
      }
    }

    // If the user has switched the mutiple row selection feature
    if (this.props.multiRowSelection !== prevProps.multiRowSelection) {
      // It is switched ON:
      if (this.props.multiRowSelection) {
        // Use the selectedRowIndex if available as default selected index
        const selectedRowIndices = this.props.selectedRowIndex
          ? [this.props.selectedRowIndex]
          : []; // Else use an empty array
        this.props.updateWidgetMetaProperty(
          "selectedRowIndices",
          selectedRowIndices,
        );
        this.props.updateWidgetMetaProperty("selectedRowIndex", -1);
      } else {
        this.props.updateWidgetMetaProperty("selectedRowIndices", []);
      }
    }

    // If the user changed the defaultSelectedRow(s)
    if (!isEqual(this.props.defaultSelectedRow, prevProps.defaultSelectedRow)) {
      //Runs only when defaultSelectedRow is changed from property pane
      this.updateSelectedRowIndex();
    }

    if (
      this.props.pageSize !== prevProps.pageSize ||
      this.props.defaultPageSize !== prevProps.defaultPageSize
    ) {
      if (this.props.onPageSizeChange) {
        super.executeAction({
          triggerPropertyName: "onPageSizeChange",
          dynamicString: this.props.onPageSizeChange,
          event: {
            type: EventType.ON_PAGE_SIZE_CHANGE,
          },
        });
      }
    }
  }

  updateSelectedRowIndex = () => {
    if (!this.props.multiRowSelection) {
      const selectedRowIndex = isNumber(this.props.defaultSelectedRow)
        ? this.props.defaultSelectedRow
        : -1;
      this.props.updateWidgetMetaProperty("selectedRowIndex", selectedRowIndex);
    } else {
      const selectedRowIndices = Array.isArray(this.props.defaultSelectedRow)
        ? this.props.defaultSelectedRow
        : [];
      this.props.updateWidgetMetaProperty(
        "selectedRowIndices",
        selectedRowIndices,
      );
    }
  };

  getSelectedRowIndices = () => {
    let selectedRowIndices: number[] | undefined = this.props
      .selectedRowIndices;
    if (!this.props.multiRowSelection) selectedRowIndices = undefined;
    else {
      if (!Array.isArray(selectedRowIndices)) {
        if (Number.isInteger(selectedRowIndices))
          selectedRowIndices = [selectedRowIndices];
        else selectedRowIndices = [];
      }
    }
    return selectedRowIndices;
  };

  applyFilters = (filters: ReactTableFilter[]) => {
    this.resetSelectedRowIndex();
    this.props.updateWidgetMetaProperty("filters", filters);
  };

  toggleDrag = (disable: boolean) => {
    this.disableDrag(disable);
  };

  getPageView() {
    const {
      totalRecordsCount,
      defaultPageSize,
      filteredTableData = [],
      isVisibleCompactMode,
      isVisibleDownload,
      isVisibleFilters,
      isVisiblePagination,
      isVisibleSearch,
    } = this.props;
    const pageSize = defaultPageSize ? defaultPageSize : this.props.pageSize;
    const tableColumns = this.getTableColumns() || [];
    const paginatedFilteredData = [...filteredTableData];
    if (defaultPageSize && totalRecordsCount) {
      //if total records count configured is more than tableData
      if (this.props.pageNo * defaultPageSize > totalRecordsCount) {
        const count =
          totalRecordsCount - (this.props.pageNo - 1) * defaultPageSize;
        paginatedFilteredData.splice(count, paginatedFilteredData.length);
      }
      // Manage defaultPageSize data
      if (paginatedFilteredData.length > defaultPageSize) {
        paginatedFilteredData.splice(
          defaultPageSize,
          paginatedFilteredData.length,
        );
      }
    }
    const transformedData = this.transformData(
      paginatedFilteredData,
      tableColumns,
    );
    const { componentHeight, componentWidth } = this.getComponentDimensions();
    const isVisibleHeaderOptions =
      isVisibleCompactMode ||
      isVisibleDownload ||
      isVisibleFilters ||
      isVisiblePagination ||
      isVisibleSearch;

    return (
      <Suspense fallback={<Skeleton />}>
        <ReactTableComponent
          applyFilter={this.applyFilters}
          columnSizeMap={this.props.columnSizeMap}
          columns={tableColumns}
          compactMode={this.props.compactMode || CompactModeTypes.DEFAULT}
          defaultPageSize={defaultPageSize}
          disableDrag={this.toggleDrag}
          editMode={this.props.renderMode === RenderModes.CANVAS}
          filters={this.props.filters}
          handleReorderColumn={this.handleReorderColumn}
          handleResizeColumn={this.handleResizeColumn}
          height={componentHeight}
          isLoading={this.props.isLoading}
          isVisibleCompactMode={isVisibleCompactMode}
          isVisibleDownload={isVisibleDownload}
          isVisibleFilters={isVisibleFilters}
          isVisiblePagination={isVisiblePagination}
          isVisibleSearch={isVisibleSearch}
          multiRowSelection={this.props.multiRowSelection}
          nextPageClick={this.handleNextPageClick}
          onCommandClick={this.onCommandClick}
          onRowClick={this.handleRowClick}
          pageNo={this.props.pageNo}
          pageSize={
            isVisibleHeaderOptions ? Math.max(1, pageSize) : pageSize + 1
          }
          prevPageClick={this.handlePrevPageClick}
          searchKey={this.props.searchText}
          searchTableData={this.handleSearchTable}
          selectedRowIndex={
            this.props.selectedRowIndex === undefined
              ? -1
              : this.props.selectedRowIndex
          }
          selectedRowIndices={this.getSelectedRowIndices()}
          serverSidePaginationEnabled={!!this.props.serverSidePaginationEnabled}
          sortTableColumn={this.handleColumnSorting}
          tableData={transformedData}
          tablePageSize={Math.max(1, this.props.pageSize)}
          totalRecordsCount={totalRecordsCount}
          triggerRowSelection={this.props.triggerRowSelection}
          updateCompactMode={this.handleCompactModeChange}
          updatePageNo={this.updatePageNumber}
          widgetId={this.props.widgetId}
          widgetName={this.props.widgetName}
          width={componentWidth}
        />
      </Suspense>
    );
  }

  handleCompactModeChange = (compactMode: CompactMode) => {
    if (this.props.renderMode === RenderModes.CANVAS) {
      super.updateWidgetProperty("compactMode", compactMode);
    } else {
      this.props.updateWidgetMetaProperty("compactMode", compactMode);
    }
  };

  handleReorderColumn = (columnOrder: string[]) => {
    if (this.props.renderMode === RenderModes.CANVAS) {
      super.updateWidgetProperty("columnOrder", columnOrder);
    } else this.props.updateWidgetMetaProperty("columnOrder", columnOrder);
  };

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

  handleResizeColumn = (columnSizeMap: { [key: string]: number }) => {
    if (this.props.renderMode === RenderModes.CANVAS) {
      super.updateWidgetProperty("columnSizeMap", columnSizeMap);
    } else {
      this.props.updateWidgetMetaProperty("columnSizeMap", columnSizeMap);
    }
  };

  handleSearchTable = (searchKey: any) => {
    const { onSearchTextChanged } = this.props;
    this.resetSelectedRowIndex();
    this.props.updateWidgetMetaProperty("pageNo", 1);
    this.props.updateWidgetMetaProperty("searchText", searchKey, {
      triggerPropertyName: "onSearchTextChanged",
      dynamicString: onSearchTextChanged,
      event: {
        type: EventType.ON_SEARCH,
      },
    });
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
        triggerPropertyName: "onClick",
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
    if (this.props.multiRowSelection) {
      const selectedRowIndices = this.props.selectedRowIndices
        ? [...this.props.selectedRowIndices]
        : [];
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
    } else {
      const selectedRowIndex = isNumber(this.props.selectedRowIndex)
        ? this.props.selectedRowIndex
        : -1;

      if (selectedRowIndex !== index) {
        this.props.updateWidgetMetaProperty("selectedRowIndex", index, {
          triggerPropertyName: "onRowSelected",
          dynamicString: this.props.onRowSelected,
          event: {
            type: EventType.ON_ROW_SELECTED,
          },
        });
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
    let pageNo = this.props.pageNo || 1;
    pageNo = pageNo + 1;
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
    if (!this.props.multiRowSelection) {
      const selectedRowIndex = isNumber(this.props.defaultSelectedRow)
        ? this.props.defaultSelectedRow
        : -1;
      this.props.updateWidgetMetaProperty("selectedRowIndex", selectedRowIndex);
    } else {
      const selectedRowIndices = Array.isArray(this.props.defaultSelectedRow)
        ? this.props.defaultSelectedRow
        : [];
      this.props.updateWidgetMetaProperty(
        "selectedRowIndices",
        selectedRowIndices,
      );
    }
  };

  handlePrevPageClick = () => {
    let pageNo = this.props.pageNo || 1;
    pageNo = pageNo - 1;
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

  getWidgetType(): WidgetType {
    return "TABLE_WIDGET";
  }
}

export default TableWidget;
export const ProfiledTableWidget = Sentry.withProfiler(withMeta(TableWidget));
