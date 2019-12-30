import {
  ColumnDirective,
  ColumnsDirective,
  GridComponent,
  ColumnModel,
  Grid,
  Inject,
  Resize,
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
  public rowSelected = () => {
    if (this.grid) {
      /** Get the selected row indexes */
      const selectedrowindex: number[] = this.grid.getSelectedRowIndexes();
      /** Get the selected records. */
      const selectedrecords: object[] = this.grid.getSelectedRecords();
      this.props.onRowClick(selectedrecords[0], selectedrowindex[0]);
    }
  };
  public dataBound = () => {
    if (this.grid) {
      this.grid.autoFitColumns();
    }
  };
  public render() {
    return (
      <StyledGridComponent
        dataSource={this.props.data}
        selectedRowIndex={this.props.selectedRowIndex}
        rowSelected={this.rowSelected}
        ref={(g: GridComponent) => (this.grid = g)}
        width={this.props.width - 16}
        height={this.props.height - 62}
        dataBound={this.dataBound}
      >
        <Inject services={[Resize]} />
        <ColumnsDirective>
          {this.props.columns.map(col => {
            return <ColumnDirective key={col.field} field={col.field} />;
          })}
        </ColumnsDirective>
      </StyledGridComponent>
    );
  }
}
