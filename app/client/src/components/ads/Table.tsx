import { useTable, useSortBy } from "react-table";
import React from "react";
import styled from "styled-components";
import { ReactComponent as DownArrow } from "../../assets/icons/ads/down_arrow.svg";
import { ReactComponent as UpperArrow } from "../../assets/icons/ads/upper_arrow.svg";
import { Classes } from "@blueprintjs/core/lib/esm/common";

const Styles = styled.div<{ isLoading?: boolean }>`
  table {
    border-spacing: 0;
    width: 100%;

    thead {
      tr {
        background-color: ${props => props.theme.colors.blackShades[2]};

        th:first-child {
          padding: ${props => props.theme.spaces[5]}px
            ${props => props.theme.spaces[9]}px;
        }

        th {
          padding: ${props => props.theme.spaces[5]}px
            ${props => props.theme.spaces[5]}px
            ${props => props.theme.spaces[5]}px 0;
          text-align: left;
          color: ${props => props.theme.colors.blackShades[5]};
          font-weight: ${props => props.theme.fontWeights[1]};
          font-size: ${props => props.theme.typography.h6.fontSize}px;
          line-height: ${props => props.theme.typography.h6.lineHeight}px;
          letter-spacing: ${props => props.theme.typography.h6.letterSpacing}px;

          svg {
            margin-left: ${props => props.theme.spaces[2]}px;
            margin-bottom: ${props => props.theme.spaces[0] + 1}px;
          }

          &:hover {
            color: ${props => props.theme.colors.blackShades[7]};
            cursor: pointer;
            svg {
              path {
                fill: ${props => props.theme.colors.blackShades[7]};
              }
            }
          }
        }
      }
    }

    tbody {
      tr {
        td:first-child {
          color: ${props => props.theme.colors.blackShades[7]};
          ${props =>
            props.isLoading
              ? `padding: ${props.theme.spaces[4]}px 0 ${props.theme.spaces[4]}px ${props.theme.spaces[9]}px`
              : `padding: ${props.theme.spaces[4]}px ${props.theme.spaces[9]}px`};
          font-weight: ${props => props.theme.fontWeights[1]};
        }

        td {
          ${props =>
            props.isLoading
              ? `padding: ${props.theme.spaces[4]}px 0`
              : `padding: ${props.theme.spaces[4]}px ${props.theme.spaces[4]}px ${props.theme.spaces[4]}px 0`};
          color: ${props => props.theme.colors.blackShades[6]};
          font-size: ${props => props.theme.typography.p1.fontSize}px;
          line-height: ${props => props.theme.typography.p1.lineHeight}px;
          letter-spacing: ${props => props.theme.typography.p1.letterSpacing}px;
          font-weight: normal;
          border-bottom: 1px solid ${props =>
            props.theme.colors.blackShades[3]};
        }

        td:last-child {
          padding: ${props => props.theme.spaces[4]}px ${props =>
  props.theme.spaces[4]}px ${props => props.theme.spaces[4]}px 0};
        }

        &:hover {
          background-color: ${props => props.theme.colors.blackShades[4]};
          .ads-icon {
            path {
              fill: ${props => props.theme.colors.blackShades[9]};
            }
          }
          td:first-child {
            color: ${props => props.theme.colors.blackShades[9]};
          }
          td {
            color: ${props => props.theme.colors.blackShades[7]};
          }
        }
      }
    }

    .bp3-skeleton {
      border-radius: 0px !important;
    }
  }
`;

const RowLoader = styled.div<{ isLoading?: boolean }>`
  ${props => (props.isLoading ? "height: 23px" : null)}
`;

const HeaderLoader = styled.div<{ isLoading?: boolean }>`
  ${props => (props.isLoading ? "height: 16px" : null)}
`;

interface TableColumnProps {
  Header: string;
  accessor: string;
  Cell?: (props: { cell: { value: any } }) => JSX.Element;
}

interface TableProps {
  data: object[];
  columns: TableColumnProps[];
  isLoading?: boolean;
}

function Table(props: TableProps) {
  const { data, columns } = props;

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data }, useSortBy);

  return (
    <Styles isLoading={props.isLoading}>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup, index) => (
            <tr {...headerGroup.getHeaderGroupProps()} key={index}>
              {headerGroup.headers.map((column, index) => (
                <th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  key={index}
                >
                  {props.isLoading ? (
                    <HeaderLoader
                      isLoading={props.isLoading}
                      className={props.isLoading ? Classes.SKELETON : ""}
                    ></HeaderLoader>
                  ) : (
                    <div>
                      {column.render("Header")}
                      {column.isSorted ? (
                        column.isSortedDesc ? (
                          <UpperArrow />
                        ) : (
                          <DownArrow />
                        )
                      ) : (
                        ""
                      )}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, index) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} key={index}>
                {row.cells.map((cell, index) => {
                  return (
                    <td {...cell.getCellProps()} key={index}>
                      {props.isLoading ? (
                        <RowLoader
                          isLoading={props.isLoading}
                          className={props.isLoading ? Classes.SKELETON : ""}
                        ></RowLoader>
                      ) : (
                        cell.render("Cell")
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Styles>
  );
}

Table.displayName = "Table";

export default Table;
