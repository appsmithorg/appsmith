import {
  ColumnDirective,
  ColumnsDirective,
  GridComponent,
  ColumnModel,
  Inject,
  Resize,
  Page,
  SelectionSettingsModel,
  Reorder,
  ColumnMenu,
  CommandColumn,
  CommandModel,
  CommandClickEventArgs,
  ColumnMenuOpenEventArgs,
  ColumnMenuItemModel,
  PageSettingsModel,
  PagerComponent,
  Toolbar,
  PdfExport,
  ExcelExport,
  Search,
  RowDataBoundEventArgs,
} from "@syncfusion/ej2-react-grids";
import { getValue } from "@syncfusion/ej2-base";
import { ClickEventArgs } from "@syncfusion/ej2-navigations";
import React, { useRef, MutableRefObject, useEffect, memo } from "react";
import styled from "constants/DefaultTheme";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { Classes } from "@blueprintjs/core";
import { TablePagination } from "../appsmith/TablePagination";
import {
  AUTOFIT_ALL_COLUMNS,
  AUTOFIT_THIS_COLUMN,
  AUTOFIT_COLUMN,
} from "constants/messages";

import "@syncfusion/ej2-base/styles/material.css";
import "@syncfusion/ej2-buttons/styles/material.css";
import "@syncfusion/ej2-calendars/styles/material.css";
import "@syncfusion/ej2-dropdowns/styles/material.css";
import "@syncfusion/ej2-inputs/styles/material.css";
import "@syncfusion/ej2-navigations/styles/material.css";
import "@syncfusion/ej2-popups/styles/material.css";
import "@syncfusion/ej2-splitbuttons/styles/material.css";
import "@syncfusion/ej2-react-grids/styles/material.css";

export interface TableComponentProps {
  data: object[];
  columns: ColumnModel[];
  onRowClick: (rowData: object, rowIndex: number) => void;
  isLoading: boolean;
  height: number;
  width: number;
  columnActions?: ColumnAction[];
  onCommandClick: (dynamicTrigger: string) => void;
  disableDrag: (disable: boolean) => void;
  nextPageClick: Function;
  prevPageClick: Function;
  pageNo: number;
  serverSidePaginationEnabled: boolean;
  updatePageSize: Function;
  updatePageNo: Function;
  updateHiddenColumns: Function;
  resetSelectedRowIndex: Function;
  selectedRowIndex: number;
  id: string;
  exportCsv?: boolean;
  exportExcel?: boolean;
  exportPDF?: boolean;
}

const StyledGridComponent = styled(GridComponent)`
  &&& {
    height: calc(100% - 49px);
    .e-altrow {
      background-color: #fafafa;
    }
    .e-active {
      background: #cccccc;
    }
    .e-gridcontent {
      height: calc(100% - 50px);
      overflow: auto;
    }
    .e-gridpager {
      display: none;
    }
  }
`;

const TableContainer = styled.div`
  height: 100%;
`;
const settings: SelectionSettingsModel = {
  type: "Multiple",
  enableToggle: false,
};

type GridRef = MutableRefObject<GridComponent | null>;
type PagerRef = MutableRefObject<PagerComponent | null>;

/* eslint-disable react/display-name */
const TableComponent = memo(
  (props: TableComponentProps) => {
    const grid: GridRef = useRef(null);
    const pager: PagerRef = useRef(null);
    function disableBubbling(e: any) {
      e.preventDefault();
      e.stopPropagation();
    }
    const handleCreated = () => {
      if (grid.current && grid.current.element) {
        const header = grid.current.getHeaderContent();
        header.addEventListener("mousedown", disableBubbling);
      }
    };

    const handleDestroy = () => {
      /* It is as concern whether this will still propagate to the
      internal of syncfusion, resulting in a full cleanup of all 
      eventhandlers, components, etc.
      */
      if (grid.current && grid.current.element) {
        const headers = grid.current.element.getElementsByClassName(
          "e-gridheader",
        );
        for (let i = 0; i < headers.length; i++) {
          const header = headers[i];
          header.removeEventListener("mousedown", disableBubbling);
        }
      }
    };

    useEffect(() => {
      if (grid.current && grid.current.getPager()) {
        grid.current.getPager().classList.add("display-none");
      }
      /* eslint-disable react-hooks/exhaustive-deps */
    }, [grid.current, props.serverSidePaginationEnabled]);

    function reCalculatePageSize(grid: GridRef, height: number) {
      if (grid.current) {
        const rowHeight: number = grid.current.getRowHeight();
        /** Grid height */
        const gridHeight: number = height - 107;
        /** initial page size */
        const pageSize: number = grid.current.pageSettings.pageSize as number;
        /** new page size is obtained here */
        const pageResize: any = (gridHeight - pageSize * rowHeight) / rowHeight;
        const finalPageSize = pageSize + Math.round(pageResize);
        grid.current.pageSettings.pageSize = finalPageSize;

        if (pager.current) {
          pager.current.totalRecordsCount = props.data.length;
          pager.current.pageSize = finalPageSize;
        }

        props.updatePageSize(grid.current.pageSettings.pageSize);
      }
    }

    function rowSelected() {
      if (grid.current) {
        /** Get the selected row indexes */
        const selectedrowindex: number[] = grid.current.getSelectedRowIndexes();
        /** Get the selected records. */
        const selectedrecords: object[] = grid.current.getSelectedRecords();
        if (selectedrecords.length !== 0) {
          let index = selectedrowindex[0];
          const pageSettings: PageSettingsModel = grid.current.pageSettings;
          if (
            pageSettings &&
            pageSettings.currentPage !== undefined &&
            pageSettings.pageSize !== undefined
          ) {
            index =
              index + (pageSettings.currentPage - 1) * pageSettings.pageSize;
          }
          props.onRowClick(selectedrecords[0], index);
        }
      }
    }

    const commands: CommandModel[] = (props.columnActions || []).map(action => {
      return {
        buttonOption: { content: action.label },
        data: action.dynamicTrigger,
      };
    });

    function onCommandClick(args: CommandClickEventArgs | undefined) {
      if (args) {
        const _target = args.target;
        if (props.columnActions && _target) {
          props.columnActions
            .filter(
              action =>
                action.label.toLowerCase() === _target.title.toLowerCase(),
            )
            .forEach(action => {
              props.onCommandClick(action.dynamicTrigger);
            });
        }
      }
    }

    function rowDataBound(args: RowDataBoundEventArgs) {
      const color = getValue("_color", args.data);
      if (args.row && color) {
        (args.row as any).style.backgroundColor = color;
      }
    }

    function columnMenuOpen(args: ColumnMenuOpenEventArgs) {
      for (const item of args.items) {
        if (item.text) {
          if (item.text === AUTOFIT_ALL_COLUMNS) {
            (item as ColumnMenuItemModel).hide = true;
          }
          if (item.text === AUTOFIT_THIS_COLUMN) {
            (item as ColumnMenuItemModel).text = AUTOFIT_COLUMN;
          }
        }
      }
    }
    function columnMenuClick() {
      props.updateHiddenColumns(
        grid.current
          ?.getColumns()
          .filter(column => !column.visible)
          .map(col => col.field),
      );
    }

    const handleToolbarClick = (args: ClickEventArgs) => {
      if (grid.current && args.item.id === `${props.id}_excelexport`) {
        grid.current.excelExport({ fileName: `${props.id}.xlsx` });
      }
      if (grid.current && args.item.id === `${props.id}_csvexport`) {
        grid.current.csvExport({ fileName: `${props.id}.csv` });
      }
      if (grid.current && args.item.id === `${props.id}_pdfexport`) {
        grid.current.pdfExport({ fileName: `${props.id}.pdf` });
      }
    };
    const handleResizeStart = (args: any) => {
      args.e.stopPropagation();
    };

    const toolbarOptions: string[] = [];
    if (!!props.exportCsv) toolbarOptions.push("CsvExport");
    if (!!props.exportExcel) toolbarOptions.push("ExcelExport");
    if (!!props.exportPDF) toolbarOptions.push("PdfExport");

    return (
      <TableContainer className={props.isLoading ? Classes.SKELETON : ""}>
        <StyledGridComponent
          toolbarClick={handleToolbarClick}
          created={handleCreated}
          destroy={handleDestroy}
          selectionSettings={settings}
          dataSource={props.data}
          id={props.id}
          columnMenuClick={columnMenuClick}
          dataBound={() => {
            if (pager.current) {
              pager.current.totalRecordsCount = props.data.length;
            }
            if (grid.current) {
              props.height && reCalculatePageSize(grid, props.height);
              grid.current.selectionModule.selectRow(props.selectedRowIndex);
            }
          }}
          rowSelected={rowSelected}
          resizeStart={handleResizeStart}
          ref={grid}
          width={"100%"}
          allowPaging={!props.serverSidePaginationEnabled}
          allowReordering={true}
          allowResizing={true}
          showColumnMenu={true}
          commandClick={onCommandClick}
          columnMenuOpen={columnMenuOpen}
          rowDataBound={rowDataBound}
          toolbar={!!toolbarOptions.length && toolbarOptions}
          allowPdfExport
          allowExcelExport
          // enableVirtualization
        >
          <Inject
            services={[
              Resize,
              Page,
              Reorder,
              ColumnMenu,
              CommandColumn,
              Toolbar,
              ExcelExport,
              PdfExport,
              Search,
              // VirtualScroll,
            ]}
          />
          <ColumnsDirective>
            {props.columns.map(col => {
              return (
                <ColumnDirective
                  key={col.field}
                  field={col.field}
                  width={200}
                  visible={col.visible}
                />
              );
            })}
            {commands.length > 0 && (
              <ColumnDirective headerText="Actions" commands={commands} />
            )}
          </ColumnsDirective>
        </StyledGridComponent>
        {!props.serverSidePaginationEnabled && (
          <PagerComponent
            ref={pager}
            click={event => {
              if (grid.current && event) {
                props.resetSelectedRowIndex();
                grid.current.pageSettings.currentPage = (event as any).currentPage;
                if (!props.serverSidePaginationEnabled) {
                  props.updatePageNo((event as any).currentPage);
                }
              }
            }}
          />
        )}
        {props.serverSidePaginationEnabled && (
          <TablePagination
            pageNo={props.pageNo}
            prevPageClick={props.prevPageClick}
            nextPageClick={props.nextPageClick}
          ></TablePagination>
        )}
      </TableContainer>
    );
  },
  (prevProps, nextProps) => {
    const dataNotEqual =
      JSON.stringify(nextProps.data) !== JSON.stringify(prevProps.data);

    if (
      (dataNotEqual &&
        nextProps.data.length !== 0 &&
        prevProps.data.length !== 0) ||
      (nextProps.data.length === 0 && prevProps.data.length > 0)
    ) {
      nextProps.updateHiddenColumns(undefined);
    }

    const propsNotEqual =
      nextProps.isLoading !== prevProps.isLoading ||
      dataNotEqual ||
      nextProps.height !== prevProps.height ||
      JSON.stringify(nextProps.columnActions) !==
        JSON.stringify(prevProps.columnActions) ||
      nextProps.serverSidePaginationEnabled !==
        prevProps.serverSidePaginationEnabled ||
      nextProps.pageNo !== prevProps.pageNo ||
      nextProps.exportCsv !== prevProps.exportCsv ||
      nextProps.exportExcel !== prevProps.exportExcel ||
      nextProps.exportPDF !== prevProps.exportPDF;

    return !propsNotEqual;
  },
);

export default TableComponent;
