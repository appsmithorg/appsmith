import { useTable, useSortBy, useExpanded } from "react-table";
import React from "react";
import styled from "styled-components";
import { Classes } from "../constants/classes";
import { typography } from "../constants/typography";
import { Spinner } from "@appsmith/ads";
import { importSvg } from "../utils/icon-loadables";

const DownArrow = importSvg(
  async () => import("../assets/icons/ads/down_arrow.svg"),
);
const UpperArrow = importSvg(
  async () => import("../assets/icons/ads/upper_arrow.svg"),
);

const Styles = styled.div`
  table {
    border-spacing: 0;
    width: 100%;

    thead {
      position: sticky;
      top: 0;
      z-index: 1;

      tr {
        background-color: var(--ads-v2-color-bg-subtle);

        th {
          padding: var(--ads-spaces-5) var(--ads-spaces-9);
          text-align: left;
          color: var(--ads-v2-color-fg);
          font-weight: ${typography.h6.fontWeight};
          font-size: ${typography.h6.fontSize}px;
          line-height: ${typography.h6.lineHeight}px;
          letter-spacing: ${typography.h6.letterSpacing}px;
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
            cursor: pointer;
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
          font-size: ${typography.p1.fontSize}px;
          line-height: ${typography.p1.lineHeight}px;
          letter-spacing: ${typography.p1.letterSpacing}px;
          font-weight: normal;
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
          .${Classes.ICON} {
            path {
              fill: var(--ads-v2-color-fg);
            }
          }
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
            <tr className="no-hover">
              <td className="no-border" colSpan={columns?.length}>
                <CentralizedWrapper>
                  {loaderComponent ? loaderComponent : <Spinner size="lg" />}
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
            <tr className="no-hover">
              <td className="no-border" colSpan={columns?.length}>
                <CentralizedWrapper>
                  {noDataComponent ? (
                    noDataComponent
                  ) : (
                    <TableColumnEmptyWrapper>
                      {/*<img alt="No data" src={NoDataImage} />*/}
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

export default Table;
