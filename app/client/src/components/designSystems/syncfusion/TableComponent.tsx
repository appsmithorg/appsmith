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
} from "@syncfusion/ej2-react-grids";
import React, { useRef, MutableRefObject, useEffect, memo } from "react";
import styled from "constants/DefaultTheme";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { ActionPayload } from "constants/ActionConstants";
import { Classes } from "@blueprintjs/core";
import { TablePagination } from "../appsmith/TablePagination";

export interface TableComponentProps {
  data: object[];
  columns: ColumnModel[];
  onRowClick: (rowData: object, rowIndex: number) => void;
  isLoading: boolean;
  height: number;
  width: number;
  columnActions?: ColumnAction[];
  onCommandClick: (actions: ActionPayload[]) => void;
  disableDrag: (disable: boolean) => void;
  nextPageClick: Function;
  prevPageClick: Function;
  pageNo: number;
  serverSidePaginationEnabled: boolean;
}

const StyledGridComponent = styled(GridComponent)`
  &&& {
    height: calc(100% - 49px);
    .e-altrow {
      background-color: #fafafa;
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
};

type GridRef = MutableRefObject<GridComponent | null>;

function reCalculatePageSize(grid: GridRef, height: number) {
  if (grid.current) {
    const rowHeight: number = grid.current.getRowHeight();
    /** Grid height */
    const gridHeight: number = height - 107;
    /** initial page size */
    const pageSize: number = grid.current.pageSettings.pageSize as number;
    /** new page size is obtained here */
    const pageResize: any = (gridHeight - pageSize * rowHeight) / rowHeight;
    grid.current.pageSettings.pageSize = pageSize + Math.round(pageResize);
  }
}
/* eslint-disable react/display-name */
const TableComponent = memo(
  (props: TableComponentProps) => {
    const grid: GridRef = useRef(null);

    // componentDidUpdate start
    useEffect(() => {
      props.height && reCalculatePageSize(grid, props.height);
    }, [props.height]);
    // componentDidUpdate end

    function disableBubbling(e: any) {
      e.preventDefault();
      e.stopPropagation();
    }

    useEffect(() => {
      if (
        grid.current &&
        grid.current.element &&
        props.data &&
        props.height &&
        props.width &&
        props.columns
      ) {
        const header = grid.current.getHeaderContent();
        header.addEventListener("mousedown", disableBubbling);
      }
      return () => {
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
    }, [grid.current]);

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
        data: action.actionPayloads,
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
              props.onCommandClick(action.actionPayloads);
            });
        }
      }
    }

    function columnMenuOpen(args: ColumnMenuOpenEventArgs) {
      for (const item of args.items) {
        if (item.text) {
          if (item.text === "Autofit all columns") {
            (item as ColumnMenuItemModel).hide = true;
          }
          if (item.text === "Autofit this column") {
            (item as ColumnMenuItemModel).text = "Autofit column";
          }
        }
      }
    }

    return (
      <TableContainer className={props.isLoading ? Classes.SKELETON : ""}>
        <StyledGridComponent
          selectionSettings={settings}
          dataSource={props.data}
          rowSelected={rowSelected}
          ref={grid}
          width={"100%"}
          allowPaging={!props.serverSidePaginationEnabled}
          height={"100%"}
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
                />
              );
            })}
            {commands.length > 0 && (
              <ColumnDirective headerText="Actions" commands={commands} />
            )}
          </ColumnsDirective>
        </StyledGridComponent>
        <TablePagination
          visible={props.serverSidePaginationEnabled}
          pageNo={props.pageNo}
          prevPageClick={props.prevPageClick}
          nextPageClick={props.nextPageClick}
        ></TablePagination>
      </TableContainer>
    );
  },
  (prevProps, nextProps) => {
    const propsNotEqual =
      nextProps.isLoading !== prevProps.isLoading ||
      JSON.stringify(nextProps.data) !== JSON.stringify(prevProps.data) ||
      nextProps.height !== prevProps.height ||
      JSON.stringify(nextProps.columnActions) !==
        JSON.stringify(prevProps.columnActions) ||
      nextProps.serverSidePaginationEnabled !==
        prevProps.serverSidePaginationEnabled;

    return !propsNotEqual;
  },
);

export default TableComponent;
