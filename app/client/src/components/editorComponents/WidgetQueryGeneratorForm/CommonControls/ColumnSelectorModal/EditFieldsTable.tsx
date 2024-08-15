import { useTable, useSortBy, useExpanded } from "react-table";
import React from "react";
import styled from "styled-components";
import { Spinner } from "@appsmith/ads";

const Styles = styled.div`
  table {
    border-spacing: 0;
    width: 100%;

    thead {
      position: sticky;
      top: 0;

      tr {
        background-color: var(--ads-v2-color-gray-50);

        th {
          padding: var(--ads-spaces-5) var(--ads-spaces-9);
          text-align: left;
          color: var(--ads-v2-color-fg);
          border-bottom: 1px solid var(--ads-v2-color-border);

          svg {
            margin-left: var(--ads-spaces-2);
            margin-bottom: calc(var(--ads-spaces-0) + 1px);
            width: 6px;
            height: 4px;
            display: initial;
          }

          &:hover {
            color: var(--ads-v2-color-fg-emphasis);
            cursor: inherit;

            svg {
              path {
                fill: var(var(--ads-v2-color-fg));
              }
            }
          }
        }
      }
    }

    tbody {
      tr {
        td {
          padding: var(--ads-spaces-4) var(--ads-spaces-9);
          color: var(--ads-v2-color-fg);
          border-bottom: 1px solid var(--ads-v2-color-border);

          &:first-child {
            color: var(--ads-v2-color-fg);
            font-weight: var(--ads-font-weight-normal);
          }

          &.no-border {
            border: none;

            .no-data-title {
              color: var(--ads-v2-color-fg);
            }
          }
        }

        &:hover:not(.no-hover) {
          background-color: var(--ads-v2-color-bg-subtle);

          td {
            color: var(--ads-v2-color-fg);

            &:first-child {
              color: var(--ads-v2-color-fg);
            }

            &.no-border {
              background-color: var(--ads-v2-color-bg-muted);
            }
          }
        }
      }
    }
  }
`;

const CentralizedWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 250px;
`;

const TableColumnEmptyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  img {
    width: 156px;
    margin-top: 16px;
  }

  .no-data-title {
    font-weight: 500;
    font-size: 14px;
    line-height: 16px;
    letter-spacing: 0.04em;
    color: #ffffff;
    margin-top: 23px;
  }
`;

export interface TableProps {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: any[];
  isLoading?: boolean;
  loaderComponent?: JSX.Element;
  noDataComponent?: JSX.Element;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rowProps: any;
}

function EditFieldsTable(props: TableProps) {
  const {
    columns,
    data,
    isLoading = false,
    loaderComponent,
    noDataComponent,
    rowProps,
  } = props;

  const { getTableBodyProps, getTableProps, headerGroups, prepareRow, rows } =
    useTable(
      { autoResetExpanded: false, columns, data },
      useSortBy,
      useExpanded,
    );

  return (
    <Styles>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup, index: number) => (
            <tr {...headerGroup.getHeaderGroupProps()} key={index}>
              {headerGroup.headers.map((column, index: number) => (
                <th
                  {...column.getHeaderProps(
                    column.getSortByToggleProps({ title: undefined }),
                  )}
                  key={index}
                >
                  {column.render("Header")}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {isLoading ? (
            <tr className="no-hover">
              <td className="no-border" colSpan={columns?.length}>
                <CentralizedWrapper>
                  {loaderComponent ? loaderComponent : <Spinner />}
                </CentralizedWrapper>
              </td>
            </tr>
          ) : rows.length > 0 ? (
            rows.map((row, index) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps(rowProps(row))} key={index}>
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
            <tr className="no-hover">
              <td className="no-border" colSpan={columns?.length}>
                <CentralizedWrapper>
                  {noDataComponent ? (
                    noDataComponent
                  ) : (
                    <TableColumnEmptyWrapper>
                      <div
                        className="no-data-title"
                        data-testid="t--no-data-title"
                      >
                        No data found
                      </div>
                    </TableColumnEmptyWrapper>
                  )}
                </CentralizedWrapper>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Styles>
  );
}

export default EditFieldsTable;
