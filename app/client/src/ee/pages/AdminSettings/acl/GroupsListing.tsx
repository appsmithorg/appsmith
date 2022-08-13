import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router";
import styled from "styled-components";
import debounce from "lodash/debounce";
import { Listing } from "./Listing";
import { MenuItemProps, Toaster, Variant } from "components/ads";
import { PageHeader } from "./PageHeader";
import { BottomSpace } from "pages/Settings/components";
import { Link } from "react-router-dom";
import { HighlightText } from "./helpers/HighlightText";
import { GroupAddEdit } from "./GroupAddEdit";
import { AclWrapper } from "./components";
import { User } from "./UserListing";
import uniqueId from "lodash/uniqueId";
import { adminSettingsCategoryUrl } from "RouteBuilder";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";
import {
  createMessage,
  ADD_GROUP,
  GROUP_DELETED,
  GROUP_CLONED,
  COPY_OF_GROUP,
  CLONE_GROUP,
  EDIT_GROUP,
  DELETE_GROUP,
  SEARCH_GROUPS_PLACEHOLDER,
} from "@appsmith/constants/messages";

const CellContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

export type UserGroup = {
  isEditing: boolean;
  isDeleting: boolean;
  rolename: string;
  id: string;
  allPermissions: string[];
  activePermissions: string[];
  allUsers: Partial<User>[];
  isNew?: boolean;
};

export const userGroupTableData: UserGroup[] = [
  {
    isEditing: false,
    isDeleting: false,
    rolename: "Eng_New",
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
        allGroups: ["Administrator", "Test_Admin", "HR_Admin"],
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
        allGroups: ["Administrator", "Test_Admin", "HR_Admin"],
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
        allGroups: ["Administrator", "Test_Admin", "HR_Admin"],
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

export function GroupListing() {
  const [data, setData] = useState<UserGroup[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const params = useParams() as any;
  const selectedUserGroupId = params?.selected;
  const selUserGroup = userGroupTableData.find(
    (userGroup) => userGroup.id === selectedUserGroupId,
  );
  const [selectedUserGroup, setSelectedUserGroup] = useState(selUserGroup);
  const [isNewGroup, setIsNewGroup] = useState(false);

  const history = useHistory();

  useEffect(() => {
    if (isNewGroup && params.selected) {
      setSelectedUserGroup({
        isEditing: false,
        isDeleting: false,
        rolename: "Untitled Group",
        isNew: true,
        id: "10109",
        allPermissions: [
          "Administrator",
          "App Viewer",
          "HR_Appsmith",
          "devops_design",
          "devops_eng_nov",
          "marketing_nov",
        ],
        activePermissions: [],
        allUsers: [],
      });
    } else {
      const selUserGroup = userGroupTableData.find(
        (userGroup) => userGroup.id === selectedUserGroupId,
      );
      setSelectedUserGroup(selUserGroup);
      setIsNewGroup(false);
    }
  }, [params]);

  useEffect(() => {
    setData(userGroupTableData);
  }, [userGroupTableData]);

  const onDeleteHandler = (id: string) => {
    const updatedData = data.filter((userGroup) => {
      return userGroup.id !== id;
    });
    setData(updatedData);
    Toaster.show({
      text: createMessage(GROUP_DELETED),
      variant: Variant.success,
    });
  };

  const onCloneHandler = (selected: UserGroup) => {
    const clonedData = {
      ...selected,
      id: uniqueId(),
      rolename: createMessage(COPY_OF_GROUP, selected.rolename),
    };
    userGroupTableData.push(clonedData);
    setData([...userGroupTableData]);
    Toaster.show({
      text: createMessage(GROUP_CLONED),
      variant: Variant.success,
    });
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
              category: SettingCategories.GROUPS_LISTING,
              selected: cellProps.cell.row.original.id,
            })}
          >
            <CellContainer>
              <HighlightText
                highlight={searchValue}
                text={cellProps.cell.row.values.rolename}
              />
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
      onSelect: (e, id) => {
        const selectedUserGroup = data.find((userGroup) => userGroup.id === id);
        selectedUserGroup &&
          onCloneHandler({
            ...selectedUserGroup,
          });
      },
      text: createMessage(CLONE_GROUP),
    },
    {
      className: "edit-menu-item",
      icon: "edit-underline",
      onSelect: (e, key) => {
        history.push(`/settings/groups/${key}`);
      },
      text: createMessage(EDIT_GROUP),
    },
    {
      label: "delete",
      className: "delete-menu-item",
      icon: "delete-blank",
      onSelect: (e, key: string) => {
        onDeleteHandler(key);
      },
      text: createMessage(DELETE_GROUP),
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
    history.push(`/settings/groups/10109`);
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
    <AclWrapper data-testid="t--group-listing-wrapper">
      {selectedUserGroup ? (
        <GroupAddEdit
          onClone={onCloneHandler}
          onDelete={onDeleteHandler}
          selected={selectedUserGroup}
        />
      ) : (
        <>
          <PageHeader
            buttonText={createMessage(ADD_GROUP)}
            onButtonClick={onAddButtonClick}
            onSearch={onSearch}
            pageMenuItems={pageMenuItems}
            searchPlaceholder={createMessage(SEARCH_GROUPS_PLACEHOLDER)}
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
