import React, { useEffect, useState } from "react";
import { HighlightText, Table } from "design-system-old";
import styled from "styled-components";
import { ActiveAllGroupsList } from "./ActiveAllGroupsList";
import { PageHeader } from "./PageHeader";
import { SaveButtonBar, StyledTabs } from "./components";
import { debounce } from "lodash";
import WorkspaceInviteUsersForm from "@appsmith/pages/workspace/WorkspaceInviteUsersForm";
import { useHistory, useParams } from "react-router";
import type {
  BaseAclProps,
  GroupEditProps,
  Permissions,
  TabProps,
  UsersInGroup,
} from "./types";
import {
  ACL_INVITE_MODAL_MESSAGE,
  ACL_INVITE_MODAL_TITLE,
  ADD_USERS,
  ARE_YOU_SURE,
  createMessage,
  ACL_DELETE,
  NO_USERS_MESSAGE,
  ACL_RENAME,
  SEARCH_PLACEHOLDER,
  REMOVE_USER,
  EVENT_GROUP_ADD_USER_EMPTY_STATE,
  EVENT_GROUP_ADD_USER_TOP_BAR,
  EVENT_GROUP_INVITE_USER_TOP_BAR,
  EVENT_GROUP_INVITE_USER_EMPTY_STATE,
  ACL_EDIT_DESC,
} from "@appsmith/constants/messages";
import { BackButton } from "components/utils/helperComponents";
import { useDispatch, useSelector } from "react-redux";
import {
  addUsersInGroup,
  removeUsersFromGroup,
  updateGroupName,
  updateRolesInGroup,
} from "@appsmith/actions/aclActions";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { getFilteredData } from "./utils/getFilteredData";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import {
  getAclIsEditing,
  getGroupPermissions,
} from "@appsmith/selectors/aclSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
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
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "design-system";
import { AvatarComponent } from "pages/common/AvatarComponent";

const ListUsers = styled.div`
  margin-top: 4px;

  thead {
    display: none;
  }

  tbody {
    tr {
      td {
        &:last-child {
          text-align: right;
        }

        .actions-icon {
          visibility: hidden;
          &.active {
            visibility: visible;
          }
        }
      }

      &:hover {
        td {
          .actions-icon {
            visibility: visible;
          }
        }
      }
    }
  }
`;

const EachUser = styled.div`
  display: flex;
  align-items: center;

  .user-icons {
    margin-right: 8px;
    cursor: initial;

    span {
      color: var(--ads-v2-color-fg);
    }
  }
`;

const NoUsersWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 56px 0;
`;

const StyledButton = styled(Button)`
  flex: 1 0 auto;
  margin: 16px 12px 0 0;
`;

export function GroupAddEdit(props: GroupEditProps) {
  const { selected } = props;
  const { isNew = false } = selected;
  const [showModal, setShowModal] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [users, setUsers] = useState<UsersInGroup[]>(selected.users || []);
  const [permissions, setPermissions] = useState<Permissions>({
    roles: selected.roles || [],
    allRoles: selected.allRoles || [],
  });

  const [removedActiveGroups, setRemovedActiveGroups] = useState<
    BaseAclProps[]
  >([]);
  const [addedAllGroups, setAddedAllGroups] = useState<BaseAclProps[]>([]);
  const [originAddUsers, setOriginAddUsers] = useState<string>("top-bar");

  const history = useHistory();
  const dispatch = useDispatch();
  const params = useParams() as any;

  const isEditing = useSelector(getAclIsEditing);
  const userPermissions = useSelector(getGroupPermissions);

  const canAddUsersToGroup = isPermitted(
    userPermissions,
    PERMISSION_TYPE.ADD_USERS_TO_USERGROUPS,
  );

  const canManageGroup = isPermitted(
    userPermissions,
    PERMISSION_TYPE.MANAGE_USERGROUPS,
  );

  const canDeleteGroup = isPermitted(
    userPermissions,
    PERMISSION_TYPE.DELETE_USERGROUPS,
  );

  const canRemoveUserFromGroup = isPermitted(
    userPermissions,
    PERMISSION_TYPE.REMOVE_USERS_FROM_USERGROUPS,
  );

  useEffect(() => {
    const saving = removedActiveGroups.length > 0 || addedAllGroups.length > 0;
    dispatch({
      type: ReduxActionTypes.ACL_IS_EDITING,
      payload: saving,
    });
  }, [removedActiveGroups, addedAllGroups]);

  useEffect(() => {
    if (searchValue) {
      onSearch(searchValue);
    } else {
      setUsers(selected.users || []);
      setPermissions({
        roles: selected.roles || [],
        allRoles: selected.allRoles || [],
      });
    }
  }, [selected]);

  const onButtonClick = (isTopBar: boolean) => {
    setShowModal(true);
    setOriginAddUsers(isTopBar ? "top-bar" : "empty-state");
    AnalyticsUtil.logEvent("GAC_ADD_USER_CLICK", {
      origin: isTopBar
        ? createMessage(EVENT_GROUP_ADD_USER_TOP_BAR)
        : createMessage(EVENT_GROUP_ADD_USER_EMPTY_STATE),
    });
  };

  const onSearch = debounce((search: string) => {
    let userResults: UsersInGroup[] = [];
    let permissionResults: Permissions;
    if (search && search.trim().length > 0) {
      setSearchValue(search);
      userResults =
        selected.users &&
        selected.users.filter((user) =>
          user.username?.toLocaleUpperCase().includes(search),
        );
      setUsers(userResults);
      permissionResults = permissions && {
        roles: selected.roles.filter((permission: BaseAclProps) =>
          permission.name?.toLocaleUpperCase().includes(search),
        ),
        allRoles: selected.allRoles.filter((permission: BaseAclProps) =>
          permission.name?.toLocaleUpperCase().includes(search),
        ),
      };
      setPermissions({ ...permissionResults });
    } else {
      setSearchValue("");
      setUsers(selected.users);
      setPermissions({
        roles: selected.roles || [],
        allRoles: selected.allRoles || [],
      });
    }
  }, 300);

  const onAddGroup = (group: BaseAclProps) => {
    if (getFilteredData(addedAllGroups, group, true).length > 0) {
      const updateGroups = getFilteredData(addedAllGroups, group, false);
      setAddedAllGroups(updateGroups);
    } else {
      setAddedAllGroups([...addedAllGroups, group]);
    }
  };

  const onRemoveGroup = (group: BaseAclProps) => {
    if (getFilteredData(removedActiveGroups, group, true).length > 0) {
      const updateGroups = getFilteredData(removedActiveGroups, group, false);
      setRemovedActiveGroups(updateGroups);
    } else {
      setRemovedActiveGroups([...removedActiveGroups, group]);
    }
  };

  const onSaveChanges = () => {
    const rolesAdded = addedAllGroups.map((group: BaseAclProps) => ({
      id: group.id,
      name: group.name,
    }));
    const rolesRemoved = removedActiveGroups.map((group: BaseAclProps) => ({
      id: group.id,
      name: group.name,
    }));
    dispatch(
      updateRolesInGroup(
        { id: selected.id, name: selected.name },
        rolesAdded,
        rolesRemoved,
      ),
    );
    setRemovedActiveGroups([]);
    setAddedAllGroups([]);
  };

  const onClearChanges = () => {
    setRemovedActiveGroups([]);
    setAddedAllGroups([]);
  };

  const onEditTitle = (name: string) => {
    if (selected.name !== name) {
      dispatch(
        updateGroupName({
          id: selected.id || params.selected,
          name,
        }),
      );
    }
  };

  const onEditDesc = (desc: string) => {
    if (selected.description !== desc) {
      dispatch(
        updateGroupName({
          id: selected.id || params.selected,
          name: selected.name,
          description: desc,
        }),
      );
    }
  };

  const onDeleteHandler = () => {
    props.onDelete && props.onDelete(selected.id);
    history.push(`/settings/groups`);
  };

  const onFormSubmitHandler = ({ ...values }) => {
    const usernames = values.users ? values.users.split(",") : [];
    const groupId = values?.options?.id || selected.id;
    AnalyticsUtil.logEvent("GAC_INVITE_USER_CLICK", {
      origin:
        originAddUsers === "top-bar"
          ? createMessage(EVENT_GROUP_INVITE_USER_TOP_BAR)
          : createMessage(EVENT_GROUP_INVITE_USER_EMPTY_STATE),
      groups: [groupId],
      roles: [],
      numberOfUsersInvited: usernames.length,
    });
    dispatch(addUsersInGroup(usernames, groupId));
    setShowModal(false);
  };

  const columns = [
    {
      Header: "",
      accessor: "users",
      Cell: function UserCell(props: any) {
        const user = props.cell.row.original;
        return (
          <EachUser>
            <AvatarComponent
              className="user-icons"
              size="sm"
              source={
                user.photoId
                  ? `/api/${USER_PHOTO_ASSET_URL}/${user.photoId}`
                  : undefined
              }
              userName={user.username}
            />
            <HighlightText highlight={searchValue} text={user.username} />
          </EachUser>
        );
      },
    },
    canRemoveUserFromGroup && {
      Header: "",
      accessor: "actions",
      Cell: function ActionsCell(props: any) {
        const data = props.cell.row.original;
        const [showOptions, setShowOptions] = useState(false);
        const [showConfirmationText, setShowConfirmationText] = useState(false);

        const onOptionSelect = () => {
          if (showConfirmationText) {
            const updatedData = users.filter((user) => {
              return user.username !== data.username;
            });
            setUsers(updatedData);
            dispatch(removeUsersFromGroup([data.username], selected.id));
          } else {
            setTimeout(() => {
              setShowOptions(true);
              setShowConfirmationText(true);
            }, 0);
          }
        };

        return (
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
                className={`actions-icon ${showOptions && "active"}`}
                data-testid="actions-cell-menu-icon"
                isIconButton
                kind="tertiary"
                onClick={() => setShowOptions(!showOptions)}
                size="sm"
                startIcon="more-2-fill"
              />
            </MenuTrigger>
            <MenuContent align="end">
              <MenuItem
                className={"delete-menu-item error-menuitem"}
                data-testid={`t--delete-menu-item`}
                key={createMessage(REMOVE_USER)}
                onClick={() => {
                  onOptionSelect();
                }}
                startIcon={"delete-bin-line"}
              >
                {showConfirmationText
                  ? createMessage(ARE_YOU_SURE)
                  : createMessage(REMOVE_USER)}
              </MenuItem>
            </MenuContent>
          </Menu>
        );
      },
    },
  ].filter(Boolean);

  const tabs: TabProps[] = [
    {
      key: "users",
      title: "Users",
      count: users.length,
      panelComponent: (
        <ListUsers>
          {users && users.length > 0 ? (
            <Table columns={columns} data={users} data-testid="listing-table" />
          ) : (
            <NoUsersWrapper>
              <Text data-testid="t--no-users-msg" kind="action-l" renderAs="p">
                {createMessage(NO_USERS_MESSAGE)}
              </Text>
              <StyledButton
                data-testid="t--add-users-button"
                isDisabled={!canAddUsersToGroup}
                onClick={() => onButtonClick(false)}
                size="md"
              >
                {createMessage(ADD_USERS)}
              </StyledButton>
            </NoUsersWrapper>
          )}
        </ListUsers>
      ),
    },
    {
      key: "permissions",
      title: "Roles",
      count: permissions.roles.length,
      panelComponent: (
        <ActiveAllGroupsList
          activeGroups={permissions.roles}
          addedAllGroups={addedAllGroups}
          allGroups={permissions.allRoles}
          entityName="role"
          onAddGroup={onAddGroup}
          onRemoveGroup={onRemoveGroup}
          removedActiveGroups={removedActiveGroups}
          searchValue={searchValue}
        />
      ),
    },
  ];

  const [selectedTab, setSelectedTab] = useState<string>(tabs[0].key);

  const onTabChange = (value: string) => {
    setSelectedTab(value);
  };

  const menuItems: any[] = [
    canManageGroup && {
      className: "rename-menu-item",
      icon: "pencil-line",
      text: createMessage(ACL_RENAME),
      label: "rename",
    },
    canManageGroup && {
      className: "rename-desc-menu-item",
      icon: "pencil-line",
      text: createMessage(ACL_EDIT_DESC),
      label: "rename-desc",
    },
    canDeleteGroup && {
      className: "delete-menu-item",
      icon: "delete-bin-line",
      onSelect: () => onDeleteHandler(),
      text: createMessage(ACL_DELETE),
      label: "delete",
    },
  ].filter(Boolean);

  return (
    <div className="scrollable-wrapper" data-testid="t--user-edit-wrapper">
      <BackButton />
      <PageHeader
        buttonText={selected?.users?.length > 0 ? createMessage(ADD_USERS) : ""}
        description={selected.description}
        disableButton={!canAddUsersToGroup}
        isEditingTitle={isNew}
        isHeaderEditable={canManageGroup}
        onButtonClick={() => onButtonClick(true)}
        onEditDesc={onEditDesc}
        onEditTitle={onEditTitle}
        onSearch={onSearch}
        pageMenuItems={menuItems}
        searchPlaceholder={createMessage(SEARCH_PLACEHOLDER)}
        searchValue={searchValue}
        title={selected?.name || ""}
      />
      <StyledTabs
        data-testid="t--user-edit-tabs-wrapper"
        defaultValue={selectedTab}
        isEditing={isEditing}
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
            <TabPanel className="tab-panel" key={tab.key} value={tab.key}>
              {tab.panelComponent}
            </TabPanel>
          );
        })}
      </StyledTabs>
      {isEditing && (
        <SaveButtonBar onClear={onClearChanges} onSave={onSaveChanges} />
      )}
      <Modal onOpenChange={(isOpen) => setShowModal(isOpen)} open={showModal}>
        <ModalContent
          data-testid="t--dialog-component"
          style={{ width: "640px" }}
        >
          <ModalHeader>{createMessage(ACL_INVITE_MODAL_TITLE)}</ModalHeader>
          <ModalBody>
            <WorkspaceInviteUsersForm
              customProps={{
                isAclFlow: true,
                disableManageUsers: true,
                disableUserList: true,
                disableDropdown: true,
                message: createMessage(ACL_INVITE_MODAL_MESSAGE),
                onSubmitHandler: onFormSubmitHandler,
              }}
              selected={selected}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
