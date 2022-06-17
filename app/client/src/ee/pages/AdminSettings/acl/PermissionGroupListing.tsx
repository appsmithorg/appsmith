import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router";
import { Link } from "react-router-dom";
import styled from "styled-components";
import debounce from "lodash/debounce";
import { Listing } from "./Listing";
import { MenuItemProps } from "components/ads";
import { PageHeader } from "./PageHeader";
import { BottomSpace } from "pages/Settings/components";
import { HighlightText } from "./helpers/HighlightText";
import { AclWrapper, AppsmithIcon } from "./components";
import uniqueId from "lodash/uniqueId";
import { adminSettingsCategoryUrl } from "RouteBuilder";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";
import { PermissionGroupAddEdit } from "./PermissionGroupAddEdit";

const CellContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

type PermissionGroupProps = {
  isEditing: boolean;
  isDeleting: boolean;
  permissionName: string;
  isAppsmithProvided: boolean;
  id: string;
};

export const permissionGroupTableData: PermissionGroupProps[] = [
  {
    id: "1",
    isEditing: false,
    isDeleting: false,
    permissionName: "HR_Appsmith",
    isAppsmithProvided: false,
  },
  {
    id: "2",
    isEditing: false,
    isDeleting: false,
    permissionName: "devops_design",
    isAppsmithProvided: false,
  },
  {
    id: "3",
    isEditing: false,
    isDeleting: false,
    permissionName: "devops_eng_nov",
    isAppsmithProvided: false,
  },
  {
    id: "4",
    isEditing: false,
    isDeleting: false,
    permissionName: "marketing_nov",
    isAppsmithProvided: false,
  },
  {
    id: "5",
    isEditing: false,
    isDeleting: false,
    permissionName: "Administrator",
    isAppsmithProvided: true,
  },
  {
    id: "6",
    isEditing: false,
    isDeleting: false,
    permissionName: "App Viewer",
    isAppsmithProvided: true,
  },
];

export function PermissionGroupListing() {
  const [data, setData] = useState<PermissionGroupProps[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const params = useParams() as any;
  const selectedPermGrpId = params?.selected;
  const selectedPermissionGroup = data.find(
    (group) => group.id === selectedPermGrpId,
  );

  const history = useHistory();

  useEffect(() => {
    setData(permissionGroupTableData);
  }, [permissionGroupTableData]);

  const onDeleteHanlder = (id: string) => {
    const updatedData = data.filter((permissionGroup) => {
      return permissionGroup.id !== id;
    });
    setData(updatedData);
  };

  const onCloneHandler = (permission: PermissionGroupProps) => {
    const clonedData = {
      ...permission,
      id: uniqueId("pg"),
      permissionName: `Copy of ${permission.permissionName}`,
    };
    permissionGroupTableData.push(clonedData);
    setData([...permissionGroupTableData]);
  };

  const columns = [
    {
      Header: `Groups (${data.length})`,
      accessor: "permissionName",
      Cell: function GroupCell(cellProps: any) {
        return (
          <Link
            data-testid="t--permissionGroup-cell"
            to={adminSettingsCategoryUrl({
              category: SettingCategories.PERMISSION_GROUP_LISTING,
              selected: cellProps.cell.row.original.id,
            })}
          >
            <CellContainer>
              <HighlightText
                highlight={searchValue}
                text={cellProps.cell.row.values.permissionName}
              />
              {cellProps.cell.row.original.isAppsmithProvided && (
                <AppsmithIcon data-testid="t--appsmith-badge">A</AppsmithIcon>
              )}
            </CellContainer>
          </Link>
        );
      },
    },
  ];

  const listMenuItems: MenuItemProps[] = [
    {
      className: "clone-menu-item",
      icon: "duplicate",
      onSelect: (e, id: string) => {
        const selectedPermission = data.find(
          (permission) => permission.id === id,
        );
        selectedPermission && onCloneHandler(selectedPermission);
      },
      text: "Clone Permission Group",
      label: "clone",
    },
    {
      className: "edit-menu-item",
      icon: "edit-underline",
      onSelect: (e, key) => {
        history.push(`/settings/permission-groups/${key}`);
      },
      text: "Edit Permission Group",
      label: "edit",
    },
    {
      label: "delete",
      className: "delete-menu-item",
      icon: "delete-blank",
      onSelect: (e, key: string) => {
        onDeleteHanlder(key);
      },
      text: "Delete Permission Group",
    },
  ];

  const pageMenuItems: MenuItemProps[] = [
    {
      icon: "book-line",
      className: "documentation-page-menu-item",
      onSelect: () => {
        /*console.log("hello onSelect")*/
      },
      text: "Documentation",
    },
  ];

  const onButtonClick = () => {
    /*console.log("hello onClickHandler");*/
  };

  const onSearch = debounce((search: string) => {
    if (search && search.trim().length > 0) {
      setSearchValue(search);
      const results =
        permissionGroupTableData &&
        permissionGroupTableData.filter((permissionGroup) =>
          permissionGroup.permissionName?.toLocaleUpperCase().includes(search),
        );
      setData(results);
    } else {
      setSearchValue("");
      setData(permissionGroupTableData);
    }
  }, 300);

  return (
    <AclWrapper data-testid="t--permission-group-listing-wrapper">
      {selectedPermissionGroup ? (
        <PermissionGroupAddEdit
          onClone={onCloneHandler}
          onDelete={onDeleteHanlder}
          selected={selectedPermissionGroup}
        />
      ) : (
        <>
          <PageHeader
            buttonText="Add Group"
            onButtonClick={onButtonClick}
            onSearch={onSearch}
            pageMenuItems={pageMenuItems}
            searchPlaceholder="Search permission groups"
          />
          <Listing
            columns={columns}
            data={data}
            keyAccessor="id"
            listMenuItems={listMenuItems}
          />
        </>
      )}
      <BottomSpace />
    </AclWrapper>
  );
}
