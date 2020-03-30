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
} from "@syncfusion/ej2-react-grids";
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
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
      if (grid.current && grid.current.element) {
        const header = grid.current.getHeaderContent();
        header.addEventListener("mousedown", disableBubbling);
      }
      return () => {
        /* eslint-disable react-hooks/exhaustive-deps */
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
      /* eslint-disable react-hooks/exhaustive-deps */
    }, [grid.current]);

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
    function columnDrop() {
      props.disableDrag(false);
    }
    function columnDragStart() {
      props.disableDrag(true);
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

    return (
      <TableContainer className={props.isLoading ? Classes.SKELETON : ""}>
        <StyledGridComponent
          selectionSettings={settings}
          dataSource={props.data}
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
          ref={grid}
          width={"100%"}
          allowPaging={!props.serverSidePaginationEnabled}
          allowReordering={true}
          allowResizing={true}
          showColumnMenu={true}
          columnDragStart={columnDragStart}
          columnDrop={columnDrop}
          commandClick={onCommandClick}
          columnMenuOpen={columnMenuOpen}
        >
          <Inject
            services={[Resize, Page, Reorder, ColumnMenu, CommandColumn]}
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
      nextProps.pageNo !== prevProps.pageNo;

    return !propsNotEqual;
  },
);

export default TableComponent;
