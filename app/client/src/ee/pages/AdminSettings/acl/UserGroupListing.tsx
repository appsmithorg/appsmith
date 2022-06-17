import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router";
import styled from "styled-components";
import debounce from "lodash/debounce";
import { Listing } from "./Listing";
import { MenuItemProps } from "components/ads";
import { PageHeader } from "./PageHeader";
import { BottomSpace } from "pages/Settings/components";
import { Link } from "react-router-dom";
import { HighlightText } from "./helpers/HighlightText";
import { UserGroupAddEdit } from "./UserGroupAddEdit";
import { AclWrapper, AppsmithIcon } from "./components";
import { User } from "./UserListing";
import uniqueId from "lodash/uniqueId";
import { adminSettingsCategoryUrl } from "RouteBuilder";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";

const CellContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

export type UserGroup = {
  isEditing: boolean;
  isDeleting: boolean;
  rolename: string;
  isAppsmithProvided: boolean;
  id: string;
  allPermissions: string[];
  activePermissions: string[];
  allUsers: Partial<User>[];
};

export const userGroupTableData: UserGroup[] = [
  {
    isEditing: false,
    isDeleting: false,
    rolename: "Eng_New",
    isAppsmithProvided: false,
    id: "123",
    allPermissions: [
      "devops_eng_nov",
      "marketing_nov",
      "Administrator",
      "App Viewer",
    ],
    activePermissions: ["HR_Appsmith", "devops_design"],
    allUsers: [],
  },
  {
    isEditing: false,
    isDeleting: false,
    rolename: "Design",
    isAppsmithProvided: false,
    id: "456",
    allPermissions: [
      "HR_Appsmith",
      "devops_design",
      "Administrator",
      "App Viewer",
    ],
    activePermissions: ["devops_eng_nov", "marketing_nov"],
    allUsers: [
      {
        isChangingRole: false,
        isCurrentUser: true,
        isDeleting: false,
        name: "Ankita Kinger",
        username: "techak@appsmith.com",
        userId: "123",
      },
      {
        isChangingRole: false,
        isCurrentUser: true,
        isDeleting: false,
        name: "Hello",
        username: "hello123@appsmith.com",
        userId: "456",
      },
    ],
  },
  {
    isEditing: false,
    isDeleting: false,
    rolename: "contractors_ruby",
    isAppsmithProvided: false,
    id: "789",
    allPermissions: [
      "HR_Appsmith",
      "devops_design",
      "devops_eng_nov",
      "marketing_nov",
    ],
    activePermissions: ["Administrator", "App Viewer"],
    allUsers: [
      {
        isChangingRole: false,
        isCurrentUser: true,
        isDeleting: false,
        name: "Ankita Kinger",
        allRoles: ["Administrator", "Test_Admin", "HR_Admin"],
        username: "techak@appsmith.com",
        userId: "123",
      },
      {
        isChangingRole: false,
        isCurrentUser: true,
        isDeleting: false,
        name: "Hello",
        username: "hello123@appsmith.com",
        userId: "456",
      },
    ],
  },
  {
    isEditing: false,
    isDeleting: false,
    rolename: "marketing_newsletter",
    isAppsmithProvided: false,
    id: "103",
    allPermissions: [
      "HR_Appsmith",
      "marketing_nov",
      "Administrator",
      "App Viewer",
    ],
    activePermissions: ["devops_design", "devops_eng_nov"],
    allUsers: [
      {
        isChangingRole: false,
        isCurrentUser: true,
        isDeleting: false,
        name: "Ankita Kinger",
        allRoles: ["Administrator", "Test_Admin", "HR_Admin"],
        username: "techak@appsmith.com",
        userId: "123",
      },
      {
        isChangingRole: false,
        isCurrentUser: true,
        isDeleting: false,
        name: "Hello",
        username: "hello123@appsmith.com",
        userId: "456",
      },
    ],
  },
  {
    isEditing: false,
    isDeleting: false,
    rolename: "Administrator",
    isAppsmithProvided: true,
    id: "120",
    allPermissions: [
      "HR_Appsmith",
      "devops_design",
      "devops_eng_nov",
      "marketing_nov",
      "App Viewer",
    ],
    activePermissions: ["Administrator"],
    allUsers: [
      {
        isChangingRole: false,
        isCurrentUser: true,
        isDeleting: false,
        name: "Ankita Kinger",
        allRoles: ["Administrator", "Test_Admin", "HR_Admin"],
        username: "techak@appsmith.com",
        userId: "123",
      },
      {
        isChangingRole: false,
        isCurrentUser: true,
        isDeleting: false,
        name: "Hello",
        username: "hello123@appsmith.com",
        userId: "456",
      },
    ],
  },
  {
    isEditing: false,
    isDeleting: false,
    rolename: "App Viewer",
    isAppsmithProvided: true,
    id: "125",
    allPermissions: [
      "HR_Appsmith",
      "devops_design",
      "devops_eng_nov",
      "marketing_nov",
      "Administrator",
    ],
    activePermissions: ["App Viewer"],
    allUsers: [
      {
        isChangingRole: false,
        isCurrentUser: true,
        isDeleting: false,
        name: "Ankita Kinger",
        username: "techak@appsmith.com",
        userId: "123",
      },
      {
        isChangingRole: false,
        isCurrentUser: true,
        isDeleting: false,
        name: "Hello",
        username: "hello123@appsmith.com",
        userId: "456",
      },
    ],
  },
];

export function UserGroupListing() {
  const [data, setData] = useState<UserGroup[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const history = useHistory();

  useEffect(() => {
    setData(userGroupTableData);
  }, [userGroupTableData]);

  const onDeleteHanlder = (id: string) => {
    const updatedData = data.filter((userGroup) => {
      return userGroup.id !== id;
    });
    setData(updatedData);
  };

  const onCloneHandler = (selected: UserGroup) => {
    const clonedData = {
      ...selected,
      id: uniqueId(),
      rolename: `Copy of ${selected.rolename}`,
    };
    userGroupTableData.push(clonedData);
    setData([...userGroupTableData]);
  };

  const columns = [
    {
      Header: `Groups (${data.length})`,
      accessor: "rolename",
      Cell: function GroupCell(cellProps: any) {
        return (
          <Link
            data-testid="t--usergroup-cell"
            to={adminSettingsCategoryUrl({
              category: SettingCategories.USER_GROUP_LISTING,
              selected: cellProps.cell.row.original.id,
            })}
          >
            <CellContainer>
              <HighlightText
                highlight={searchValue}
                text={cellProps.cell.row.values.rolename}
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
  const params = useParams() as any;
  const selectedUserGroupId = params?.selected;
  const selectedUserGroup = userGroupTableData.find(
    (userGroup) => userGroup.id === selectedUserGroupId,
  );

  const listMenuItems: MenuItemProps[] = [
    {
      className: "clone-menu-item",
      icon: "duplicate",
      onSelect: (e, id) => {
        const selectedUserGroup = data.find((userGroup) => userGroup.id === id);
        selectedUserGroup && onCloneHandler(selectedUserGroup);
      },
      text: "Clone User Group",
    },
    {
      className: "edit-menu-item",
      icon: "edit-underline",
      onSelect: (e, key) => {
        history.push(`/settings/user-groups/${key}`);
      },
      text: "Edit User Group",
    },
    {
      label: "delete",
      className: "delete-menu-item",
      icon: "delete-blank",
      onSelect: (e, key: string) => {
        onDeleteHanlder(key);
      },
      text: "Delete User Group",
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
    /*console.log("hello onClickHandler from group");*/
  };

  const onSearch = debounce((search: string) => {
    if (search && search.trim().length > 0) {
      setSearchValue(search);
      const results =
        userGroupTableData &&
        userGroupTableData.filter((userGroup) =>
          userGroup.rolename?.toLocaleUpperCase().includes(search),
        );
      setData(results);
    } else {
      setSearchValue("");
      setData(userGroupTableData);
    }
  }, 300);

  return (
    <AclWrapper data-testid="t--user-group-listing-wrapper">
      {selectedUserGroup ? (
        <UserGroupAddEdit
          onClone={onCloneHandler}
          onDelete={onDeleteHanlder}
          selected={selectedUserGroup}
        />
      ) : (
        <>
          <PageHeader
            buttonText="Add Group"
            onButtonClick={onButtonClick}
            onSearch={onSearch}
            pageMenuItems={pageMenuItems}
            searchPlaceholder="Search user groups"
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
