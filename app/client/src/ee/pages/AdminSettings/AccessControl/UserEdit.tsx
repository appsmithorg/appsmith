import React, { useState, useEffect } from "react";
import { useHistory } from "react-router";
import styled from "styled-components";
import debounce from "lodash/debounce";
import { ActiveAllGroupsList } from "./ActiveAllGroupsList";
import { StyledSearchInput, SaveButtonBar, StyledTabs } from "./components";
import {
  ARE_YOU_SURE,
  createMessage,
  ACL_DELETE,
} from "@appsmith/constants/messages";
import { BackButton } from "components/utils/helperComponents";
import type {
  BaseAclProps,
  GroupsForUser,
  MenuItemProps,
  PermissionsForUser,
  TabProps,
  UserEditProps,
} from "./types";
import { getFilteredData } from "./utils/getFilteredData";
import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  updateGroupsInUser,
  updateRolesInUser,
} from "@appsmith/actions/aclActions";
import { getAclIsEditing } from "@appsmith/selectors/aclSelectors";
import { USER_PHOTO_ASSET_URL } from "constants/userConstants";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Tab,
  TabPanel,
  TabsList,
  Text,
} from "design-system";
import { AvatarComponent } from "pages/common/AvatarComponent";

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .acl-search-input {
    margin-right: 12px;
  }
`;

const User = styled.div`
  display: flex;
  align-items: center;

  .user-icons {
    cursor: auto;
  }
`;

const Username = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 16px;
`;

const Name = styled(Text)`
  margin-bottom: 4px;
`;

export function UserEdit(props: UserEditProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [showConfirmationText, setShowConfirmationText] = useState(false);
  const history = useHistory();
  const [userGroups, setUserGroups] = useState<GroupsForUser>({
    groups: [],
    allGroups: [],
  });
  const [permissionGroups, setPermissionGroups] = useState<PermissionsForUser>({
    roles: [],
    allRoles: [],
  });
  const [searchValue, setSearchValue] = useState("");
  const [removedActiveUserGroups, setRemovedActiveUserGroups] = useState<
    BaseAclProps[]
  >([]);
  const [addedAllUserGroups, setAddedAllUserGroups] = useState<BaseAclProps[]>(
    [],
  );
  const [removedActivePermissionGroups, setRemovedActivePermissionGroups] =
    useState<BaseAclProps[]>([]);
  const [addedAllPermGroups, setAddedAllPermGroups] = useState<BaseAclProps[]>(
    [],
  );
  const dispatch = useDispatch();
  const { searchPlaceholder, selectedUser } = props;

  const isEditing = useSelector(getAclIsEditing);

  useEffect(() => {
    if (searchValue) {
      onSearch(searchValue);
    } else {
      setUserGroups({
        groups: selectedUser.groups,
        allGroups: selectedUser.allGroups,
      });
      setPermissionGroups({
        roles: selectedUser.roles,
        allRoles: selectedUser.allRoles,
      });
    }
  }, [selectedUser]);

  useEffect(() => {
    const saving =
      removedActiveUserGroups.length > 0 ||
      addedAllUserGroups.length > 0 ||
      removedActivePermissionGroups.length > 0 ||
      addedAllPermGroups.length > 0;
    dispatch({
      type: ReduxActionTypes.ACL_IS_EDITING,
      payload: saving,
    });
  }, [
    removedActiveUserGroups,
    removedActivePermissionGroups,
    addedAllPermGroups,
    addedAllUserGroups,
  ]);

  const onAddGroup = (group: BaseAclProps) => {
    if (selectedTab === tabs[0].key) {
      const updateUserGroups =
        getFilteredData(addedAllUserGroups, group, true).length > 0
          ? getFilteredData(addedAllUserGroups, group, false)
          : [...addedAllUserGroups, group];
      setAddedAllUserGroups(updateUserGroups);
    } else if (selectedTab === tabs[1].key) {
      const updatePermissionGroups =
        getFilteredData(addedAllPermGroups, group, true).length > 0
          ? getFilteredData(addedAllPermGroups, group, false)
          : [...addedAllPermGroups, group];
      setAddedAllPermGroups(updatePermissionGroups);
    }
  };

  const onRemoveGroup = (group: BaseAclProps) => {
    if (selectedTab === tabs[0].key) {
      const updateUserGroups =
        getFilteredData(removedActiveUserGroups, group, true).length > 0
          ? getFilteredData(removedActiveUserGroups, group, false)
          : [...removedActiveUserGroups, group];
      setRemovedActiveUserGroups(updateUserGroups);
    } else if (selectedTab === tabs[1].key) {
      const updatePermissionGroups =
        getFilteredData(removedActivePermissionGroups, group, true).length > 0
          ? getFilteredData(removedActivePermissionGroups, group, false)
          : [...removedActivePermissionGroups, group];
      setRemovedActivePermissionGroups(updatePermissionGroups);
    }
  };

  const updateOnlyGroups = () => {
    const groupsAdded = addedAllUserGroups.map((group: BaseAclProps) => ({
      id: group.id,
      name: group.name,
    }));
    const groupsRemoved = removedActiveUserGroups.map(
      (group: BaseAclProps) => ({
        id: group.id,
        name: group.name,
      }),
    );
    dispatch(
      updateGroupsInUser(
        selectedUser.id,
        selectedUser.username,
        groupsAdded,
        groupsRemoved,
      ),
    );
  };

  const updateOnlyRoles = () => {
    const rolesAdded = addedAllPermGroups.map((group: BaseAclProps) => ({
      id: group.id,
      name: group.name,
    }));
    const rolesRemoved = removedActivePermissionGroups.map(
      (role: BaseAclProps) => ({
        id: role.id,
        name: role.name,
      }),
    );
    dispatch(
      updateRolesInUser(
        { id: selectedUser.id, username: selectedUser.username },
        rolesAdded,
        rolesRemoved,
      ),
    );
  };

  const onSaveChanges = () => {
    const onlyGroupsUdated =
      (removedActiveUserGroups.length > 0 || addedAllUserGroups.length > 0) &&
      removedActivePermissionGroups.length === 0 &&
      addedAllPermGroups.length === 0;

    const onlyRolesUdated =
      removedActiveUserGroups.length === 0 &&
      addedAllUserGroups.length === 0 &&
      (removedActivePermissionGroups.length > 0 ||
        addedAllPermGroups.length > 0);

    const bothGroupsRolesUpdated =
      (removedActiveUserGroups.length > 0 || addedAllUserGroups.length > 0) &&
      (removedActivePermissionGroups.length > 0 ||
        addedAllPermGroups.length > 0);

    if (onlyGroupsUdated) {
      updateOnlyGroups();
    } else if (onlyRolesUdated) {
      updateOnlyRoles();
    } else if (bothGroupsRolesUpdated) {
      updateOnlyGroups();
      updateOnlyRoles();
    }
    setRemovedActiveUserGroups([]);
    setRemovedActivePermissionGroups([]);
    setAddedAllUserGroups([]);
    setAddedAllPermGroups([]);
  };

  const onClearChanges = () => {
    setRemovedActiveUserGroups([]);
    setRemovedActivePermissionGroups([]);
    setAddedAllUserGroups([]);
    setAddedAllPermGroups([]);
  };

  const onDeleteHandler = () => {
    if (showConfirmationText) {
      props.onDelete(selectedUser.id);
      history.push(`/settings/users`);
    } else {
      setTimeout(() => {
        setShowOptions(true);
        setShowConfirmationText(true);
      }, 0);
    }
  };

  const onSearch = debounce((search: string) => {
    let groupResults: BaseAclProps[] = [];
    let allGroupResults: BaseAclProps[] = [];
    let permissionResults: BaseAclProps[];
    let allPermissionResults: BaseAclProps[] = [];
    if (search && search.trim().length > 0) {
      setSearchValue(search);
      groupResults =
        selectedUser.groups &&
        selectedUser.groups.filter((group) =>
          group.name?.toLocaleUpperCase().includes(search.toLocaleUpperCase()),
        );
      allGroupResults =
        selectedUser.allGroups &&
        selectedUser.allGroups.filter((group) =>
          group.name?.toLocaleUpperCase().includes(search.toLocaleUpperCase()),
        );
      setUserGroups({
        groups: groupResults,
        allGroups: allGroupResults,
      });
      permissionResults =
        selectedUser.roles &&
        selectedUser.roles.filter((permission) =>
          permission.name
            ?.toLocaleUpperCase()
            .includes(search.toLocaleUpperCase()),
        );
      allPermissionResults =
        selectedUser.allRoles &&
        selectedUser.allRoles.filter((permission) =>
          permission.name
            ?.toLocaleUpperCase()
            .includes(search.toLocaleUpperCase()),
        );
      setPermissionGroups({
        roles: permissionResults,
        allRoles: allPermissionResults,
      });
    } else {
      setSearchValue("");
      setUserGroups({
        groups: selectedUser.groups,
        allGroups: selectedUser.allGroups,
      });
      setPermissionGroups({
        roles: selectedUser.roles,
        allRoles: selectedUser.allRoles,
      });
    }
  }, 300);

  const tabs: TabProps[] = [
    {
      key: "groups",
      title: "Groups",
      count: userGroups.groups.length,
      panelComponent: (
        <ActiveAllGroupsList
          activeGroups={userGroups.groups}
          addedAllGroups={addedAllUserGroups}
          allGroups={userGroups.allGroups}
          entityName="group"
          onAddGroup={onAddGroup}
          onRemoveGroup={onRemoveGroup}
          removedActiveGroups={removedActiveUserGroups}
          searchValue={searchValue}
          title={`${selectedUser.name}'s groups`}
        />
      ),
    },
    {
      key: "roles",
      title: "Roles",
      count: permissionGroups.roles.length,
      panelComponent: (
        <ActiveAllGroupsList
          activeGroups={permissionGroups.roles}
          addedAllGroups={addedAllPermGroups}
          allGroups={permissionGroups.allRoles}
          entityName="role"
          onAddGroup={onAddGroup}
          onRemoveGroup={onRemoveGroup}
          removedActiveGroups={removedActivePermissionGroups}
          searchValue={searchValue}
          title={`${selectedUser.name}'s roles`}
        />
      ),
    },
  ];

  const menuItems: MenuItemProps[] = [
    {
      label: "delete",
      className: "delete-menu-item",
      icon: "delete-bin-line",
      onSelect: () => {
        onDeleteHandler();
      },
      text: createMessage(ACL_DELETE),
    },
  ];

  const [selectedTab, setSelectedTab] = useState<string>(tabs[0].key);

  const onTabChange = (value: string) => {
    setSelectedTab(value);
  };

  return (
    <div className="scrollable-wrapper" data-testid="t--user-edit-wrapper">
      <BackButton />
      <Header>
        <User data-testid="t--user-edit-userInfo">
          <AvatarComponent
            className="user-icons"
            label="user-avatar"
            size="md"
            source={
              selectedUser.photoId
                ? `/api/${USER_PHOTO_ASSET_URL}/${selectedUser.photoId}`
                : undefined
            }
            userName={selectedUser.username}
          />
          <Username>
            {selectedUser?.name && (
              <Name
                color="var(--ads-v2-color-fg-emphasis)"
                kind="heading-m"
                renderAs="p"
              >
                {selectedUser.name}
              </Name>
            )}
            <Text color="var(--ads-v2-color-fg)" renderAs="p">
              {selectedUser?.username}
            </Text>
          </Username>
        </User>
        <Container>
          <StyledSearchInput
            className="acl-search-input"
            data-testid={"t--acl-search-input"}
            onChange={onSearch}
            placeholder={searchPlaceholder}
            size="md"
            value={searchValue.toLowerCase()}
          />
          {menuItems && menuItems.length > 0 && (
            <Menu
              onOpenChange={(open: boolean) => {
                if (showOptions) {
                  setShowOptions(open);
                  showConfirmationText && setShowConfirmationText(false);
                }
              }}
              open={showOptions}
            >
              <MenuTrigger>
                <Button
                  className="actions-icon"
                  data-testid="actions-cell-menu-icon"
                  isIconButton
                  kind="tertiary"
                  onClick={() => setShowOptions(!showOptions)}
                  size="sm"
                  startIcon="more-2-fill"
                />
              </MenuTrigger>
              <MenuContent align="end">
                {menuItems.map((menuItem) => (
                  <MenuItem
                    className={`${menuItem.className} ${
                      menuItem.label === "delete" ? "error-menuitem" : ""
                    }`}
                    data-testid={`t--${menuItem.className}`}
                    key={menuItem.text}
                    onClick={menuItem.onSelect}
                    startIcon={menuItem.icon}
                  >
                    {showConfirmationText
                      ? createMessage(ARE_YOU_SURE)
                      : menuItem.text}
                  </MenuItem>
                ))}
              </MenuContent>
            </Menu>
          )}
        </Container>
      </Header>

      <StyledTabs
        data-testid="t--user-edit-tabs-wrapper"
        defaultValue={selectedTab}
        onValueChange={onTabChange}
      >
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
      {isEditing && (
        <SaveButtonBar onClear={onClearChanges} onSave={onSaveChanges} />
      )}
    </div>
  );
}

export default UserEdit;
