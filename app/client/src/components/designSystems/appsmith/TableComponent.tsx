import BaseTable, { Column } from "react-base-table";
import styled from "styled-components";
import React from "react";
import { noop } from "../../../utils/AppsmithUtils";

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
    return selectedRowIndex === rowIndex ? "row-selected" : "";
  };

  render() {
    const { onRowClick, ...rest } = this.props;
    return (
      <StyledTable
        {...rest}
        rowClassName={this._rowClassName}
        rowEventHandlers={{
          onClick: this._onClick,
        }}
      />
    );
  }
}

SelectableTable.defaultProps = {
  ...BaseTable.defaultProps,
  onRowSelect: noop,
  onSelectedRowsChange: noop,
};
