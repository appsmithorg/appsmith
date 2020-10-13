import React from "react";
import {
  TableWrapper,
  CellWrapper,
} from "components/designSystems/appsmith/TableStyledWrappers";
import { useTable, useFlexLayout } from "react-table";
import styled from "styled-components";
import { CompactModeTypes, TABLE_SIZES } from "widgets/TableWidget";
import AutoToolTipComponent from "components/designSystems/appsmith/AutoToolTipComponent";
import { getType, Types } from "utils/TypeHelpers";

interface TableProps {
  data: Record<string, any>[];
}

const StyledTableWrapped = styled(TableWrapper)`
  min-height: 0px;
  height: auto;
  .tableWrap {
    display: flex;
    flex: 1;
  }
  .table {
    display: flex;
    flex: 1;
    flex-direction: column;
    height: auto;
    .tbody {
      height: auto;
      overflow: auto;
    }
  }
`;

const renderCell = (props: any) => {
  const value = props.cell.value;
  let displayValue;
  switch (getType(value)) {
    case Types.NUMBER:
    case Types.BOOLEAN:
      displayValue = value.toString();
      break;
    case Types.ARRAY:
    case Types.FUNCTION:
    case Types.OBJECT:
      displayValue = JSON.stringify(value);
      break;
    case Types.STRING:
      displayValue = value;
      break;
    case Types.NULL:
    case Types.UNDEFINED:
    case Types.UNKNOWN:
      displayValue = "";
      break;
    default:
      displayValue = "";
  }

  return (
    <AutoToolTipComponent title={displayValue}>
      {displayValue}
    </AutoToolTipComponent>
  );
};

const Table = (props: TableProps) => {
  const data = React.useMemo(() => props.data, [props.data]);
  const columns = React.useMemo(() => {
    if (data.length) {
      return Object.keys(data[0]).map((key: any) => {
        return {
          Header: key,
          accessor: key,
          Cell: renderCell,
        };
      });
    }

    return [];
  }, [data]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
    {
      columns,
      data,
      manualPagination: true,
    },
    useFlexLayout,
  );

  if (rows.length === 0 || headerGroups.length === 0) return null;

  return (
    <StyledTableWrapped
      width={200}
      height={200}
      tableSizes={TABLE_SIZES[CompactModeTypes.DEFAULT]}
    >
      <div className="tableWrap">
        <div {...getTableProps()} className="table">
          {headerGroups.map((headerGroup: any, index: number) => (
            <div
              key={index}
              {...headerGroup.getHeaderGroupProps()}
              className="tr"
            >
              {headerGroup.headers.map((column: any, columnIndex: number) => (
                <div
                  key={columnIndex}
                  {...column.getHeaderProps()}
                  className="th header-reorder"
                >
                  <div
                    className={
                      !column.isHidden ? "draggable-header" : "hidden-header"
                    }
                  >
                    {column.render("Header")}
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div {...getTableBodyProps()} className="tbody">
            {rows.map((row: any, index: number) => {
              prepareRow(row);
              return (
                <div key={index} {...row.getRowProps()} className={"tr"}>
                  {row.cells.map((cell: any, cellIndex: number) => {
                    return (
                      <div
                        key={cellIndex}
                        {...cell.getCellProps()}
                        className="td"
                        data-rowindex={index}
                        data-colindex={cellIndex}
                      >
                        <CellWrapper isHidden={false}>
                          {cell.render("Cell")}
                        </CellWrapper>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </StyledTableWrapped>
  );
};

export default Table;
