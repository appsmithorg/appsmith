import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { Column, useTable, useExpanded, Row } from "react-table";
import { Icon, IconSize, Spinner } from "design-system";
import { Checkbox } from "@blueprintjs/core";
import { HighlightText } from "design-system";
import { getParentId } from "./utils/reactTableUtils";
import EmptyDataState from "components/utils/EmptyDataState";
import { MenuIcons } from "icons/MenuIcons";
import { Colors } from "constants/Colors";
import {
  ApiMethodIcon,
  JsFileIconV2,
} from "pages/Editor/Explorer/ExplorerIcons";
// import { replayHighlightClass } from "globalStyles/portals";

export type RoleProps = {
  tabData: any;
  expanded?: any;
  searchValue?: string;
  noData?: boolean;
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
  width: 100%;
  line-height: 24px;
  &.hover-state {
    .bp3-control-indicator {
      opacity: 0.4;
    }
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
  // margin: 30px 0;
  border-collapse: separate;
  border-spacing: 0;

  thead {
    position: sticky;
    top: 0;
    background: var(--appsmith-color-black-0);
    z-index: 1;
    height: 48px;

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
        max-width: 692px;
      }
    }
  }

  tbody {
    tr {
      &.shown {
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
            padding: 0;

            input {
              display: none;
            }

            .bp3-control-indicator {
              margin: auto;
            }
          }
        }

        &:hover {
          td {
            div {
              background: var(--appsmith-color-black-100);
            }
            &:first-child {
              background: none;

              div {
                background: none;
                .text-wrapper {
                  background: var(--appsmith-color-black-100);
                }
              }
            }
          }
        }
      }
      &.hidden {
        display: none;
      }
    }
  }
`;

const ResourceCellWrapper = styled.div`
  display: flex;
  align-items: center;
  height: 36px;
  // gap: 12px;

  .remixicon-icon {
    height: 24px;
  }

  .text-wrapper {
    text-align: left;
    display: flex;
    width: 100%;
    line-height: 24px;
    align-items: center;
    padding-left: 12px;

    > div:first-child {
      margin: 0 8px 0 0;
    }
  }
`;

const Delimeter = styled.div`
  border-left: 1px solid var(--appsmith-color-black-200);
  line-height: 24px;
  padding-right: 12px;
  text-align: center;
  width: 15px;
  height: 36px;
  margin: 0 12px 0 6px;
`;

const CentralizedWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 250px;
`;

const IconTypes: any = {
  organization: "",
  application: "",
  "page-home": (
    <MenuIcons.DEFAULT_HOMEPAGE_ICON
      color={Colors.GREEN_1}
      height="16"
      width="16"
    />
  ),
  "page-other": (
    <MenuIcons.PAGE_ICON color={Colors.GRAY_700} height="16" width="16" />
  ),
  query: <ApiMethodIcon type="GET" />,
  "js-object": JsFileIconV2,
};

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

// TODO: Performance improvements
function Table({
  columns,
  data,
  isLoading,
  loaderComponent,
  noDataComponent,
  searchValue,
}: {
  columns: any;
  data: any;
  isLoading?: boolean;
  loaderComponent?: JSX.Element;
  noDataComponent?: JSX.Element;
  searchValue?: string;
}) {
  const {
    flatRows,
    getTableBodyProps,
    getTableProps,
    headerGroups,
    prepareRow,
    rows,
    toggleAllRowsExpanded,
    toggleRowExpanded,
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

  const expandedMapRef = useRef<Record<string, boolean> | null>(null);
  const parentMapRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (searchValue && searchValue.trim().length > 0) {
      expandedMapRef.current = findRows();
      if (expandedMapRef.current) {
        toggleAllRowsExpanded(false);
        for (const key in expandedMapRef.current) {
          toggleRowExpanded([key], true);
        }
      }
    } else {
      const initialTreeState = getExpandedTrees(data);
      for (const key in initialTreeState) {
        toggleRowExpanded([key], true);
      }
    }
  }, [searchValue]);

  /**
   * Finds the rows that match the search value and returns a map of the rows that match
   * @returns {Record<string, boolean>} expandedMap - map of expanded rows
   */
  const findRows = (): Record<string, boolean> => {
    const rows = flatRows.filter((row: Row<any>) =>
      row.original.name.includes(searchValue?.toLocaleLowerCase()),
    );
    return buildExpandedMap(rows);
  };

  /**
   * Function to build the expanded map from search results
   * @param rows array of react-table rows
   * @returns map of expanded rows with keys as row ids and values as true just how react-table wants it.
   */
  const buildExpandedMap = (rows: Row<object>[]) => {
    /*
    To build the expanded map, we need to have the row path.
    The row path is the path to the row in the tree.
    Example: If the tree is: [{name: "A", subRows: [{name: "B"}, {name: "C"}]}, {name: "D"}]
    The row path for the first row is "0" and the row path for the second row is "1" and so on.
    The row path for the subRows is again "0.0" and "0.1" and so on.
    So for "C" the row path is 0.0.1.
    So now with this row path "0.0.1" we have to expand all its parent rows and add it in the expanded map.
    Hence this function. And the result will be like this: {"0":true, "0.0":true, "0.0.1":true}
    */
    return rows
      .map((row: Row<object>) => row.id)
      .map((row: string) => {
        return row
          .split(".")
          .reduce(
            (
              rowMap: Record<string, boolean>,
              _row: string,
              index: number,
              array: string[],
            ) => {
              const key = array.slice(0, index + 1).join(".");
              rowMap[key] = true;
              return rowMap;
            },
            {},
          );
      })
      .reduce((result, row) => ({ ...result, ...row }), {});
  };

  /**
   *
   * @param row - table row object
   * @returns {string} className to show or hide the row
   */
  const getRowVisibility = (row: Row): string => {
    /* The expanded map is built from the search results.
       If the row is not in the expanded map, it should be hidden.
       But on click of the row, it should get expanded and show its child rows.
       Since the child rows won't be in the expanded map, I have to check if the parent row is in the expanded map.
       If it is, then I can show the child rows.
       This logic is to show the child rows when the parent row is expanded.
     */
    const parentId = getParentId(row.id, row.depth);

    if (parentId) {
      parentMapRef.current[parentId] = true;
    }

    const shouldHide =
      searchValue &&
      expandedMapRef.current &&
      !expandedMapRef.current[row.id] &&
      !parentMapRef.current[parentId];

    return shouldHide ? "hidden" : "shown";
  };

  return (
    <StyledTable {...getTableProps()} data-testid="t--role-table">
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
          rows.map((row) => {
            prepareRow(row);
            return (
              <tr
                {...row.getRowProps()}
                className={searchValue ? getRowVisibility(row) : "shown"}
                key={row.id}
              >
                {row.cells.map((cell, index) => {
                  return (
                    <td {...cell.getCellProps()} key={index /*cell.row.id*/}>
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
    </StyledTable>
  );
}

export default function RolesTree(props: RoleProps) {
  const { noData, searchValue = "", tabData } = props;
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
              <Icon name="down-arrow" size={IconSize.XL} />
            ) : (
              <Icon name="right-arrow-2" size={IconSize.XL} />
            )}
            <div className="text-wrapper">
              {cellProps.cell.row.original.type
                ? IconTypes[cellProps.cell.row.original.type]
                : null}
              <HighlightText
                highlight={searchValue}
                text={cellProps.cell.row.original.name}
              />
            </div>
          </ResourceCellWrapper>
        ) : (
          <ResourceCellWrapper className="flat-row">
            {cellProps.row.depth ? del : null}
            <div className="text-wrapper">
              {cellProps.cell.row.original.type
                ? IconTypes[cellProps.cell.row.original.type]
                : null}
              <HighlightText
                highlight={searchValue}
                text={cellProps.cell.row.original.name}
              />
            </div>
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

  const data = noData ? [] : tabData.data;

  return (
    <Table columns={columns} data={data} searchValue={props.searchValue} />
  );
}
