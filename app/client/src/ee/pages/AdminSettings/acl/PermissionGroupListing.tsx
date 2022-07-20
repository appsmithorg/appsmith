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
  isNew?: boolean;
};

export const permissionGroupTableData: PermissionGroupProps[] = [
  {
    id: "1",
    isEditing: false,
    isDeleting: false,
    permissionName: "HR_Appsmith",
    isAppsmithProvided: false,
    isNew: false,
  },
  {
    id: "2",
    isEditing: false,
    isDeleting: false,
    permissionName: "devops_design",
    isAppsmithProvided: false,
    isNew: false,
  },
  {
    id: "3",
    isEditing: false,
    isDeleting: false,
    permissionName: "devops_eng_nov",
    isAppsmithProvided: false,
    isNew: false,
  },
  {
    id: "4",
    isEditing: false,
    isDeleting: false,
    permissionName: "marketing_nov",
    isAppsmithProvided: false,
    isNew: false,
  },
  {
    id: "5",
    isEditing: false,
    isDeleting: false,
    permissionName: "Administrator",
    isAppsmithProvided: true,
    isNew: false,
  },
  {
    id: "6",
    isEditing: false,
    isDeleting: false,
    permissionName: "App Viewer",
    isAppsmithProvided: true,
    isNew: false,
  },
];

export function PermissionGroupListing() {
  const [data, setData] = useState<PermissionGroupProps[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const params = useParams() as any;
  const selectedPermGrpId = params?.selected;
  const selPermissionGroup = permissionGroupTableData.find(
    (group) => group.id === selectedPermGrpId,
  );
  const [selectedPermissionGroup, setSelectedPermissionGroup] = useState(
    selPermissionGroup,
  );
  const [isNewGroup, setIsNewGroup] = useState(false);

  const history = useHistory();

  useEffect(() => {
    if (isNewGroup && params.selected) {
      setSelectedPermissionGroup({
        id: "10102",
        isEditing: false,
        isDeleting: false,
        permissionName: "Untitled Permission Group",
        isAppsmithProvided: false,
        isNew: true,
      });
    } else {
      const selPermissionGroup = permissionGroupTableData.find(
        (group) => group.id === selectedPermGrpId,
      );
      setSelectedPermissionGroup(selPermissionGroup);
      setIsNewGroup(false);
    }
  }, [params]);

  useEffect(() => {
    setData(permissionGroupTableData);
  }, [permissionGroupTableData]);

  const onDeleteHandler = (id: string) => {
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
      isAppsmithProvided: false,
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
        selectedPermission &&
          onCloneHandler({ ...selectedPermission, isAppsmithProvided: false });
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
        onDeleteHandler(key);
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

  const onAddButtonClick = () => {
    setIsNewGroup(true);
    history.push(`/settings/permission-groups/10102`);
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
          onDelete={onDeleteHandler}
          selected={selectedPermissionGroup}
        />
      ) : (
        <>
          <PageHeader
            buttonText="Add Group"
            onButtonClick={onAddButtonClick}
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
