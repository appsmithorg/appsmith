import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import type { Column } from "react-table";
import { useTable, useExpanded } from "react-table";
import { HighlightText } from "design-system-old";
import { MenuIcons } from "icons/MenuIcons";
import type { RoleProps, RoleTreeProps, TabProps } from "./types";
import {
  EmptyDataState,
  EmptySearchResult,
  SaveButtonBar,
  StyledTabs,
} from "./components";
import { useDispatch, useSelector } from "react-redux";
import {
  getAclIsEditing,
  getIconLocations,
} from "@appsmith/selectors/aclSelectors";
import { updateRoleById } from "@appsmith/actions/aclActions";
import { isPermitted } from "@appsmith/utils/permissionHelpers";
import { PERMISSION_TYPE } from "@appsmith/utils/permissionHelpers";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import SaveOrDiscardRoleModal from "./SaveOrDiscardRoleModal";
import {
  Checkbox,
  Icon,
  Tab,
  TabPanel,
  TabsList,
  Spinner,
  Tooltip,
} from "design-system";
import { usePrevious } from "@mantine/hooks";
import { JsFileIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

let dataToBeSent: any[] = [];

const CheckboxWrapper = styled.div`
  width: 100%;
  height: 36px;
  display: flex;
  justify-content: center;

  .checkbox-parent {
    position: relative;
  }

  &.hover-state {
    .design-system-checkbox {
      span {
        border: 1px solid var(--ads-v2-color-border-emphasis-plus);
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
    background: var(--ads-v2-color-bg);
    z-index: 1;
    height: 40px;

    th {
      color: var(--ads-v2-color-fg-emphasis-plus);
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
        color: var(--ads-v2-color-fg-emphasis);
        padding: 0;
        text-align: center;

        label {
          padding: 0;
          top: 10px;

          input {
            display: none;
          }
        }
      }

      &:hover {
        td {
          div {
            background: var(--ads-v2-color-bg-subtle);
          }
          &:first-child {
            background: none;

            div {
              background: none;
              .text-wrapper {
                background: var(--ads-v2-color-bg-subtle);
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

    > span {
      display: -webkit-inline-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      text-overflow: ellipsis;
      width: 100%;
      white-space: break-spaces;
      overflow: hidden;
      word-break: break-all;
    }
  }
`;

const Delimeter = styled.div`
  border-left: 1px solid var(--ads-v2-color-border);
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

const TableWrapper = styled.div<{ isEditing?: boolean }>`
  ${({ isEditing }) => (isEditing ? `margin-bottom: 16px;` : ``)}
`;

const IconTypes: any = {
  HomePage: (
    <MenuIcons.DEFAULT_HOMEPAGE_ICON
      color="var(--ads-v2-color-fg-success)"
      height="16"
      width="16"
    />
  ),
  NewPage: (
    <MenuIcons.PAGE_ICON
      color="var(--ads-v2-color-fg)"
      height="16"
      width="16"
    />
  ),
  ActionCollection: JsFileIconV2(),
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
  updateMyData?: (
    value: any,
    cellId: string,
    rowId: any,
    hoverMap: any,
  ) => void;
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
        flatRows.filter(
          (item: any) =>
            item.values?.name
              ?.toLowerCase()
              .includes(searchValue?.toLowerCase()),
        ).length,
      );
      toggleAllRowsExpanded(true);
    }
  }, [flatRows, searchValue]);

  const getRowVisibility = (row: any): string => {
    let shouldHide = true;
    const filteredDataStr = JSON.stringify(filteredData);
    if (
      filteredDataStr.includes(
        `"id":"${row.original.id}","name":"${row.original.name}"`,
      ) ||
      filteredDataStr.includes(
        `"name":"${row.original.name}","type":"Header","id":"Header","searchKey":"${row.original.searchKey}"`,
      )
    ) {
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
                {loaderComponent ? loaderComponent : <Spinner size="lg" />}
              </CentralizedWrapper>
            </td>
          </tr>
        ) : rows.length > 0 &&
          (!searchValue || (searchValue && filteredData.length > 0)) ? (
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

export const makeData = ({
  data,
  hoverMap,
  isMultiple = false,
  parentId,
  permissions,
}: {
  data: any[];
  hoverMap: any;
  permissions: string[];
  isMultiple?: boolean;
  parentId?: string;
}) => {
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
              searchKey: `${parentId}_Header`,
            }
          : {
              permissions: enabled,
              hoverMap: enabled.map((a: any, i: number) =>
                getEntireHoverMap(
                  hoverMap,
                  `${d.id}_${permissions[i]}${getExtendedId(d, dt.type)}`,
                ),
              ),
            }),
        ...(d.children
          ? {
              subRows:
                Array.isArray(children) && children.length > 1
                  ? makeData({
                      data: children,
                      hoverMap,
                      parentId: d.id || parentId,
                      permissions,
                      isMultiple: true,
                    })
                  : makeData({
                      data: children,
                      hoverMap,
                      parentId: d.id || parentId,
                      permissions,
                    }),
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
    return (
      nameIncludesSearchValue ||
      (!nameIncludesSearchValue && item.subRows?.length > 0)
    );
  });
}

export function getEntireHoverMap(hoverMap: any, key: string) {
  const currentKeyMap = hoverMap?.[key] || [];
  const keySplit = key.split("_");
  const type = keySplit.length > 2 ? keySplit[2] : null;
  let finalMap: any[] = [
    {
      id: keySplit[0],
      p: keySplit[1],
      ...(type ? { type } : {}),
    },
  ];
  for (const map of currentKeyMap) {
    const more = getEntireHoverMap(
      hoverMap,
      `${map?.id}_${map?.p}${type && map.id === keySplit[0] ? `_${type}` : ``}`,
    );
    finalMap = Array.from(
      new Set(
        [...finalMap, ...(more.length > 0 ? more : [map])].map((object) =>
          JSON.stringify(object),
        ),
      ),
    ).map((string) => JSON.parse(string));
  }
  return finalMap;
}

export function getEntireDisableMap(map: any, rowData: any, column: string) {
  const currentKeyMap: any = map
    ? Object.fromEntries(
        Object.entries(map).filter(([key]) => {
          const splitKey = key.split("_");
          return (
            key.includes(rowData.id) &&
            (splitKey[2] ===
              `Tenant${rowData.name.substring(0, rowData.name.length - 1)}` ||
              !splitKey[2])
          );
        }),
      )
    : [];
  const key = `${rowData.id}_${column}`;
  const finalMap: any[] = [];
  for (const entry in currentKeyMap) {
    for (const trav of currentKeyMap[entry]) {
      if (`${trav.id}_${trav.p}` === key) {
        finalMap.push(entry);
      }
    }
  }
  return finalMap;
}

export function traverseSubRows(subrows: any[], map: any): any {
  return subrows?.some((sr: any) => {
    return sr.id === map.id || (sr.subRows && traverseSubRows(sr.subRows, map));
  });
}

export function updateDataToBeSent(
  row: any,
  mapPIndex: number,
  value: any,
  dependencies = 0,
) {
  const replaceDataIndex = dataToBeSent.findIndex(
    (a: any) => a.id === row.id && a.name === row.name,
  );
  if (replaceDataIndex > -1) {
    dataToBeSent[replaceDataIndex] = {
      id: row.id,
      permissions:
        mapPIndex !== -1
          ? row?.permissions?.map((r: number, rI: number) => {
              return rI === mapPIndex &&
                r !== -1 &&
                ((!value && dependencies < 1) || value)
                ? value
                  ? 1
                  : 0
                : r;
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
              return rI === mapPIndex &&
                r !== -1 &&
                ((!value && dependencies < 1) || value)
                ? value
                  ? 1
                  : 0
                : r;
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
  dependencies: number,
): any {
  const returnData = rows.map((subRow: any) => {
    if (map.id === subRow.id) {
      if (subRow.type !== "Header") {
        updateDataToBeSent(subRow, mapPIndex, value, dependencies);
      }
      return {
        ...subRow,
        permissions: subRow?.permissions?.map((r: number, rI: number) => {
          return rI === mapPIndex &&
            r !== -1 &&
            ((!value && dependencies < 1) || value)
            ? value
              ? 1
              : 0
            : r;
        }),
      };
    } else {
      if (
        (traverseSubRows(subRow.subRows, map) || !subRow.subRows) &&
        !dataToBeSent.some((a) => a.id === subRow.id) &&
        subRow.type !== "Header"
      ) {
        updateDataToBeSent(subRow, mapPIndex, value, dependencies);
      }
      return subRow.subRows
        ? {
            ...subRow,
            subRows: traverseSubRows(subRow.subRows, map)
              ? updateSubRows(
                  map,
                  subRow.subRows,
                  mapPIndex,
                  value,
                  dependencies,
                )
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
  disableHelperMap: any,
) {
  let updatedRow: any = rowData;

  for (const map of hoverMap) {
    const mapPIndex = permissions.indexOf(map.p);

    let dependencies = 0;
    const disableMapForCheckbox =
      getEntireDisableMap(disableHelperMap, updatedRow, map.p) || [];
    for (const i of disableMapForCheckbox) {
      const allEl = document.querySelectorAll(`[data-cellId="${i}"]`);
      const el = allEl[0];
      const input = el?.getElementsByTagName("input")[0];
      if (input && input.checked && !input.disabled) {
        dependencies += 1;
      }
    }

    updatedRow = {
      ...updatedRow,
      ...(map.id === updatedRow.id && updatedRow.permissions
        ? {
            permissions: updatedRow?.permissions?.map(
              (r: number, rI: number) => {
                return rI === mapPIndex &&
                  r !== -1 &&
                  ((!value && dependencies < 1) || value)
                  ? value
                    ? 1
                    : 0
                  : r;
              },
            ),
          }
        : {}),
      ...(updatedRow.subRows
        ? {
            subRows: traverseSubRows(updatedRow.subRows, map)
              ? updateSubRows(
                  map,
                  updatedRow.subRows,
                  mapPIndex,
                  value,
                  dependencies,
                )
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
  hoverMap: any,
  permissions: any,
  disableHelperMap: any,
) {
  const updatedData = [...oldData];
  const currentCellId = cellId.split("_");

  const rowIdArray: string[] = rowId.split(".");
  const rowDataToUpdate = oldData.find(
    (d: any, i: number) => i === parseInt(rowIdArray[0]),
  );

  if (rowDataToUpdate) {
    if (currentCellId[0] === rowDataToUpdate.id) {
      updatedData[parseInt(rowIdArray[0])] = updateCheckbox(
        rowDataToUpdate,
        newValue,
        hoverMap,
        permissions,
        disableHelperMap,
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
          hoverMap,
          permissions,
          disableHelperMap,
        ),
      };
    }
  }
  return updatedData;
}

export const getIcon = (iconLocations: any[], pluginId: string) => {
  const icon = iconLocations.find((d) => d.id === pluginId);
  return <img alt={icon.name} src={getAssetUrl(icon.iconLocation)} />;
};

const eligibleRowNames = ["Datasources", "Environments", "Groups", "Roles"];
const eligibleTypes = ["Tenant", "Workspace"];

export const getExtendedId = (rowData: any, type: string) => {
  if (eligibleRowNames.includes(rowData.name) && eligibleTypes.includes(type)) {
    return `_${type}${rowData.name.substring(0, rowData.name.length - 1)}`;
  }

  return "";
};

export function RolesTree(props: RoleTreeProps & { selectedTab: boolean }) {
  const {
    searchValue = "",
    selectedTab,
    setShowSaveModal,
    showSaveModal,
    tabData,
  } = props;
  const { id: roleId, isSaving, userPermissions } = props.selected;
  const [filteredData, setFilteredData] = useState([]);
  const [data, setData] = useState<any[]>([]);
  const [dataFromProps, setDataFromProps] = useState<any[]>([]);
  const iconLocations = useSelector(getIconLocations);
  const isEditing = useSelector(getAclIsEditing);
  const prevValues = usePrevious({ searchValue });
  const dispatch = useDispatch();

  const canEditRole = isPermitted(
    userPermissions,
    PERMISSION_TYPE.MANAGE_PERMISSIONGROUPS,
  );

  useEffect(() => {
    dataToBeSent = [];
  }, []);

  useEffect(() => {
    if (selectedTab) {
      const calculatedData =
        makeData({
          data: [tabData?.data],
          hoverMap: tabData.hoverMap,
          permissions: tabData.permissions,
        }) || [];
      setData(calculatedData);
      setDataFromProps(calculatedData);
    }
  }, [tabData, selectedTab]);

  useEffect(() => {
    if (searchValue && searchValue.trim().length > 0) {
      const currentData = JSON.parse(JSON.stringify(data));
      const result = getSearchData(currentData, searchValue);
      setFilteredData(result);
    } else if (prevValues?.searchValue !== searchValue) {
      setFilteredData([]);
    }
  }, [searchValue, data]);

  useEffect(() => {
    if (JSON.stringify(data) === JSON.stringify(dataFromProps)) {
      dispatch({
        type: ReduxActionTypes.ACL_IS_EDITING,
        payload: false,
      });
    }
  }, [data]);

  const columns: Array<Column> = [
    {
      Header: "Resource permissions",
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
              <Icon name="down-arrow" size="md" />
            ) : (
              <Icon
                data-testid="right-arrow-2"
                name="right-arrow-2"
                size="md"
              />
            )}
            <div className="text-wrapper">
              {icon}
              <Tooltip
                content={row.name}
                isDisabled={row.name.length < 80}
                placement="bottomLeft"
              >
                <HighlightText highlight={searchValue} text={row.name} />
              </Tooltip>
            </div>
          </ResourceCellWrapper>
        ) : (
          <ResourceCellWrapper className="flat-row">
            {cellProps.row.depth ? del : null}
            <div className="text-wrapper">
              {icon}
              <Tooltip
                content={row.name}
                isDisabled={row.name.length < 80}
                placement="bottomLeft"
              >
                <HighlightText highlight={searchValue} text={row.name} />
              </Tooltip>
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
        const [isChecked, setIsChecked] = useState(value === 1 ? true : false);
        const disableMap = useMemo(
          () =>
            isChecked && canEditRole && tabData.disableHelperMap
              ? getEntireDisableMap(tabData.disableHelperMap, rowData, column)
              : [],
          [isChecked],
        );
        const [isDisabled, setIsDisabled] = useState(false);
        const extendedId = getExtendedId(rowData, rowData.type);
        const checkboxId = `${rowData.id}_${column}${extendedId}`;

        useEffect(() => {
          if (disableMap.length > 0 && !isDisabled) {
            setIsDisabled(getDisabledState(parseInt(rowId.split(".")[0])));
          }
        }, [disableMap, isChecked]);

        const removeHoverClass = () => {
          const values = rowData.hoverMap[i];
          for (const val of values) {
            const allEl = document.querySelectorAll(
              `[data-cellId="${val.id}_${val.p}${
                val.type ? `_${val.type}` : ``
              }"]`,
            );
            const el = allEl.length ? allEl[0] : null;
            el?.classList.remove("hover-state");
          }
        };

        const addHoverClass = useCallback(() => {
          const values = rowData.hoverMap[i];
          for (const val of values) {
            const allEl = document.querySelectorAll(
              `[data-cellId="${val.id}_${val.p}${
                val.type ? `_${val.type}` : ``
              }"]`,
            );
            const el = allEl.length ? allEl[0] : null;
            el?.classList.add("hover-state");
          }
        }, [tabData.hoverMap]);

        const onChangeHandler = (e: any, cellId: string) => {
          setIsChecked(e);
          updateMyData(e, cellId, rowId, rowData.hoverMap[i]);
        };

        const getDisabledState = (rIndex: number) => {
          let isDisabled = false;
          for (const i of disableMap) {
            const allEl = document.querySelectorAll(`[data-cellId="${i}"]`);
            const el =
              allEl[0]?.getAttribute("data-rowid") === rIndex.toString()
                ? allEl[0]
                : null;
            const input = el?.getElementsByTagName("input")[0];
            if (input?.checked) {
              isDisabled = true;
            }
          }
          return isDisabled;
        };

        return rowData.permissions && rowData.permissions[i] !== -1 ? (
          <CheckboxWrapper
            data-cellid={checkboxId}
            data-rowid={parseInt(rowId.split(".")[0])}
            data-testid={checkboxId}
          >
            <div
              className="checkbox-parent"
              onMouseOut={removeHoverClass}
              onMouseOver={addHoverClass}
            >
              <Checkbox
                aria-label="check-permission"
                className="design-system-checkbox"
                defaultSelected={isChecked}
                isDisabled={!canEditRole || isDisabled}
                /* indeterminate={row.permissions[i] === 3 ? true : false} */
                onChange={(value: boolean) =>
                  onChangeHandler(value, checkboxId)
                }
                value={checkboxId}
              />
            </div>
          </CheckboxWrapper>
        ) : (
          <CheckboxWrapper
            data-cellid={checkboxId}
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
    dataToBeSent = [];
    if (showSaveModal) {
      setShowSaveModal(false);
    }
  };

  const onClearChanges = () => {
    dispatch({
      type: ReduxActionTypes.IS_SAVING_ROLE,
      payload: false,
    });
    setData(dataFromProps);
    dataToBeSent = [];
    if (showSaveModal) {
      setShowSaveModal(false);
    }
  };

  /* We need to keep the table from resetting the pageIndex when we
     Update data. So we can keep track of that flag with a ref.

     When our cell renderer calls updateMyData, we'll use
     the rowIndex, columnId and new value to update the
     original data */
  const updateMyData = (
    newValue: any,
    cellId: string,
    rowId: any,
    hoverMap: any,
  ) => {
    dispatch({
      type: ReduxActionTypes.ACL_IS_EDITING,
      payload: true,
    });
    setData((old: any[]) => {
      return updateData(
        old,
        newValue,
        cellId,
        rowId,
        hoverMap,
        tabData.permissions,
        tabData.disableHelperMap,
      );
    });
  };

  const onChangeModal = (open: boolean) => {
    if (showSaveModal) {
      setShowSaveModal(open);
      setData(data);
    }
  };

  return data.length > 0 ? (
    <>
      <TableWrapper isEditing={isEditing}>
        <Table
          columns={columns}
          data={data}
          filteredData={filteredData}
          searchValue={props.searchValue}
          updateMyData={updateMyData}
          updateTabCount={props.updateTabCount}
        />
      </TableWrapper>
      {isEditing && (
        <SaveButtonBar
          isLoading={isSaving}
          onClear={onClearChanges}
          onSave={onSaveChanges}
        />
      )}
      {showSaveModal && (
        <SaveOrDiscardRoleModal
          disabledButtons={!canEditRole}
          isOpen={showSaveModal}
          onChangeModal={onChangeModal}
          onDiscard={onClearChanges}
          onSave={onSaveChanges}
        />
      )}
    </>
  ) : (
    <CentralizedWrapper>
      <Spinner size="lg" />
    </CentralizedWrapper>
  );
}

export function EachTab(
  key: string,
  searchValue: string,
  tabs: any,
  selected: RoleProps,
  showSaveModal: boolean,
  setShowSaveModal: (val: boolean) => void,
  selectedTab: string,
) {
  const [tabCount, setTabCount] = useState<number>(0);

  useEffect(() => {
    if (!searchValue) {
      setTabCount(0);
    }
  }, [searchValue]);

  return {
    key,
    title: key,
    count: tabCount,
    panelComponent:
      selectedTab === key ? (
        <RolesTree
          currentTabName={key}
          searchValue={searchValue}
          selected={selected}
          selectedTab={selectedTab === key}
          setShowSaveModal={setShowSaveModal}
          showSaveModal={showSaveModal}
          tabData={tabs}
          updateTabCount={(n) => setTabCount(n)}
        />
      ) : (
        <div />
      ),
  };
}

export default function RoleTabs(props: {
  selected: RoleProps;
  searchValue: string;
}) {
  const { searchValue, selected } = props;
  const isEditing = useSelector(getAclIsEditing);
  const [selectedTab, setSelectedTab] = useState<string>(
    Object.keys(selected?.tabs)?.[0] || "",
  );
  const [showSaveModal, setShowSaveModal] = useState(false);

  const tabs: TabProps[] = Object.entries(selected?.tabs || {}).map(
    ([key, value]) =>
      EachTab(
        key,
        searchValue,
        value,
        selected,
        showSaveModal,
        setShowSaveModal,
        selectedTab,
      ),
  );

  const onTabChange = (value: string) => {
    if (isEditing && selectedTab !== value) {
      setShowSaveModal(true);
      setSelectedTab(selectedTab);
    } else {
      setSelectedTab(value);
    }
  };

  return tabs.length > 0 ? (
    <StyledTabs onValueChange={onTabChange} value={selectedTab}>
      <TabsList>
        {tabs.map((tab) => {
          return (
            <Tab
              data-testid={`t--tab-${tab.key}`}
              key={tab.key}
              notificationCount={tab.count}
              value={tab.key}
            >
              {tab.title}
            </Tab>
          );
        })}
      </TabsList>
      {tabs.map((tab) => {
        return (
          <TabPanel
            className={`tab-panel ${isEditing ? "is-editing" : ""}`}
            key={tab.key}
            value={tab.key}
          >
            {tab.panelComponent}
          </TabPanel>
        );
      })}
    </StyledTabs>
  ) : null;
}
