import BaseTable, { Column } from "react-base-table";
import styled, { keyframes } from "styled-components";
import React from "react";
import { noop } from "../../../utils/AppsmithUtils";

const move = keyframes`
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(100%);
  }
`;

const InlineLoader = styled.div`
  overflow: hidden;
  height: 100%;
  width: 100%;
  position: relative;
  background-color: #eee;

  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background-position: left top;
    background-repeat: no-repeat;
    background-image: linear-gradient(to right, transparent, #ccc, transparent);
    animation: ${move} 1.5s linear infinite;
  }
`;

const RowLoader = styled(InlineLoader)`
  height: 16px !important;
  margin: 0 15px;
`;

const Row = (props: any) => (
  <div {...props}>
    <RowLoader />
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
    return selectedRowIndex === rowIndex ? "row-selected" : "";
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
