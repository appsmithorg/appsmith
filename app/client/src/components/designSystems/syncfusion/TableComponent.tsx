import {
  ColumnDirective,
  ColumnsDirective,
  GridComponent,
  ColumnModel,
  Grid,
  Inject,
  Resize,
  Page,
} from "@syncfusion/ej2-react-grids";
import * as React from "react";
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

export default class TableComponent extends React.Component<
  TableComponentProps,
  {}
> {
  private grid: Grid | null | undefined;
  rowSelected = () => {
    if (this.grid) {
      /** Get the selected row indexes */
      const selectedrowindex: number[] = this.grid.getSelectedRowIndexes();
      /** Get the selected records. */
      const selectedrecords: object[] = this.grid.getSelectedRecords();
      if (selectedrecords.length !== 0) {
        this.props.onRowClick(selectedrecords[0], selectedrowindex[0]);
      }
    }
  };

  reCalculatePageSize = () => {
    if (this.grid) {
      /** height of the each row */
      const rowHeight: number = this.grid.getRowHeight();
      /** Grid height */
      const gridHeight: number = this.grid.height as number;
      /** initial page size */
      const pageSize: number = this.grid.pageSettings.pageSize as number;
      /** new page size is obtained here */
      const pageResize: any = (gridHeight - pageSize * rowHeight) / rowHeight;
      this.grid.pageSettings.pageSize = pageSize + Math.round(pageResize);
    }
  };
  dataBound = () => {
    if (this.grid) {
      this.grid.autoFitColumns();
    }
  };
  componentDidUpdate(prevProps: TableComponentProps) {
    if (prevProps.height !== this.props.height) {
      this.reCalculatePageSize();
    }
  }
  render() {
    return (
      <StyledGridComponent
        dataSource={this.props.data}
        selectedRowIndex={this.props.selectedRowIndex}
        rowSelected={this.rowSelected}
        ref={(g: GridComponent) => (this.grid = g)}
        width={this.props.width - 16}
        height={this.props.height - 107}
        dataBound={this.dataBound}
        allowPaging={true}
      >
        <Inject services={[Resize, Page]} />
        <ColumnsDirective>
          {this.props.columns.map(col => {
            return <ColumnDirective key={col.field} field={col.field} />;
          })}
        </ColumnsDirective>
      </StyledGridComponent>
    );
  }
}
