import React, { useEffect, useState } from "react";
import { Table, Toaster, Variant } from "components/ads";
import {
  Button,
  HighlightText,
  Icon,
  IconSize,
  Menu,
  MenuItem,
  MenuItemProps,
} from "design-system";
import styled from "styled-components";
import { TabComponent, TabProp } from "components/ads/Tabs";
import { ActiveAllGroupsList } from "./ActiveAllGroupsList";
import { PageHeader } from "./PageHeader";
import ProfileImage from "pages/common/ProfileImage";
import { HelpPopoverStyle, SaveButtonBar, TabsWrapper } from "./components";
import { debounce } from "lodash";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import WorkspaceInviteUsersForm from "@appsmith/pages/workspace/WorkspaceInviteUsersForm";
import { useHistory } from "react-router";
import { BaseAclProps, GroupEditProps, Permissions, UserProps } from "./types";
import { Position, Spinner } from "@blueprintjs/core";
import {
  ADD_USERS,
  ARE_YOU_SURE,
  createMessage,
  DELETE_GROUP,
  INVITE_USERS_SUBMIT_BUTTON_TEXT,
  NO_USERS_MESSAGE,
  RENAME_GROUP,
  SEARCH_PLACEHOLDER,
  REMOVE_USER,
  GROUP_UPDATED_SUCCESS,
} from "@appsmith/constants/messages";
import { BackButton } from "components/utils/helperComponents";
import { LoaderContainer } from "pages/Settings/components";
import { useDispatch } from "react-redux";
import { updateGroupById } from "@appsmith/actions/aclActions";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { getFilteredData } from "./utils/getFilteredData";

const ListUsers = styled.div`
  margin-top: 4px;

  thead {
    display: none;
  }

  tbody {
    tr {
      td {
        .actions-icon {
          visibility: hidden;
          justify-content: end;
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
    margin-right 8px;
    cursor: initial;

    span {
      color: var(--appsmith-color-black-0);
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
  min-width: 88px;
`;

const NoUsersText = styled.div`
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  color: var(--appsmith-color-black-700);
`;

export function GroupAddEdit(props: GroupEditProps) {
  const { isLoading, isSaving, selected } = props;
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [users, setUsers] = useState<UserProps[]>(selected.users || []);
  const [permissions, setPermissions] = useState<Permissions>({
    roles: selected.roles || [],
    allRoles: selected.allRoles || [],
  });

  const [removedActiveGroups, setRemovedActiveGroups] = useState<
    BaseAclProps[]
  >([]);
  const [addedAllGroups, setAddedAllGroups] = useState<BaseAclProps[]>([]);
  const [pageTitle, setPageTitle] = useState(selected.name);

  const history = useHistory();
  const dispatch = useDispatch();

  useEffect(() => {
    const saving =
      removedActiveGroups.length > 0 ||
      addedAllGroups.length > 0 ||
      pageTitle !== selected.name;
    dispatch({
      type: ReduxActionTypes.ACL_GROUP_IS_SAVING,
      payload: {
        isSaving: saving,
      },
    });
  }, [removedActiveGroups, addedAllGroups, pageTitle]);

  useEffect(() => {
    setUsers(selected.users || []);
    setPermissions({
      roles: selected.roles || [],
      allRoles: selected.allRoles || [],
    });
    setPageTitle(selected.name || "");
  }, [selected]);

  const onButtonClick = () => {
    setShowModal(true);
  };

  const onSearch = debounce((search: string) => {
    let userResults: UserProps[] = [];
    let permissionResults: Permissions;
    if (search && search.trim().length > 0) {
      setSearchValue(search);
      userResults =
        users &&
        users.filter((user) =>
          user.username?.toLocaleUpperCase().includes(search),
        );
      setUsers(userResults);
      permissionResults = permissions && {
        roles: permissions.roles.filter((permission) =>
          permission.name?.toLocaleUpperCase().includes(search),
        ),
        allRoles: permissions.allRoles.filter((permission: any) =>
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
    const updatedActiveGroups = permissions.roles.filter(
      (role) => !(getFilteredData(removedActiveGroups, role, true).length > 0),
    );
    updatedActiveGroups.push(...addedAllGroups);
    const updatedAllGroups = permissions.allRoles.filter(
      (role) => !(getFilteredData(addedAllGroups, role, true).length > 0),
    );
    updatedAllGroups.push(...removedActiveGroups);
    setPermissions({
      roles: updatedActiveGroups,
      allRoles: updatedAllGroups,
    });
    setRemovedActiveGroups([]);
    setAddedAllGroups([]);
    dispatch(
      updateGroupById({
        ...selected,
        allRoles: updatedAllGroups,
        roles: updatedActiveGroups,
        name: pageTitle,
      }),
    );
    Toaster.show({
      text: createMessage(GROUP_UPDATED_SUCCESS),
      variant: Variant.success,
    });
  };

  const onClearChanges = () => {
    setRemovedActiveGroups([]);
    setAddedAllGroups([]);
    setPageTitle(selected.name);
  };

  const onEditTitle = (name: string) => {
    setPageTitle(name);
  };

  const onDeleteHandler = () => {
    props.onDelete && props.onDelete(selected.id);
    history.push(`/settings/groups`);
  };

  const columns = [
    {
      Header: "",
      accessor: "users",
      Cell: function UserCell(props: any) {
        const user = props.cell.row.original;
        return (
          <EachUser>
            <ProfileImage
              className="user-icons"
              size={20}
              source={`/api/v1/users/photo/${user.username}`}
              userName={user.username}
            />
            <HighlightText highlight={searchValue} text={user.username} />
          </EachUser>
        );
      },
    },
    {
      Header: "",
      accessor: "actions",
      Cell: function ActionsCell(props: any) {
        const data = props.cell.row.original;
        const [showOptions, setShowOptions] = useState(false);
        const [showConfirmationText, setShowConfirmationText] = useState(false);

        const onOptionSelect = () => {
          if (showConfirmationText) {
            const updatedData = users.filter((user) => {
              return user.userId !== data.userId;
            });
            setUsers(updatedData);
          } else {
            setShowOptions(true);
            setShowConfirmationText(true);
          }
        };

        return (
          <Menu
            canEscapeKeyClose
            canOutsideClickClose
            className="t--menu-actions-icon"
            data-testid="actions-cell-menu-options"
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
                className={`actions-icon ${showOptions && "active"}`}
                data-testid="actions-cell-menu-icon"
                name="more-2-fill"
                onClick={() => setShowOptions(!showOptions)}
                size={IconSize.XXL}
              />
            }
          >
            <HelpPopoverStyle />
            <MenuItem
              className={"delete-menu-item"}
              icon={"delete-blank"}
              key={createMessage(REMOVE_USER)}
              onSelect={() => {
                onOptionSelect();
              }}
              text={
                showConfirmationText
                  ? createMessage(ARE_YOU_SURE)
                  : createMessage(REMOVE_USER)
              }
              {...(showConfirmationText ? { type: "warning" } : {})}
            />
          </Menu>
        );
      },
    },
  ];

  const tabs: TabProp[] = [
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
              <NoUsersText data-testid="t--no-users-msg">
                {createMessage(NO_USERS_MESSAGE)}
              </NoUsersText>
              <StyledButton
                data-testid="t--add-users-button"
                height="36"
                onClick={onButtonClick}
                tag="button"
                text={createMessage(ADD_USERS)}
              />
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
          onAddGroup={onAddGroup}
          onRemoveGroup={onRemoveGroup}
          removedActiveGroups={removedActiveGroups}
          searchValue={searchValue}
        />
      ),
    },
  ];

  const menuItems: MenuItemProps[] = [
    {
      className: "rename-menu-item",
      icon: "edit-underline",
      text: createMessage(RENAME_GROUP),
      label: "rename",
    },
    {
      className: "delete-menu-item",
      icon: "delete-blank",
      onSelect: () => onDeleteHandler(),
      text: createMessage(DELETE_GROUP),
      label: "delete",
    },
  ];

  return isLoading ? (
    <LoaderContainer>
      <Spinner />
    </LoaderContainer>
  ) : (
    <div className="scrollable-wrapper" data-testid="t--user-edit-wrapper">
      <BackButton />
      <PageHeader
        buttonText={createMessage(ADD_USERS)}
        isEditingTitle={selected.new}
        isTitleEditable
        onButtonClick={onButtonClick}
        onEditTitle={onEditTitle}
        onSearch={onSearch}
        pageMenuItems={menuItems}
        searchPlaceholder={createMessage(SEARCH_PLACEHOLDER)}
        title={pageTitle}
      />
      <TabsWrapper data-testid="t--user-edit-tabs-wrapper">
        <TabComponent
          onSelect={setSelectedTabIndex}
          selectedIndex={selectedTabIndex}
          tabs={tabs}
        />
      </TabsWrapper>
      {isSaving && (
        <SaveButtonBar onClear={onClearChanges} onSave={onSaveChanges} />
      )}
      <FormDialogComponent
        Form={WorkspaceInviteUsersForm}
        canOutsideClickClose
        customProps={{
          isAclFlow: true,
          disableEmailSetup: true,
          disableManageUsers: true,
          disableUserList: true,
          isMultiSelectDropdown: true,
          disableDropdown: true,
        }}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={createMessage(INVITE_USERS_SUBMIT_BUTTON_TEXT)}
        trigger
      />
    </div>
  );
}
