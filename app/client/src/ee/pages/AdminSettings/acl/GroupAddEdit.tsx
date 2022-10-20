import React, { useEffect, useState } from "react";
import { Variant } from "components/ads";
import {
  Button,
  HighlightText,
  Icon,
  IconSize,
  Menu,
  MenuItem,
  MenuItemProps,
  TabComponent,
  Table,
  TabProp,
  Toaster,
} from "design-system";
import styled from "styled-components";
import { ActiveAllGroupsList } from "./ActiveAllGroupsList";
import { PageHeader } from "./PageHeader";
import ProfileImage from "pages/common/ProfileImage";
import { HelpPopoverStyle, SaveButtonBar, TabsWrapper } from "./components";
import { debounce } from "lodash";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import WorkspaceInviteUsersForm from "@appsmith/pages/workspace/WorkspaceInviteUsersForm";
import { useHistory, useParams } from "react-router";
import {
  BaseAclProps,
  GroupEditProps,
  Permissions,
  UsersInGroup,
} from "./types";
import { Position, Spinner } from "@blueprintjs/core";
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
  SUCCESSFULLY_SAVED,
} from "@appsmith/constants/messages";
import { BackButton } from "components/utils/helperComponents";
import { LoaderContainer } from "pages/Settings/components";
import { useDispatch } from "react-redux";
import {
  addUsersInGroup,
  removeUsersFromGroup,
  updateGroupName,
  updateRolesInGroup,
} from "@appsmith/actions/aclActions";
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
  const { isLoading, isNew = false, isSaving, selected } = props;
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
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

  const history = useHistory();
  const dispatch = useDispatch();
  const params = useParams() as any;

  useEffect(() => {
    const saving = removedActiveGroups.length > 0 || addedAllGroups.length > 0;
    dispatch({
      type: ReduxActionTypes.ACL_IS_SAVING,
      payload: {
        isSaving: saving,
      },
    });
  }, [removedActiveGroups, addedAllGroups]);

  useEffect(() => {
    setUsers(selected.users || []);
    setPermissions({
      roles: selected.roles || [],
      allRoles: selected.allRoles || [],
    });
  }, [selected]);

  const onButtonClick = () => {
    setShowModal(true);
  };

  const onSearch = debounce((search: string) => {
    let userResults: UsersInGroup[] = [];
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
        roles: permissions.roles.filter((permission: BaseAclProps) =>
          permission.name?.toLocaleUpperCase().includes(search),
        ),
        allRoles: permissions.allRoles.filter((permission: BaseAclProps) =>
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
    dispatch(
      updateRolesInGroup(
        { id: selected.id, name: selected.name },
        addedAllGroups.map((group: BaseAclProps) => ({
          id: group.id,
          name: group.name,
        })),
        removedActiveGroups.map((group: BaseAclProps) => ({
          id: group.id,
          name: group.name,
        })),
      ),
    );
    setRemovedActiveGroups([]);
    setAddedAllGroups([]);
    Toaster.show({
      text: createMessage(SUCCESSFULLY_SAVED),
      variant: Variant.success,
    });
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

  const onDeleteHandler = () => {
    props.onDelete && props.onDelete(selected.id);
    history.push(`/settings/groups`);
  };

  const onFormSubmitHandler = ({ ...values }) => {
    dispatch(
      addUsersInGroup(
        values.users ? values.users.split(",") : [],
        values?.options?.id || selected.id,
      ),
    );
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
              return user.username !== data.username;
            });
            setUsers(updatedData);
            dispatch(removeUsersFromGroup([data.username], selected.id));
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
          entityName="role"
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
      text: createMessage(ACL_RENAME),
      label: "rename",
    },
    {
      className: "delete-menu-item",
      icon: "delete-blank",
      onSelect: () => onDeleteHandler(),
      text: createMessage(ACL_DELETE),
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
        isEditingTitle={isNew}
        isTitleEditable
        onButtonClick={onButtonClick}
        onEditTitle={onEditTitle}
        onSearch={onSearch}
        pageMenuItems={menuItems}
        searchPlaceholder={createMessage(SEARCH_PLACEHOLDER)}
        title={selected?.name || ""}
      />
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
      <FormDialogComponent
        Form={WorkspaceInviteUsersForm}
        canOutsideClickClose
        customProps={{
          isAclFlow: true,
          disableEmailSetup: true,
          disableManageUsers: true,
          disableUserList: true,
          disableDropdown: true,
          message: createMessage(ACL_INVITE_MODAL_MESSAGE),
          onSubmitHandler: onFormSubmitHandler,
        }}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selected={selected}
        title={createMessage(ACL_INVITE_MODAL_TITLE)}
        trigger
      />
    </div>
  );
}
