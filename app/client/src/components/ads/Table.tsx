import { useTable, useSortBy } from "react-table";
import React from "react";
import styled from "styled-components";
import { ReactComponent as DownArrow } from "assets/icons/ads/down_arrow.svg";
import { ReactComponent as UpperArrow } from "assets/icons/ads/upper_arrow.svg";
import { Classes } from "./common";
import Spinner from "./Spinner";
import { IconSize } from "./Icon";
import EmptyDataState from "components/utils/EmptyDataState";

const Styles = styled.div`
  table {
    border-spacing: 0;
    width: 100%;

    thead {
      tr {
        background-color: ${(props) => props.theme.colors.table.headerBg};

        th {
          padding: ${(props) => props.theme.spaces[5]}px
            ${(props) => props.theme.spaces[9]}px;
          text-align: left;
          color: ${(props) => props.theme.colors.table.headerText};
          font-weight: ${(props) => props.theme.fontWeights[1]};
          font-size: ${(props) => props.theme.typography.h6.fontSize}px;
          line-height: ${(props) => props.theme.typography.h6.lineHeight}px;
          letter-spacing: ${(props) =>
            props.theme.typography.h6.letterSpacing}px;

          svg {
            margin-left: ${(props) => props.theme.spaces[2]}px;
            margin-bottom: ${(props) => props.theme.spaces[0] + 1}px;
          }

          &:hover {
            color: ${(props) => props.theme.colors.table.hover.headerColor};
            cursor: pointer;
            svg {
              path {
                fill: ${(props) => props.theme.colors.table.hover.headerColor};
              }
            }
          }
        }
      }
    }

    tbody {
      tr {
        td {
          padding: ${(props) => props.theme.spaces[4]}px
            ${(props) => props.theme.spaces[9]}px;
          color: ${(props) => props.theme.colors.table.rowData};
          font-size: ${(props) => props.theme.typography.p1.fontSize}px;
          line-height: ${(props) => props.theme.typography.p1.lineHeight}px;
          letter-spacing: ${(props) =>
            props.theme.typography.p1.letterSpacing}px;
          font-weight: normal;
          border-bottom: 1px solid ${(props) => props.theme.colors.table.border};

          &:first-child {
            color: ${(props) => props.theme.colors.table.rowTitle};
            font-weight: ${(props) => props.theme.fontWeights[1]};
          }

          &.no-border {
            border: none;

            .no-data-title {
              color: ${(props) => props.theme.colors.table.rowData};
            }
          }
        }

        &:hover {
          background-color: ${(props) => props.theme.colors.table.hover.rowBg};
          .${Classes.ICON} {
            path {
              fill: ${(props) => props.theme.colors.table.hover.rowTitle};
            }
          }
          td {
            color: ${(props) => props.theme.colors.table.hover.rowData};

            &:first-child {
              color: ${(props) => props.theme.colors.table.hover.rowTitle};
            }

            &.no-border {
              background-color: var(--appsmith-color-black-0);
            }
          }
        }
      }
    }
  }
`;

const HiddenArrow = styled(DownArrow)`
  visibility: hidden;
`;

const CentralizedWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 250px;
`;

export interface TableProps {
  data: any[];
  columns: any[];
  isLoading?: boolean;
  loaderComponent?: JSX.Element;
  noDataComponent?: JSX.Element;
}

function Table(props: TableProps) {
  const {
    columns,
    data,
    isLoading = false,
    loaderComponent,
    noDataComponent,
  } = props;

  const {
    getTableBodyProps,
    getTableProps,
    headerGroups,
    prepareRow,
    rows,
  } = useTable({ columns, data }, useSortBy);

  return (
    <Styles>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup, index) => (
            <tr {...headerGroup.getHeaderGroupProps()} key={index}>
              {headerGroup.headers.map((column, index) => (
                <th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  key={index}
                >
                  {column.render("Header")}
                  {column.isSorted ? (
                    column.isSortedDesc ? (
                      <UpperArrow />
                    ) : (
                      <DownArrow />
                    )
                  ) : (
                    <HiddenArrow />
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {isLoading ? (
            <tr>
              <td className="no-border" colSpan={columns?.length}>
                <CentralizedWrapper>
                  {loaderComponent ? (
                    loaderComponent
                  ) : (
                    <Spinner size={IconSize.XXL} />
                  )}
                </CentralizedWrapper>
              </td>
            </tr>
          ) : rows.length > 0 ? (
            rows.map((row, index) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} key={index}>
                  {row.cells.map((cell, index) => {
                    return (
                      <td
                        {...cell.getCellProps()}
                        data-colindex={index}
                        key={index}
                      >
                        {cell.render("Cell")}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          ) : (
            <tr>
              <td className="no-border" colSpan={columns?.length}>
                <CentralizedWrapper>
                  {noDataComponent ? noDataComponent : <EmptyDataState />}
                </CentralizedWrapper>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Styles>
  );
}

export default Table;
