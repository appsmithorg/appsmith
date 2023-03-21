/* eslint-disable react/jsx-key */
import * as React from "react";
import { useTable } from "react-table";

export interface KeyValueComponentProps {
  data: Record<string, string>;
}

export function KeyValueComponent(props: KeyValueComponentProps) {
  const columns = React.useMemo(
    () => [
      {
        Header: "Key",
        accessor: "key",
      },
      {
        Header: "Value",
        accessor: "value",
      },
    ],
    [],
  );

  const tableData = React.useMemo(() => {
    return Object.entries(props.data || {}).map(([key, value]) => {
      return {
        key: key,
        value: JSON.stringify(value),
      };
    });
  }, [props.data]);

  // @ts-expect-error: type mismatch
  const tableInstance = useTable({ columns, data: tableData });

  const { getTableBodyProps, getTableProps, headerGroups, prepareRow, rows } =
    tableInstance;

  return (
    <table {...getTableProps()}>
      <thead>
        {
          // Loop over the header rows
          headerGroups.map((headerGroup) => (
            // Apply the header row props
            <tr {...headerGroup.getHeaderGroupProps()}>
              {
                // Loop over the headers in each row
                headerGroup.headers.map((column) => (
                  // Apply the header cell props
                  <th {...column.getHeaderProps()}>
                    {
                      // Render the header
                      column.render("Header")
                    }
                  </th>
                ))
              }
            </tr>
          ))
        }
      </thead>
      {/* Apply the table body props */}
      <tbody {...getTableBodyProps()}>
        {
          // Loop over the table rows
          rows.map((row) => {
            // Prepare the row for display
            prepareRow(row);
            return (
              // Apply the row props
              <tr {...row.getRowProps()}>
                {
                  // Loop over the rows cells
                  row.cells.map((cell) => {
                    // Apply the cell props
                    return (
                      <td {...cell.getCellProps()}>
                        {
                          // Render the cell contents
                          cell.render("Cell")
                        }
                      </td>
                    );
                  })
                }
              </tr>
            );
          })
        }
      </tbody>
    </table>
  );
}
