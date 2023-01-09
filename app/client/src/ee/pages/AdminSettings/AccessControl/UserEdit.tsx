import React, { useState, useEffect } from "react";
import { useHistory } from "react-router";
import styled from "styled-components";
import { Position, Spinner } from "@blueprintjs/core";
import debounce from "lodash/debounce";
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
  Variant,
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
import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  updateGroupsInUser,
  updateRolesInUser,
} from "@appsmith/actions/aclActions";
import { getAclIsEditing } from "@appsmith/selectors/aclSelectors";

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
  const { isLoading, searchPlaceholder, selectedUser } = props;

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
    Toaster.show({
      text: createMessage(SUCCESSFULLY_SAVED),
      variant: Variant.success,
    });
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
      setShowOptions(true);
      setShowConfirmationText(true);
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
            defaultValue={searchValue.toLowerCase()}
            onChange={onSearch}
            placeholder={searchPlaceholder}
            variant={SearchVariant.BACKGROUND}
            width={"376px"}
          />
          {menuItems && menuItems.length > 0 && (
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
              {menuItems.map((menuItem) => (
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
          )}
        </Container>
      </Header>
      <TabsWrapper
        data-testid="t--user-edit-tabs-wrapper"
        isEditing={isEditing}
      >
        <TabComponent
          onSelect={setSelectedTabIndex}
          selectedIndex={selectedTabIndex}
          tabs={tabs}
        />
      </TabsWrapper>
      {isEditing && (
        <SaveButtonBar onClear={onClearChanges} onSave={onSaveChanges} />
      )}
    </div>
  );
}

export default UserEdit;
