import { useTable, useSortBy } from "react-table";
import React from "react";
import styled from "styled-components";
import { ReactComponent as DownArrow } from "../../assets/icons/ads/down_arrow.svg";

const Styles = styled.div`
  table {
    border-spacing: 0;
    width: 100%;

    thead {
      tr {
        background-color: ${props => props.theme.colors.blackShades[2]};

        th:first-child {
          padding: 0 ${props => props.theme.spaces[9]}px;
        }

        th {
          padding: ${props => props.theme.spaces[5]}px 0;
          text-align: left;
          color: ${props => props.theme.colors.blackShades[5]};
          font-weight: ${props => props.theme.fontWeights[1]};
          font-size: ${props => props.theme.typography.h6.fontSize}px;
          line-height: ${props => props.theme.typography.h6.lineHeight}px;
          letter-spacing: ${props => props.theme.typography.h6.letterSpacing}px;
          font-family: ${props => props.theme.fonts[3]};

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
          padding: 0 ${props => props.theme.spaces[9]}px;
          font-weight: ${props => props.theme.fontWeights[1]};
        }

        td {
          padding: ${props => props.theme.spaces[4]}px 0;
          color: ${props => props.theme.colors.blackShades[6]};
          font-size: ${props => props.theme.typography.p1.fontSize}px;
          line-height: ${props => props.theme.typography.p1.lineHeight}px;
          letter-spacing: ${props => props.theme.typography.p1.letterSpacing}px;
          font-weight: normal;
          font-family: ${props => props.theme.fonts[3]};
          border-bottom: 1px solid ${props => props.theme.colors.blackShades[3]};
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
  }
`;

function Table(props: any) {
  const data = React.useMemo(() => props.data, []);

  const columns = React.useMemo(() => props.columns, []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
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
                      " 🔼"
                    ) : (
                      <DownArrow />
                    )
                  ) : (
                    ""
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
                      {cell.render("Cell")}
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

export default Table;
