import {
  ColumnDirective,
  ColumnsDirective,
  GridComponent,
  ColumnModel,
  Grid,
  Inject,
  Resize,
  Page,
  SelectionSettingsModel,
} from "@syncfusion/ej2-react-grids";
import React, { useEffect, useRef, MutableRefObject, memo } from "react";
import styled from "constants/DefaultTheme";

export interface TableComponentProps {
  data: object[];
  columns: ColumnModel[];
  selectedRowIndex?: number;
  onRowClick: (rowData: object, rowIndex: number) => void;
  isLoading: boolean;
  height: number;
  width: number;
}

const StyledGridComponent = styled(GridComponent)`
  .e-altrow {
    background-color: #fafafa;
  }
`;
const settings: SelectionSettingsModel = {
  type: "Multiple",
};

type GridRef = MutableRefObject<Grid | undefined>;

function reCalculatePageSize(grid: GridRef) {
  if (grid.current) {
    const rowHeight: number = grid.current.getRowHeight();
    /** Grid height */
    const gridHeight: number = grid.current.height as number;
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
    const grid: GridRef = useRef();

    // componentDidUpdate start
    useEffect(() => {
      props.height && reCalculatePageSize(grid);
    }, [props.height]);
    // componentDidUpdate end

    function dataBound() {
      if (grid.current) {
        grid.current.autoFitColumns();
      }
    }

    function rowSelected() {
      if (grid.current) {
        /** Get the selected row indexes */
        const selectedrowindex: number[] = grid.current.getSelectedRowIndexes();
        /** Get the selected records. */
        const selectedrecords: object[] = grid.current.getSelectedRecords();
        if (selectedrecords.length !== 0) {
          props.onRowClick(selectedrecords[0], selectedrowindex[0]);
        }
      }
    }

    return (
      <StyledGridComponent
        selectionSettings={settings}
        dataSource={props.data}
        rowSelected={rowSelected}
        ref={grid}
        width={props.width - 16}
        height={props.height - 107}
        dataBound={dataBound}
        allowPaging={true}
      >
        <Inject services={[Resize, Page]} />
        <ColumnsDirective>
          {props.columns.map(col => {
            return <ColumnDirective key={col.field} field={col.field} />;
          })}
        </ColumnsDirective>
      </StyledGridComponent>
    );
  },
  (prevProps, nextProps) => {
    const propsNotEqual =
      JSON.stringify(nextProps.data) !== JSON.stringify(prevProps.data) ||
      nextProps.height !== prevProps.height ||
      nextProps.width !== prevProps.width;

    return !propsNotEqual;
  },
);

export default TableComponent;
