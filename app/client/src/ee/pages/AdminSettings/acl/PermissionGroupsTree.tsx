import React from "react";
import styled from "styled-components";
import { Column, useTable, useExpanded } from "react-table";
import { Icon } from "components/ads";
import { Checkbox } from "@blueprintjs/core";
// import { replayHighlightClass } from "globalStyles/portals";

export type PermissionGroupProps = {
  tabData: any;
};

type hashtableType = {
  [key: string]: Array<{
    id: string;
    type: string;
    permission: string;
  }>;
};

export const hashtable: hashtableType = {
  "org1-edit": [
    {
      id: "app1",
      type: "app",
      permission: "edit",
    },
    {
      id: "page1",
      type: "page",
      permission: "edit",
    },
    {
      id: "query1",
      type: "query",
      permission: "edit",
    },
  ],
  "org1-create": [
    {
      id: "app1",
      type: "app",
      permission: "create",
    },
    {
      id: "page1",
      type: "page",
      permission: "create",
    },
    {
      id: "query1",
      type: "query",
      permission: "create",
    },
    {
      id: "app1",
      type: "app",
      permission: "edit",
    },
    {
      id: "page1",
      type: "page",
      permission: "edit",
    },
    {
      id: "query1",
      type: "query",
      permission: "edit",
    },
    {
      id: "app1",
      type: "app",
      permission: "delete",
    },
    {
      id: "page1",
      type: "page",
      permission: "delete",
    },
    {
      id: "query1",
      type: "query",
      permission: "delete",
    },
    {
      id: "app1",
      type: "app",
      permission: "view",
    },
    {
      id: "page1",
      type: "page",
      permission: "view",
    },
    {
      id: "query1",
      type: "query",
      permission: "view",
    },
    {
      id: "org1",
      type: "org",
      permission: "edit",
    },
    {
      id: "org1",
      type: "org",
      permission: "view",
    },
    {
      id: "org1",
      type: "org",
      permission: "delete",
    },
  ],
  "org200-create": [
    {
      id: "org200",
      type: "org",
      permission: "edit",
    },
    {
      id: "org200",
      type: "org",
      permission: "view",
    },
    {
      id: "org200",
      type: "org",
      permission: "delete",
    },
    {
      id: "app101",
      type: "app",
      permission: "create",
    },
    {
      id: "app101",
      type: "app",
      permission: "edit",
    },
    {
      id: "app101",
      type: "app",
      permission: "delete",
    },
    {
      id: "app101",
      type: "app",
      permission: "view",
    },
    {
      id: "page101",
      type: "page",
      permission: "create",
    },
    {
      id: "page101",
      type: "page",
      permission: "edit",
    },
    {
      id: "page101",
      type: "page",
      permission: "delete",
    },
    {
      id: "page101",
      type: "page",
      permission: "view",
    },
    {
      id: "query101",
      type: "query",
      permission: "create",
    },
    {
      id: "query101",
      type: "query",
      permission: "edit",
    },
    {
      id: "query101",
      type: "query",
      permission: "delete",
    },
    {
      id: "query101",
      type: "query",
      permission: "view",
    },
    {
      id: "app102",
      type: "app",
      permission: "create",
    },
    {
      id: "app102",
      type: "app",
      permission: "edit",
    },
    {
      id: "app102",
      type: "app",
      permission: "delete",
    },
    {
      id: "app102",
      type: "app",
      permission: "view",
    },
    {
      id: "page102",
      type: "page",
      permission: "create",
    },
    {
      id: "page102",
      type: "page",
      permission: "edit",
    },
    {
      id: "page102",
      type: "page",
      permission: "delete",
    },
    {
      id: "page102",
      type: "page",
      permission: "view",
    },
    {
      id: "query102",
      type: "query",
      permission: "create",
    },
    {
      id: "query102",
      type: "query",
      permission: "edit",
    },
    {
      id: "query102",
      type: "query",
      permission: "delete",
    },
    {
      id: "query102",
      type: "query",
      permission: "view",
    },
    {
      id: "query1020",
      type: "query",
      permission: "create",
    },
    {
      id: "query1020",
      type: "query",
      permission: "edit",
    },
    {
      id: "query1020",
      type: "query",
      permission: "delete",
    },
    {
      id: "query1020",
      type: "query",
      permission: "view",
    },
    {
      id: "app103",
      type: "app",
      permission: "create",
    },
    {
      id: "app103",
      type: "app",
      permission: "edit",
    },
    {
      id: "app103",
      type: "app",
      permission: "delete",
    },
    {
      id: "app103",
      type: "app",
      permission: "view",
    },
    {
      id: "page103",
      type: "page",
      permission: "create",
    },
    {
      id: "page103",
      type: "page",
      permission: "edit",
    },
    {
      id: "page103",
      type: "page",
      permission: "delete",
    },
    {
      id: "page103",
      type: "page",
      permission: "view",
    },
    {
      id: "query103",
      type: "query",
      permission: "create",
    },
    {
      id: "query103",
      type: "query",
      permission: "edit",
    },
    {
      id: "query103",
      type: "query",
      permission: "delete",
    },
    {
      id: "query103",
      type: "query",
      permission: "view",
    },
    {
      id: "query1030",
      type: "query",
      permission: "create",
    },
    {
      id: "query1030",
      type: "query",
      permission: "edit",
    },
    {
      id: "query1030",
      type: "query",
      permission: "delete",
    },
    {
      id: "query1030",
      type: "query",
      permission: "view",
    },
    {
      id: "app104",
      type: "app",
      permission: "create",
    },
    {
      id: "app104",
      type: "app",
      permission: "edit",
    },
    {
      id: "app104",
      type: "app",
      permission: "delete",
    },
    {
      id: "app104",
      type: "app",
      permission: "view",
    },
    {
      id: "page104",
      type: "page",
      permission: "create",
    },
    {
      id: "page104",
      type: "page",
      permission: "edit",
    },
    {
      id: "page104",
      type: "page",
      permission: "delete",
    },
    {
      id: "page104",
      type: "page",
      permission: "view",
    },
    {
      id: "query104",
      type: "query",
      permission: "create",
    },
    {
      id: "query104",
      type: "query",
      permission: "edit",
    },
    {
      id: "query104",
      type: "query",
      permission: "delete",
    },
    {
      id: "query104",
      type: "query",
      permission: "view",
    },
    {
      id: "query1040",
      type: "query",
      permission: "create",
    },
    {
      id: "query1040",
      type: "query",
      permission: "edit",
    },
    {
      id: "query1040",
      type: "query",
      permission: "delete",
    },
    {
      id: "query1040",
      type: "query",
      permission: "view",
    },
    {
      id: "app105",
      type: "app",
      permission: "create",
    },
    {
      id: "app105",
      type: "app",
      permission: "edit",
    },
    {
      id: "app105",
      type: "app",
      permission: "delete",
    },
    {
      id: "app105",
      type: "app",
      permission: "view",
    },
    {
      id: "page105",
      type: "page",
      permission: "create",
    },
    {
      id: "page105",
      type: "page",
      permission: "edit",
    },
    {
      id: "page105",
      type: "page",
      permission: "delete",
    },
    {
      id: "page105",
      type: "page",
      permission: "view",
    },
    {
      id: "query105",
      type: "query",
      permission: "create",
    },
    {
      id: "query105",
      type: "query",
      permission: "edit",
    },
    {
      id: "query105",
      type: "query",
      permission: "delete",
    },
    {
      id: "query105",
      type: "query",
      permission: "view",
    },
    {
      id: "query1050",
      type: "query",
      permission: "create",
    },
    {
      id: "query1050",
      type: "query",
      permission: "edit",
    },
    {
      id: "query1050",
      type: "query",
      permission: "delete",
    },
    {
      id: "query1050",
      type: "query",
      permission: "view",
    },
    {
      id: "app106",
      type: "app",
      permission: "create",
    },
    {
      id: "app106",
      type: "app",
      permission: "edit",
    },
    {
      id: "app106",
      type: "app",
      permission: "delete",
    },
    {
      id: "app106",
      type: "app",
      permission: "view",
    },
    {
      id: "page106",
      type: "page",
      permission: "create",
    },
    {
      id: "page106",
      type: "page",
      permission: "edit",
    },
    {
      id: "page106",
      type: "page",
      permission: "delete",
    },
    {
      id: "page106",
      type: "page",
      permission: "view",
    },
    {
      id: "page107",
      type: "page",
      permission: "create",
    },
    {
      id: "page107",
      type: "page",
      permission: "edit",
    },
    {
      id: "page107",
      type: "page",
      permission: "delete",
    },
    {
      id: "page107",
      type: "page",
      permission: "view",
    },
    {
      id: "query106",
      type: "query",
      permission: "create",
    },
    {
      id: "query106",
      type: "query",
      permission: "edit",
    },
    {
      id: "query106",
      type: "query",
      permission: "delete",
    },
    {
      id: "query106",
      type: "query",
      permission: "view",
    },
    {
      id: "query1060",
      type: "query",
      permission: "create",
    },
    {
      id: "query1060",
      type: "query",
      permission: "edit",
    },
    {
      id: "query1060",
      type: "query",
      permission: "delete",
    },
    {
      id: "query1060",
      type: "query",
      permission: "view",
    },
    {
      id: "query107",
      type: "query",
      permission: "create",
    },
    {
      id: "query107",
      type: "query",
      permission: "edit",
    },
    {
      id: "query107",
      type: "query",
      permission: "delete",
    },
    {
      id: "query107",
      type: "query",
      permission: "view",
    },
    {
      id: "query1070",
      type: "query",
      permission: "create",
    },
    {
      id: "query1070",
      type: "query",
      permission: "edit",
    },
    {
      id: "query1070",
      type: "query",
      permission: "delete",
    },
    {
      id: "query1070",
      type: "query",
      permission: "view",
    },
    {
      id: "app108",
      type: "app",
      permission: "create",
    },
    {
      id: "app108",
      type: "app",
      permission: "edit",
    },
    {
      id: "app108",
      type: "app",
      permission: "delete",
    },
    {
      id: "app108",
      type: "app",
      permission: "view",
    },
    {
      id: "page108",
      type: "page",
      permission: "create",
    },
    {
      id: "page108",
      type: "page",
      permission: "edit",
    },
    {
      id: "page108",
      type: "page",
      permission: "delete",
    },
    {
      id: "page108",
      type: "page",
      permission: "view",
    },
    {
      id: "query108",
      type: "query",
      permission: "create",
    },
    {
      id: "query108",
      type: "query",
      permission: "edit",
    },
    {
      id: "query108",
      type: "query",
      permission: "delete",
    },
    {
      id: "query108",
      type: "query",
      permission: "view",
    },
    {
      id: "query1080",
      type: "query",
      permission: "create",
    },
    {
      id: "query1080",
      type: "query",
      permission: "edit",
    },
    {
      id: "query1080",
      type: "query",
      permission: "delete",
    },
    {
      id: "query1080",
      type: "query",
      permission: "view",
    },
    {
      id: "app109",
      type: "app",
      permission: "create",
    },
    {
      id: "app109",
      type: "app",
      permission: "edit",
    },
    {
      id: "app109",
      type: "app",
      permission: "delete",
    },
    {
      id: "app109",
      type: "app",
      permission: "view",
    },
    {
      id: "page109",
      type: "page",
      permission: "create",
    },
    {
      id: "page109",
      type: "page",
      permission: "edit",
    },
    {
      id: "page109",
      type: "page",
      permission: "delete",
    },
    {
      id: "page109",
      type: "page",
      permission: "view",
    },
    {
      id: "query109",
      type: "query",
      permission: "create",
    },
    {
      id: "query109",
      type: "query",
      permission: "edit",
    },
    {
      id: "query109",
      type: "query",
      permission: "delete",
    },
    {
      id: "query109",
      type: "query",
      permission: "view",
    },
    {
      id: "query1090",
      type: "query",
      permission: "create",
    },
    {
      id: "query1090",
      type: "query",
      permission: "edit",
    },
    {
      id: "query1090",
      type: "query",
      permission: "delete",
    },
    {
      id: "query1090",
      type: "query",
      permission: "view",
    },
    {
      id: "app109",
      type: "app",
      permission: "view",
    },
    {
      id: "page109",
      type: "page",
      permission: "view",
    },
    {
      id: "query109",
      type: "query",
      permission: "view",
    },
    {
      id: "app110",
      type: "app",
      permission: "create",
    },
    {
      id: "app110",
      type: "app",
      permission: "edit",
    },
    {
      id: "app110",
      type: "app",
      permission: "delete",
    },
    {
      id: "app110",
      type: "app",
      permission: "view",
    },
    {
      id: "page110",
      type: "page",
      permission: "create",
    },
    {
      id: "page110",
      type: "page",
      permission: "edit",
    },
    {
      id: "page110",
      type: "page",
      permission: "delete",
    },
    {
      id: "page110",
      type: "page",
      permission: "view",
    },
    {
      id: "query110",
      type: "query",
      permission: "create",
    },
    {
      id: "query110",
      type: "query",
      permission: "edit",
    },
    {
      id: "query110",
      type: "query",
      permission: "delete",
    },
    {
      id: "query110",
      type: "query",
      permission: "view",
    },
    {
      id: "query1010",
      type: "query",
      permission: "create",
    },
    {
      id: "query1010",
      type: "query",
      permission: "edit",
    },
    {
      id: "query1010",
      type: "query",
      permission: "delete",
    },
    {
      id: "query1010",
      type: "query",
      permission: "view",
    },

    {
      id: "app111",
      type: "app",
      permission: "create",
    },
    {
      id: "app111",
      type: "app",
      permission: "edit",
    },
    {
      id: "app111",
      type: "app",
      permission: "delete",
    },
    {
      id: "app111",
      type: "app",
      permission: "view",
    },
    {
      id: "page111",
      type: "page",
      permission: "create",
    },
    {
      id: "page111",
      type: "page",
      permission: "edit",
    },
    {
      id: "page111",
      type: "page",
      permission: "delete",
    },
    {
      id: "page111",
      type: "page",
      permission: "view",
    },
    {
      id: "query111",
      type: "query",
      permission: "create",
    },
    {
      id: "query111",
      type: "query",
      permission: "edit",
    },
    {
      id: "query111",
      type: "query",
      permission: "delete",
    },
    {
      id: "query111",
      type: "query",
      permission: "view",
    },
    {
      id: "query1011",
      type: "query",
      permission: "create",
    },
    {
      id: "query1011",
      type: "query",
      permission: "edit",
    },
    {
      id: "query1011",
      type: "query",
      permission: "delete",
    },
    {
      id: "query1011",
      type: "query",
      permission: "view",
    },
  ],
};

const CheckboxWrapper = styled.div`
  display: inline-block;

  &.hover-state {
    opacity: 0.4;
  }

  input:checked + .bp3-control-indicator::before,
  input:indeterminate + .bp3-control-indicator::before {
    background-color: var(--appsmith-color-black-700);
  }
`;

/*const StyledCheckbox = styled(Checkbox)<{ indeterminate: boolean }>`
  &.hover-state .${replayHighlightClass} {
    opacity: 0.4;
  }

  input:checked + .${replayHighlightClass} {
    background-color: var(--appsmith-color-black-700);
  }

  .${replayHighlightClass} {
    width: 14px;
    height: 14px;
    border: 1.8px solid var(--appsmith-color-black-700);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    &:after {
      width: 4px;
      height: 8px;
      left: 3.5px;
      ${(props) =>
        props.indeterminate
          ? `
        border-width: 0 2px 0px 0px;
        transform: rotate(90deg);
      `
          : ``}
    }
`;*/

const StyledTable = styled.table`
  width: 100%;
  text-align: left;
  margin: 30px 0;
  //border-collapse: separate;
  //border-spacing: 0 20px;

  thead {
    th {
      color: var(--appsmith-color-black-700);
      text-transform: capitalize;
      font-size: 16px;
      font-weight: 500;
      line-height: 1.5;
      letter-spacing: -0.24px;
      text-align: center;

      &:first-child {
        text-align: left;
      }
    }
  }

  tbody {
    tr {
      height: 24px;

      td {
        color: var(--appsmith-color-black-800);
        font-size: 14px;
        font-weight: normal;
        line-height: 1.31;
        letter-spacing: -0.24px;
        padding: 0;
        text-align: center;

        label {
          display: unset;
          padding-left: 100%;
        }
      }

      &:hover {
        background: var(--appsmith-color-black-100);
      }
    }
  }
`;

const ResourceName = styled.div``;

const ResourceCellWrapper = styled.div`
  display: flex;
  align-items: center;
  height: 36px;

  .remixicon-icon {
    height: 24px;
  }

  ${ResourceName} {
    padding-left: 12px;
  }
`;

const Delimeter = styled.div`
  // background: #fff;
  border-left: 1px solid var(--appsmith-color-black-200);
  line-height: 24px;
  padding-right: 28px;
  text-align: center;
  width: 15px;
  height: 36px;
  margin-left: 6px;
`;

let openTrees: Record<string, boolean> = {};
const getExpandedTrees = (data: any, pIndex?: string) => {
  data.map((item: any, index: any) => {
    if (item.treeOpen) {
      openTrees = {
        ...openTrees,
        [pIndex ? `${pIndex}.${index}` : `${index}`]: true,
      };
      if (item.subRows?.length > 0) {
        const subTree = getExpandedTrees(
          item.subRows,
          pIndex ? `${pIndex}.${index}` : `${index}`,
        );
        openTrees = {
          ...openTrees,
          ...subTree,
        };
      }
    }
  });
  return openTrees;
};

function Table({ columns, data }: { columns: any; data: any }) {
  const {
    getTableBodyProps,
    getTableProps,
    headerGroups,
    prepareRow,
    rows,
  } = useTable(
    {
      columns,
      data,
      preExpandedRows: data,
      initialState: {
        expanded: getExpandedTrees(data),
      },
    },
    useExpanded,
  );

  return (
    <StyledTable {...getTableProps()}>
      <thead className="table-header">
        {headerGroups.map((headerGroup, index) => (
          <tr {...headerGroup.getHeaderGroupProps()} key={index}>
            {headerGroup.headers.map((column, i) => (
              <th {...column.getHeaderProps()} key={i}>
                {column.render("Header")}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()} key={i}>
              {row.cells.map((cell, index) => {
                return (
                  <td {...cell.getCellProps()} key={index /*cell.row.id*/}>
                    {cell.render("Cell")}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </StyledTable>
  );
}

export default function PermissionGroupsTree(props: PermissionGroupProps) {
  const { tabData } = props;
  const columns: Array<Column> = [
    {
      Header: "Resource Permissions",
      accessor: "Resource Permissions",
      Cell: function CellContent(cellProps: any) {
        const del: JSX.Element[] = [];
        for (let i = 0; i < cellProps.row.depth; i++) {
          del.push(<Delimeter key={i} />);
        }

        return cellProps.row.canExpand ? (
          <ResourceCellWrapper {...cellProps.row.getToggleRowExpandedProps()}>
            {cellProps.row.depth ? del : null}
            {cellProps.row.isExpanded ? (
              <Icon name="down-arrow" />
            ) : (
              <Icon name="right-arrow-2" />
            )}
            <ResourceName>{cellProps.cell.row.original.name}</ResourceName>
          </ResourceCellWrapper>
        ) : (
          <ResourceCellWrapper>
            {cellProps.row.depth ? del : null}
            <ResourceName>{cellProps.cell.row.original.name}</ResourceName>
          </ResourceCellWrapper>
        );
      },
    },
    ...tabData.permission.map((column: any, index: any) => ({
      Header: column,
      accessor: column,
      Cell: function CellContent(cellProps: any) {
        const removeHoverClass = (id: string) => {
          const values = hashtable[id];

          document.getElementById(id)?.classList.remove("hover-state");

          values?.map((item: any) => {
            document
              .getElementById(`${item.id}-${item.permission}`)
              ?.classList.remove("hover-state");
          });
        };

        const addHoverClass = (id: string) => {
          const values = hashtable[id];

          document.getElementById(id)?.classList.add("hover-state");

          values?.map((item: any) => {
            document
              .getElementById(`${item.id}-${item.permission}`)
              ?.classList.add("hover-state");
          });
        };
        return (
          <CheckboxWrapper
            data-testid={`${cellProps.cell.row.original.id}-${column}`}
            id={`${cellProps.cell.row.original.id}-${column}`}
            onMouseOut={() =>
              removeHoverClass(`${cellProps.cell.row.original.id}-${column}`)
            }
            onMouseOver={() =>
              addHoverClass(`${cellProps.cell.row.original.id}-${column}`)
            }
          >
            {cellProps.cell.row.original.permission[index] !== 0 ? (
              <Checkbox
                defaultChecked={
                  [1, 3].indexOf(
                    cellProps.cell.row.original.permission[index],
                  ) > -1
                    ? true
                    : false
                }
                // id={`${cellProps.cell.row.original.id}-${column}`}
                indeterminate={
                  cellProps.cell.row.original.permission[index] === 3
                    ? true
                    : false
                }
              />
            ) : (
              <div>&nbsp;</div>
            )}
          </CheckboxWrapper>
        );
      },
    })),
  ];

  const data = tabData.data;

  return <Table columns={columns} data={data} />;
}
