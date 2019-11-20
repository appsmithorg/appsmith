import BaseTable, { Column } from "react-base-table";
import styled from "styled-components";
import React from "react";
import { noop } from "../../../utils/AppsmithUtils";

const RowLoader = styled.div`
  height: 16px !important;
  width: 100%;
  margin: 0 15px;
`;

const Row = (props: any) => (
  <div {...props}>
    <RowLoader className={"bp3-skeleton"} />
  </div>
);

const rowProps = ({ rowData }: { rowData: { isLoading: boolean } }) => {
  return rowData.isLoading ? { tagName: Row } : undefined;
};

const StyledTable = styled(BaseTable)`
  .row-selected {
    background-color: ${props =>
      props.theme.widgets.tableWidget.selectHighlightColor};
  }
`;

export interface Column {
  key: string;
  dataKey: string;
  title: string;
  width: number;
}

export interface ReactBaseTableProps {
  width: number;
  height: number;
  columns: Column[];
  data: object[];
  maxHeight: number;
  selectedRowIndex?: number;
}

export interface SelectableTableProps extends ReactBaseTableProps {
  onRowClick: (rowData: object, rowIndex: number) => void;
  isLoading: boolean;
}

export default class SelectableTable extends React.PureComponent<
  SelectableTableProps
> {
  static defaultProps = {};

  _onClick = ({ rowData, rowIndex }: { rowData: object; rowIndex: number }) => {
    if (this.props.selectedRowIndex !== rowIndex) {
      this.props.onRowClick(rowData, rowIndex);
    }
  };

  _rowClassName = ({ rowIndex }: { rowIndex: number }) => {
    const { selectedRowIndex } = this.props;
    const className = selectedRowIndex === rowIndex ? "row-selected" : "";
    return className;
  };

  render() {
    const { data, isLoading, onRowClick, ...rest } = this.props;
    const dataWithLoadingState = data.map(rowData => {
      return {
        ...rowData,
        isLoading: this.props.isLoading,
      };
    });
    return (
      <StyledTable
        {...rest}
        data={dataWithLoadingState}
        rowClassName={this._rowClassName}
        rowEventHandlers={{
          onClick: this._onClick,
        }}
        rowProps={rowProps}
      />
    );
  }
}

SelectableTable.defaultProps = {
  ...BaseTable.defaultProps,
  onRowSelect: noop,
  isLoading: false,
  onSelectedRowsChange: noop,
};
