import React, { useState, useEffect } from "react";
import { useHistory } from "react-router";
import styled from "styled-components";
import { Position, Spinner } from "@blueprintjs/core";
import debounce from "lodash/debounce";
import { Variant } from "components/ads";
import {
  Icon,
  IconSize,
  MenuItem,
  MenuItemProps,
  Menu,
  SearchVariant,
  TabComponent,
  TabProp,
  Toaster,
} from "design-system";
import ProfileImage from "pages/common/ProfileImage";
import { ActiveAllGroupsList } from "./ActiveAllGroupsList";
import {
  TabsWrapper,
  HelpPopoverStyle,
  StyledSearchInput,
  SaveButtonBar,
} from "./components";
import {
  ARE_YOU_SURE,
  createMessage,
  ACL_DELETE,
  SUCCESSFULLY_SAVED,
} from "@appsmith/constants/messages";
import { BackButton } from "components/utils/helperComponents";
import { LoaderContainer } from "pages/Settings/components";
import {
  BaseAclProps,
  GroupsForUser,
  PermissionsForUser,
  UserEditProps,
} from "./types";
import { getFilteredData } from "./utils/getFilteredData";
import { useDispatch } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  updateGroupsInUser,
  updateRolesInUser,
} from "@appsmith/actions/aclActions";

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .actions-icon {
    > svg {
      path {
        fill: var(--appsmith-color-black-400);
      }

      &:hover {
        path {
          fill: var(--appsmith-color-black-700);
        }
      }
    }
  }
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

const Name = styled.div`
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.24px;
  margin-bottom: 4px;
`;

const Email = styled.div`
  letter-spacing: -0.24px;
  font-weight: 400;
  font-size: 13px;
  line-height: 17px;
`;

export function UserEdit(props: UserEditProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [showConfirmationText, setShowConfirmationText] = useState(false);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
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
  const [
    removedActivePermissionGroups,
    setRemovedActivePermissionGroups,
  ] = useState<BaseAclProps[]>([]);
  const [addedAllPermGroups, setAddedAllPermGroups] = useState<BaseAclProps[]>(
    [],
  );
  const dispatch = useDispatch();
  const { isLoading, isSaving, searchPlaceholder, selectedUser } = props;

  useEffect(() => {
    setUserGroups({
      groups: selectedUser.groups,
      allGroups: selectedUser.allGroups,
    });
    setPermissionGroups({
      roles: selectedUser.roles,
      allRoles: selectedUser.allRoles,
    });
  }, [selectedUser]);

  useEffect(() => {
    const saving =
      removedActiveUserGroups.length > 0 ||
      addedAllUserGroups.length > 0 ||
      removedActivePermissionGroups.length > 0 ||
      addedAllPermGroups.length > 0;
    dispatch({
      type: ReduxActionTypes.ACL_IS_SAVING,
      payload: {
        isSaving: saving,
      },
    });
  }, [
    removedActiveUserGroups,
    removedActivePermissionGroups,
    addedAllPermGroups,
    addedAllUserGroups,
  ]);

  const onAddGroup = (group: BaseAclProps) => {
    if (selectedTabIndex === 0) {
      const updateUserGroups =
        getFilteredData(addedAllUserGroups, group, true).length > 0
          ? getFilteredData(addedAllUserGroups, group, false)
          : [...addedAllUserGroups, group];
      setAddedAllUserGroups(updateUserGroups);
    } else if (selectedTabIndex === 1) {
      const updatePermissionGroups =
        getFilteredData(addedAllPermGroups, group, true).length > 0
          ? getFilteredData(addedAllPermGroups, group, false)
          : [...addedAllPermGroups, group];
      setAddedAllPermGroups(updatePermissionGroups);
    }
  };

  const onRemoveGroup = (group: BaseAclProps) => {
    if (selectedTabIndex === 0) {
      const updateUserGroups =
        getFilteredData(removedActiveUserGroups, group, true).length > 0
          ? getFilteredData(removedActiveUserGroups, group, false)
          : [...removedActiveUserGroups, group];
      setRemovedActiveUserGroups(updateUserGroups);
    } else if (selectedTabIndex === 1) {
      const updatePermissionGroups =
        getFilteredData(removedActivePermissionGroups, group, true).length > 0
          ? getFilteredData(removedActivePermissionGroups, group, false)
          : [...removedActivePermissionGroups, group];
      setRemovedActivePermissionGroups(updatePermissionGroups);
    }
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
      const groupsAdded = addedAllUserGroups.map(
        (group: BaseAclProps) => group.id,
      );
      const groupsRemoved = removedActiveUserGroups.map(
        (group: BaseAclProps) => group.id,
      );
      dispatch(
        updateGroupsInUser(
          selectedUser.id,
          selectedUser.username,
          groupsAdded,
          groupsRemoved,
        ),
      );
    } else if (onlyRolesUdated) {
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
          { id: selectedUser.id, name: selectedUser.name },
          rolesAdded,
          rolesRemoved,
        ),
      );
    } else if (bothGroupsRolesUpdated) {
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
      const groupsAdded = addedAllUserGroups.map(
        (group: BaseAclProps) => group.id,
      );
      const groupsRemoved = removedActiveUserGroups.map(
        (group: BaseAclProps) => group.id,
      );
      dispatch(
        updateGroupsInUser(
          selectedUser.id,
          selectedUser.username,
          groupsAdded,
          groupsRemoved,
        ),
      );
      dispatch(
        updateRolesInUser(
          { id: selectedUser.id, name: selectedUser.name },
          rolesAdded,
          rolesRemoved,
        ),
      );
    }
    setRemovedActiveUserGroups([]);
    setRemovedActivePermissionGroups([]);
    setAddedAllUserGroups([]);
    setAddedAllPermGroups([]);
    Toaster.show({
      text: createMessage(SUCCESSFULLY_SAVED),
      variant: Variant.success,
    });
  };

  const onClearChanges = () => {
    setRemovedActiveUserGroups([]);
    setRemovedActivePermissionGroups([]);
  };

  const onDeleteHandler = () => {
    if (showConfirmationText) {
      props.onDelete(selectedUser.id);
      history.push(`/settings/users`);
    } else {
      setShowOptions(true);
      setShowConfirmationText(true);
    }
  };

  const handleSearch = debounce((search: string) => {
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

  const tabs: TabProp[] = [
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
      className: "delete-menu-item",
      icon: "delete-blank",
      onSelect: () => {
        onDeleteHandler();
      },
      text: createMessage(ACL_DELETE),
    },
  ];

  return isLoading ? (
    <LoaderContainer>
      <Spinner />
    </LoaderContainer>
  ) : (
    <div className="scrollable-wrapper" data-testid="t--user-edit-wrapper">
      <BackButton />
      <Header>
        <User data-testid="t--user-edit-userInfo">
          <ProfileImage
            className="user-icons"
            size={64}
            source={`/api/v1/users/photo/${selectedUser.username}`}
            userName={selectedUser.username}
          />
          <Username>
            {selectedUser?.name && <Name>{selectedUser.name}</Name>}
            <Email>{selectedUser?.username}</Email>
          </Username>
        </User>
        <Container>
          <StyledSearchInput
            className="acl-search-input"
            data-testid={"t--acl-search-input"}
            onChange={handleSearch}
            placeholder={searchPlaceholder}
            variant={SearchVariant.BACKGROUND}
            width={"376px"}
          />
          <Menu
            canEscapeKeyClose
            canOutsideClickClose
            className="t--menu-actions-icon"
            isOpen={showOptions}
            menuItemWrapperWidth={"auto"}
            onClose={() => setShowOptions(false)}
            onClosing={() => {
              setShowConfirmationText(false);
              setShowOptions(false);
            }}
            onOpening={() => setShowOptions(true)}
            position={Position.BOTTOM_RIGHT}
            target={
              <Icon
                className="actions-icon"
                data-testid="actions-cell-menu-icon"
                name="more-2-fill"
                onClick={() => setShowOptions(!showOptions)}
                size={IconSize.XXL}
              />
            }
          >
            <HelpPopoverStyle />
            {menuItems &&
              menuItems.map((menuItem) => (
                <MenuItem
                  className={menuItem.className}
                  icon={menuItem.icon}
                  key={menuItem.text}
                  onSelect={menuItem.onSelect}
                  text={
                    showConfirmationText
                      ? createMessage(ARE_YOU_SURE)
                      : menuItem.text
                  }
                  {...(showConfirmationText ? { type: "warning" } : {})}
                />
              ))}
          </Menu>
        </Container>
      </Header>
      <TabsWrapper data-testid="t--user-edit-tabs-wrapper" isSaving={isSaving}>
        <TabComponent
          onSelect={setSelectedTabIndex}
          selectedIndex={selectedTabIndex}
          tabs={tabs}
        />
      </TabsWrapper>
      {isSaving && (
        <SaveButtonBar onClear={onClearChanges} onSave={onSaveChanges} />
      )}
    </div>
  );
}

export default UserEdit;
