import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router";
import { Link } from "react-router-dom";
import styled from "styled-components";
import debounce from "lodash/debounce";
import { Listing } from "./Listing";
import { MenuItemProps, Toaster, Variant } from "components/ads";
import { PageHeader } from "./PageHeader";
import { BottomSpace } from "pages/Settings/components";
import { HighlightText } from "./helpers/HighlightText";
import { AclWrapper, AppsmithIcon } from "./components";
import uniqueId from "lodash/uniqueId";
import { adminSettingsCategoryUrl } from "RouteBuilder";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";
import { RoleAddEdit } from "./RoleAddEdit";
import {
  ADD_ROLE,
  CLONE_ROLE,
  COPY_OF_GROUP,
  createMessage,
  DELETE_ROLE,
  EDIT_ROLE,
  GROUP_CLONED,
  GROUP_DELETED,
  SEARCH_ROLES_PLACEHOLDER,
} from "@appsmith/constants/messages";

const CellContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

type RoleProps = {
  isEditing: boolean;
  isDeleting: boolean;
  permissionName: string;
  isAppsmithProvided: boolean;
  id: string;
  isNew?: boolean;
};

export const rolesTableData: RoleProps[] = [
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

export function RolesListing() {
  const [data, setData] = useState<RoleProps[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const params = useParams() as any;
  const selectedPermGrpId = params?.selected;
  const selPermissionGroup = rolesTableData.find(
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
        permissionName: "Untitled Role",
        isAppsmithProvided: false,
        isNew: true,
      });
    } else {
      const selPermissionGroup = rolesTableData.find(
        (group) => group.id === selectedPermGrpId,
      );
      setSelectedPermissionGroup(selPermissionGroup);
      setIsNewGroup(false);
    }
  }, [params]);

  useEffect(() => {
    setData(rolesTableData);
  }, [rolesTableData]);

  const onDeleteHandler = (id: string) => {
    const updatedData = data.filter((role) => {
      return role.id !== id;
    });
    setData(updatedData);
    Toaster.show({
      text: createMessage(GROUP_DELETED),
      variant: Variant.success,
    });
  };

  const onCloneHandler = (role: RoleProps) => {
    const clonedData = {
      ...role,
      id: uniqueId("pg"),
      permissionName: createMessage(COPY_OF_GROUP, role.permissionName),
      isAppsmithProvided: false,
    };
    rolesTableData.push(clonedData);
    setData([...rolesTableData]);
    Toaster.show({
      text: createMessage(GROUP_CLONED),
      variant: Variant.success,
    });
  };

  const columns = [
    {
      Header: `Roles (${data.length})`,
      accessor: "permissionName",
      Cell: function GroupCell(cellProps: any) {
        return (
          <Link
            data-testid="t--roles-cell"
            to={adminSettingsCategoryUrl({
              category: SettingCategories.ROLES_LISTING,
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
        const selectedPermission = data.find((role) => role.id === id);
        selectedPermission &&
          onCloneHandler({ ...selectedPermission, isAppsmithProvided: false });
      },
      text: createMessage(CLONE_ROLE),
      label: "clone",
    },
    {
      className: "edit-menu-item",
      icon: "edit-underline",
      onSelect: (e, key) => {
        history.push(`/settings/roles/${key}`);
      },
      text: createMessage(EDIT_ROLE),
      label: "edit",
    },
    {
      label: "delete",
      className: "delete-menu-item",
      icon: "delete-blank",
      onSelect: (e, key: string) => {
        onDeleteHandler(key);
      },
      text: createMessage(DELETE_ROLE),
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
    history.push(`/settings/roles/10102`);
  };

  const onSearch = debounce((search: string) => {
    if (search && search.trim().length > 0) {
      setSearchValue(search);
      const results =
        rolesTableData &&
        rolesTableData.filter((role) =>
          role.permissionName?.toLocaleUpperCase().includes(search),
        );
      setData(results);
    } else {
      setSearchValue("");
      setData(rolesTableData);
    }
  }, 300);

  return (
    <AclWrapper data-testid="t--roles-listing-wrapper">
      {selectedPermissionGroup ? (
        <RoleAddEdit
          onClone={onCloneHandler}
          onDelete={onDeleteHandler}
          selected={selectedPermissionGroup}
        />
      ) : (
        <>
          <PageHeader
            buttonText={createMessage(ADD_ROLE)}
            onButtonClick={onAddButtonClick}
            onSearch={onSearch}
            pageMenuItems={pageMenuItems}
            searchPlaceholder={createMessage(SEARCH_ROLES_PLACEHOLDER)}
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
