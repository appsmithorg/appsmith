import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Column, useTable, useExpanded } from "react-table";
import { Checkbox, Icon, IconSize, Spinner } from "design-system";
import { HighlightText } from "design-system";
import { MenuIcons } from "icons/MenuIcons";
import { Colors } from "constants/Colors";
import {
  ApiMethodIcon,
  JsFileIconV2,
} from "pages/Editor/Explorer/ExplorerIcons";
import { RoleTreeProps } from "./types";
import { EmptyDataState, EmptySearchResult, SaveButtonBar } from "./components";
import _ from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { getIconLocations } from "@appsmith/selectors/aclSelectors";
import { updateRoleById } from "@appsmith/actions/aclActions";

let dataToBeSent: any[] = [];

const CheckboxWrapper = styled.div`
  width: 100%;
  height: 36px;
  &.hover-state {
    .design-system-checkbox {
      span {
        opacity: 0.4;
      }
    }
  }

  .design-system-checkbox {
    > div {
      display: none;
    }

    span {
      top: 0px;
      left: 50%;
      width: 16px;
      height: 16px;
      transform: translate(-50%, 0);

      &:after {
        width: 5px;
        height: 10px;
      }
    }
  }
`;

const StyledTable = styled.table`
  width: 100%;
  text-align: left;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;

  thead {
    position: sticky;
    top: 0;
    background: var(--appsmith-color-black-0);
    z-index: 1;
    height: 40px;

    th {
      color: var(--appsmith-color-black-700);
      text-transform: capitalize;
      font-size: 16px;
      font-weight: 500;
      line-height: 1.5;
      letter-spacing: -0.24px;
      text-align: center;
      width: 10%;

      &:first-child {
        text-align: left;
        max-width: 692px;
        width: auto;
      }
    }
  }

  tbody {
    tr {
      height: 44px;
      td {
        color: var(--appsmith-color-black-800);
        font-size: 14px;
        font-weight: normal;
        line-height: 1.31;
        letter-spacing: -0.24px;
        padding: 0;
        text-align: center;

        label {
          padding: 0;
          top: 8px;

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
`;

const ResourceCellWrapper = styled.div`
  display: flex;
  align-items: center;
  height: 36px;

  .remixicon-icon {
    height: 24px;
  }

  .text-wrapper {
    text-align: left;
    display: flex;
    width: 100%;
    align-items: center;
    padding-left: 12px;
    height: 100%;
    overflow: hidden;

    > div:first-child {
      margin: 0 8px 0 0;
    }

    img {
      margin: 0 8px 0 0;
      width: 16px;
      height: 16px;
    }

    span {
      display: -webkit-inline-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      text-overflow: ellipsis;
    }
  }
`;

const Delimeter = styled.div`
  border-left: 1px solid var(--appsmith-color-black-200);
  line-height: 24px;
  padding-right: 12px;
  text-align: center;
  width: 15px;
  height: 44px;
  margin: 0 12px 0 6px;
`;

const CentralizedWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 250px;
`;

const TableWrapper = styled.div<{ isSaving?: boolean }>`
  overflow-y: scroll;
  ${({ isSaving }) =>
    isSaving
      ? `height: calc(100% - 84px); margin-bottom: 16px;`
      : `height: 100%;`}
`;

const IconTypes: any = {
  HomePage: (
    <MenuIcons.DEFAULT_HOMEPAGE_ICON
      color={Colors.GREEN_1}
      height="16"
      width="16"
    />
  ),
  NewPage: (
    <MenuIcons.PAGE_ICON color={Colors.GRAY_700} height="16" width="16" />
  ),
  NewAction: <ApiMethodIcon type="GET" />,
  ActionCollection: JsFileIconV2,
};

function Table({
  columns,
  data,
  filteredData,
  isLoading,
  loaderComponent,
  noDataComponent,
  searchValue,
  updateMyData,
  updateTabCount,
}: {
  columns: any;
  data: any;
  filteredData: any;
  isLoading?: boolean;
  loaderComponent?: JSX.Element;
  noDataComponent?: JSX.Element;
  searchValue?: string;
  updateMyData?: (value: any, cellId: string, rowId: any) => void;
  updateTabCount?: (val: number) => void;
}) {
  const {
    flatRows,
    getTableBodyProps,
    getTableProps,
    headerGroups,
    prepareRow,
    rows,
    toggleAllRowsExpanded,
  } = useTable(
    {
      autoResetExpanded: false,
      columns,
      data,
      preExpandedRows: data,
      updateMyData,
    },
    useExpanded,
  );

  useEffect(() => {
    if (searchValue !== "") {
      updateTabCount?.(
        flatRows.filter((item: any) =>
          item.values?.name?.toLowerCase().includes(searchValue?.toLowerCase()),
        ).length,
      );
      toggleAllRowsExpanded(true);
    }
  }, [flatRows, searchValue]);

  const getRowVisibility = (row: any): string => {
    let shouldHide = true;
    if (JSON.stringify(filteredData).indexOf(row.original.id) > -1) {
      shouldHide = false;
    }
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
                    <td {...cell.getCellProps()} key={index}>
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
                {searchValue !== "" ? (
                  <EmptySearchResult />
                ) : noDataComponent ? (
                  noDataComponent
                ) : (
                  <EmptyDataState page="entities" />
                )}
              </CentralizedWrapper>
            </td>
          </tr>
        )}
      </tbody>
    </StyledTable>
  );
}

export const makeData = (data: any, isMultiple = false) => {
  const computedData = data.map((dt: any) => {
    return dt?.entities?.map((d: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { children, editable, enabled, ...restData } = d;
      return {
        ...restData,
        type: dt.type,
        ...(dt.type === "Header"
          ? {
              id: "Header",
            }
          : { permissions: enabled }),
        ...(d.children
          ? {
              subRows:
                Array.isArray(children) && children.length > 1
                  ? makeData(children, true)
                  : makeData(children),
            }
          : {}),
      };
    });
  });
  return isMultiple ? computedData.flat(1) : computedData[0];
};

export function getSearchData(data: any, searchValue: string) {
  return data.filter((item: any) => {
    const nameIncludesSearchValue = item.name
      .toLowerCase()
      .includes(searchValue.toLowerCase());
    if (item.subRows && !nameIncludesSearchValue) {
      item.subRows = getSearchData(item.subRows, searchValue);
    }
    return item.subRows?.length > 0 || nameIncludesSearchValue;
  });
}

export function getEntireMap(hoverMap: any, key: string, includeSelf = true) {
  const currentKeyMap = hoverMap?.[key] || [];
  let finalMap: any[] = includeSelf
    ? [
        {
          id: key.split("_")[0],
          p: key.split("_")[1],
        },
      ]
    : [];
  for (const map of currentKeyMap) {
    finalMap = _.unionWith(
      finalMap,
      getEntireMap(hoverMap, `${map?.id}_${map?.p}`),
      _.isEqual,
    );
  }
  return finalMap;
}

export function traverseSubRows(subrows: any[], map: any): any {
  return subrows?.some((sr: any) => {
    return sr.id === map.id || (sr.subRows && traverseSubRows(sr.subRows, map));
  });
}

export function updateDataToBeSent(row: any, mapPIndex: number, value: any) {
  const replaceDataIndex = dataToBeSent.findIndex(
    (a: any) => a.id === row.id && a.name === row.name,
  );
  if (replaceDataIndex > -1) {
    dataToBeSent[replaceDataIndex] = {
      id: row.id,
      permissions:
        mapPIndex !== -1
          ? row?.permissions?.map((r: number, rI: number) => {
              return rI === mapPIndex && r !== -1 ? (value ? 1 : 0) : r;
            })
          : row?.permissions,
      type: row.type,
      name: row.name,
    };
  } else {
    dataToBeSent.push({
      id: row.id,
      permissions:
        mapPIndex !== -1
          ? row?.permissions?.map((r: number, rI: number) => {
              return rI === mapPIndex && r !== -1 ? (value ? 1 : 0) : r;
            })
          : row?.permissions,
      type: row.type,
      name: row.name,
    });
  }
}

export function updateSubRows(
  map: any,
  rows: any[],
  mapPIndex: number,
  value: any,
): any {
  const returnData = rows.map((subRow: any) => {
    if (map.id === subRow.id) {
      if (subRow.type !== "Header") {
        updateDataToBeSent(subRow, mapPIndex, value);
      }
      return {
        ...subRow,
        permissions: subRow?.permissions?.map((r: number, rI: number) => {
          return rI === mapPIndex && r !== -1 ? (value ? 1 : 0) : r;
        }),
      };
    } else {
      if (
        (traverseSubRows(subRow.subRows, map) || !subRow.subRows) &&
        !dataToBeSent.some((a) => a.id === subRow.id) &&
        subRow.type !== "Header"
      ) {
        updateDataToBeSent(subRow, mapPIndex, value);
      }
      return subRow.subRows
        ? {
            ...subRow,
            subRows: traverseSubRows(subRow.subRows, map)
              ? updateSubRows(map, subRow.subRows, mapPIndex, value)
              : subRow.subRows,
          }
        : subRow;
    }
  });
  return returnData;
}

export function updateCheckbox(
  rowData: any,
  value: any,
  hoverMap: any[],
  permissions: any,
) {
  let updatedRow: any = rowData;

  for (const map of hoverMap) {
    const mapPIndex = permissions.indexOf(map.p);
    updatedRow = {
      ...updatedRow,
      ...(map.id === updatedRow.id && updatedRow.permissions
        ? {
            permissions: updatedRow?.permissions?.map(
              (r: number, rI: number) => {
                return rI === mapPIndex && r !== -1 ? (value ? 1 : 0) : r;
              },
            ),
          }
        : {}),
      ...(updatedRow.subRows
        ? {
            subRows: traverseSubRows(updatedRow.subRows, map)
              ? updateSubRows(map, updatedRow.subRows, mapPIndex, value)
              : updatedRow.subRows,
          }
        : {}),
    };
  }
  if (updatedRow.type !== "Header") {
    updateDataToBeSent(updatedRow, -1, value);
  }
  return updatedRow;
}

export function updateData(
  oldData: any,
  newValue: any,
  cellId: string,
  rowId: string,
  tabData: any,
) {
  const updatedData = [...oldData];
  const currentCellId = cellId.split("_");

  const rowIdArray: string[] = rowId.split(".");
  const rowDataToUpdate = oldData.find(
    (d: any, i: number) => i === parseInt(rowIdArray[0]),
  );

  if (rowDataToUpdate) {
    if (currentCellId[0] === rowDataToUpdate.id) {
      const { hoverMap, permissions } = tabData;
      updatedData[parseInt(rowIdArray[0])] = updateCheckbox(
        rowDataToUpdate,
        newValue,
        getEntireMap(hoverMap, cellId),
        permissions,
      );
    } else if (updatedData[parseInt(rowIdArray[0])]?.subRows) {
      const subRowId = rowIdArray.slice(1).join(".");
      updatedData[parseInt(rowIdArray[0])] = {
        ...updatedData[parseInt(rowIdArray[0])],
        subRows: updateData(
          updatedData[parseInt(rowIdArray[0])]?.subRows,
          newValue,
          cellId,
          subRowId,
          tabData,
        ),
      };
    }
  }
  return updatedData;
}

export const getIcon = (iconLocations: any[], pluginId: string) => {
  const icon = iconLocations.find((d) => d.id === pluginId);
  return <img alt={icon.name} src={icon.iconLocation} />;
};

export default function RolesTree(props: RoleTreeProps) {
  const { roleId, searchValue = "", tabData } = props;
  const [filteredData, setFilteredData] = useState([]);
  const dataFromProps = makeData([tabData?.data]) || [];
  const [data, setData] = useState(dataFromProps);
  const [isSaving, setIsSaving] = useState(false);
  const iconLocations = useSelector(getIconLocations);
  const dispatch = useDispatch();

  useEffect(() => {
    dataToBeSent = [];
  }, []);

  useEffect(() => {
    setData(dataFromProps);
  }, [tabData]);

  useEffect(() => {
    if (searchValue && searchValue.trim().length > 0) {
      const currentData = JSON.parse(JSON.stringify(data));
      const result = getSearchData(currentData, searchValue);
      setFilteredData(result);
    } else {
      setFilteredData([]);
    }
  }, [searchValue]);

  useEffect(() => {
    if (JSON.stringify(data) === JSON.stringify(dataFromProps)) {
      setIsSaving(false);
    }
  }, [data]);

  const columns: Array<Column> = [
    {
      Header: "Resource Permissions",
      accessor: "name",
      Cell: function CellContent(cellProps: any) {
        const row = cellProps.cell.row.original;

        const icon =
          row.pluginId && iconLocations.length > 0
            ? getIcon(iconLocations, row.pluginId)
            : row.type
            ? IconTypes[
                row.type === "NewPage" && row.isDefault ? "HomePage" : row.type
              ]
            : null;

        const del: JSX.Element[] = [];
        for (let i = 0; i < cellProps.row.depth; i++) {
          del.push(<Delimeter key={i} />);
        }

        return cellProps.row.canExpand ? (
          <ResourceCellWrapper
            {...cellProps.row.getToggleRowExpandedProps({ title: undefined })}
          >
            {cellProps.row.depth ? del : null}
            {cellProps.row.isExpanded ? (
              <Icon name="down-arrow" size={IconSize.XL} />
            ) : (
              <Icon name="right-arrow-2" size={IconSize.XL} />
            )}
            <div className="text-wrapper">
              {icon}
              <HighlightText highlight={searchValue} text={row.name} />
            </div>
          </ResourceCellWrapper>
        ) : (
          <ResourceCellWrapper className="flat-row">
            {cellProps.row.depth ? del : null}
            <div className="text-wrapper">
              {icon}
              <HighlightText highlight={searchValue} text={row.name} />
            </div>
          </ResourceCellWrapper>
        );
      },
    },
    ...tabData?.permissions?.map((column: any, i: any) => ({
      Header: column.replace("_", " "),
      accessor: `permissions[${i}]`,
      Cell: function CellContent(cellProps: any) {
        const {
          row: { id: rowId },
          updateMyData,
          value,
        } = cellProps;
        const rowData = cellProps.cell.row.original;
        const [isChecked, setIsChecked] = React.useState(
          value === 1 ? true : false,
        );

        const removeHoverClass = (id: string, rIndex: number) => {
          const values = getEntireMap(tabData.hoverMap, id);
          for (const val of values) {
            const allEl = document.querySelectorAll(
              `[data-cellId="${val.id}_${val.p}"]`,
            );
            const el =
              allEl.length > 1
                ? allEl[rIndex]
                : allEl[0]?.getAttribute("data-rowid") === rIndex.toString()
                ? allEl[0]
                : null;
            el?.classList.remove("hover-state");
          }
        };

        const addHoverClass = (id: string, rIndex: number) => {
          const values = getEntireMap(tabData.hoverMap, id);
          for (const val of values) {
            const allEl = document.querySelectorAll(
              `[data-cellId="${val.id}_${val.p}"]`,
            );
            const el =
              allEl.length > 1
                ? allEl[rIndex]
                : allEl[0]?.getAttribute("data-rowid") === rIndex.toString()
                ? allEl[0]
                : null;
            el?.classList.add("hover-state");
          }
        };

        const onChangeHandler = (e: any, cellId: string) => {
          setIsChecked(e);
          updateMyData(e, cellId, rowId);
        };

        return rowData.permissions && rowData.permissions[i] !== -1 ? (
          <CheckboxWrapper
            data-cellid={`${rowData.id}_${column}`}
            data-rowid={parseInt(rowId.split(".")[0])}
            data-testid={`${rowData.id}_${column}`}
            onMouseOut={() =>
              removeHoverClass(
                `${rowData.id}_${column}`,
                parseInt(rowId.split(".")[0]),
              )
            }
            onMouseOver={() =>
              addHoverClass(
                `${rowData.id}_${column}`,
                parseInt(rowId.split(".")[0]),
              )
            }
          >
            <Checkbox
              className="design-system-checkbox"
              isDefaultChecked={isChecked}
              onCheckChange={(value: boolean) =>
                onChangeHandler(value, `${rowData.id}_${column}`)
              }
              value={`${rowData.id}_${column}`}
            />
          </CheckboxWrapper>
        ) : (
          <CheckboxWrapper
            data-cellid={`${rowData.id}_${column}`}
            data-rowid={parseInt(rowId.split(".")[0])}
          >
            &nbsp;
          </CheckboxWrapper>
        );
      },
    })),
  ];

  const onSaveChanges = () => {
    dispatch(updateRoleById(props.currentTabName, dataToBeSent, roleId));
    setIsSaving(false);
    dataToBeSent = [];
  };

  const onClearChanges = () => {
    setIsSaving(false);
    setData(dataFromProps);
    dataToBeSent = [];
  };

  /* We need to keep the table from resetting the pageIndex when we
     Update data. So we can keep track of that flag with a ref.

     When our cell renderer calls updateMyData, we'll use
     the rowIndex, columnId and new value to update the
     original data */
  const updateMyData = (newValue: any, cellId: string, rowId: any) => {
    setIsSaving(true);
    setData((old: any[]) => {
      return updateData(old, newValue, cellId, rowId, tabData);
    });
  };

  return (
    <>
      <TableWrapper isSaving={isSaving}>
        <Table
          columns={columns}
          data={data}
          filteredData={filteredData}
          searchValue={props.searchValue}
          updateMyData={updateMyData}
          updateTabCount={props.updateTabCount}
        />
      </TableWrapper>
      {isSaving && (
        <SaveButtonBar onClear={onClearChanges} onSave={onSaveChanges} />
      )}
    </>
  );
}
