export * from "ce/pages/workspace/Members";
import type { PageProps } from "ce/pages/workspace/Members";
import {
  EachUser,
  MembersWrapper,
  NoResultsText,
  UserCard,
  UserCardContainer,
  DeleteIcon,
  StyledText,
  RowWrapper,
} from "ce/pages/workspace/Members";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllUsers,
  getAllRoles,
  getCurrentWorkspace,
  getWorkspaceLoadingStates,
} from "@appsmith/selectors/workspaceSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import {
  fetchUsersForWorkspace,
  fetchRolesForWorkspace,
  fetchWorkspace,
  changeWorkspaceUserRole,
  deleteWorkspaceUser,
} from "@appsmith/actions/workspaceActions";
import { HighlightText, Table } from "design-system-old";
import DeleteConfirmationModal from "pages/workspace/DeleteConfirmationModal";
import { useMediaQuery } from "react-responsive";
import { USER_PHOTO_ASSET_URL } from "constants/userConstants";
import { ENTITY_TYPE } from "@appsmith/constants/workspaceConstants";
import type { WorkspaceUser } from "@appsmith/constants/workspaceConstants";
import {
  createMessage,
  MEMBERS_TAB_TITLE,
  NO_SEARCH_DATA_TEXT,
} from "@appsmith/constants/messages";
import { getAppsmithConfigs } from "@appsmith/configs";
import styled from "styled-components";
import { showAdminSettings } from "@appsmith/utils/adminSettingsHelpers";
import { useHistory } from "react-router";
import {
  changeApplicationUserRole,
  deleteApplicationUser,
  fetchDefaultRolesForApplication,
} from "@appsmith/actions/applicationActions";
import { getAllAppRoles } from "@appsmith/selectors/applicationSelectors";
import { APPLICATIONS_URL } from "constants/routes";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import type { SelectOptionProps } from "design-system";
import { Avatar, Button, Icon, Option, Select, Text } from "design-system";
import { getInitials } from "utils/AppsmithUtils";

const { cloudHosting } = getAppsmithConfigs();

const Delimeter = styled.div`
  border-left: 1px solid var(--ads-v2-color-border);
  height: 100%;
  padding-right: 8px;
  text-align: center;
  margin: 0 4px 0 12px;
`;

const StyledSelect = styled(Select)`
  .rc-select-selection-item {
    .ads-v2-text {
      color: var(--ads-v2-color-fg);
      font-weight: normal;

      &.description {
        display: none;
      }
    }
  }
`;

export default function MemberSettings(props: PageProps) {
  const {
    match: {
      params: { workspaceId },
    },
    searchValue = "",
  } = props;

  const dispatch = useDispatch();
  const history = useHistory();

  const [showMemberDeletionConfirmation, setShowMemberDeletionConfirmation] =
    useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const onOpenConfirmationModal = () => setShowMemberDeletionConfirmation(true);
  const onCloseConfirmationModal = () =>
    setShowMemberDeletionConfirmation(false);

  const [userToBeDeleted, setUserToBeDeleted] = useState<{
    name: string;
    username: string;
    workspaceId: string;
    userGroupId: string;
    entityId?: string;
    entityType?: string;
  } | null>(null);

  const onConfirmMemberDeletion = (
    name: string,
    username: string,
    workspaceId: string,
    userGroupId: string,
    entityId?: string,
    entityType?: string,
  ) => {
    setUserToBeDeleted({
      name,
      username,
      workspaceId,
      userGroupId,
      entityId,
      entityType,
    });
    onOpenConfirmationModal();
  };

  const onDeleteMember = (data?: any) => {
    if (!userToBeDeleted && !data) return null;
    const userData = userToBeDeleted || data;
    if (
      userData?.entityId &&
      userData?.entityType &&
      userData?.entityType !== ENTITY_TYPE.WORKSPACE
    ) {
      dispatch(
        deleteApplicationUser(
          userData?.entityId || userData?.entityId,
          userData?.username,
          userData?.userGroupId,
        ),
      );
    } else {
      dispatch(
        deleteWorkspaceUser(
          userData?.workspaceId,
          userData?.username,
          userData?.userGroupId,
        ),
      );
    }
  };

  const {
    deletingUserInfo,
    isFetchingAllRoles,
    isFetchingAllUsers,
    roleChangingUserInfo,
  } = useSelector(getWorkspaceLoadingStates);
  const allRoles = useSelector(getAllRoles);
  const allUsers = useSelector(getAllUsers);
  const currentUser = useSelector(getCurrentUser);
  const currentWorkspace = useSelector(getCurrentWorkspace).find(
    (el) => el.id === workspaceId,
  );

  const isMemberofTheWorkspace = isPermitted(
    currentWorkspace?.userPermissions || [],
    PERMISSION_TYPE.INVITE_USER_TO_WORKSPACE,
  );
  const hasManageWorkspacePermissions = isPermitted(
    currentWorkspace?.userPermissions,
    PERMISSION_TYPE.MANAGE_WORKSPACE,
  );
  const isAppInvite = !cloudHosting;

  useEffect(() => {
    if (
      currentWorkspace &&
      (!isMemberofTheWorkspace || !hasManageWorkspacePermissions)
    ) {
      history.replace(APPLICATIONS_URL);
    }
  }, [currentWorkspace, isMemberofTheWorkspace, hasManageWorkspacePermissions]);

  useEffect(() => {
    dispatch(fetchUsersForWorkspace(workspaceId));
    dispatch(fetchRolesForWorkspace(workspaceId));
    dispatch(fetchWorkspace(workspaceId));

    if (isAppInvite) {
      dispatch(fetchDefaultRolesForApplication());
    }
  }, [dispatch, workspaceId, isAppInvite]);

  useEffect(() => {
    if (!!userToBeDeleted && showMemberDeletionConfirmation) {
      const userBeingDeleted = allUsers.find((user) => user.isDeleting);
      if (!userBeingDeleted) {
        setUserToBeDeleted(null);
        onCloseConfirmationModal();
        setIsDeletingUser(false);
      } else {
        setIsDeletingUser(userBeingDeleted.isDeleting);
      }
    }
  }, [allUsers]);

  const membersData = useMemo(
    () =>
      allUsers.map((user) => ({
        ...user,
        isCurrentUser: user.username === currentUser?.username,
        permissionGroupId: user.roles?.[0]?.id || "",
        permissionGroupName: user.roles?.[0]?.name || "",
        entityType: user.roles?.[0]?.entityType || "",
        entityName: user.roles?.[0]?.entityName || "",
        entityId: user.roles?.[0]?.entityId || "",
        autoCreated: user.roles?.[0]?.autoCreated || "",
        ...(user.roles?.length > 1 && isAppInvite
          ? {
              subRows: user.roles
                .map((role, index) => {
                  if (index !== 0) {
                    return {
                      ...user,
                      isCurrentUser: user.username === currentUser?.username,
                      permissionGroupId: role.id,
                      permissionGroupName: role.name,
                      entityType: role.entityType || "",
                      entityName: role.entityName || "",
                      entityId: role.entityId || "",
                      autoCreated: role.autoCreated || "",
                    };
                  }
                })
                .filter(Boolean),
            }
          : {}),
      })),
    [allUsers, currentUser],
  );

  const [filteredData, setFilteredData] = useState<WorkspaceUser[]>([]);

  const getFilteredUsers = () =>
    membersData.filter((member) => {
      return (
        member?.username?.toLowerCase().includes(searchValue?.toLowerCase()) ||
        member?.name?.toLowerCase().includes(searchValue?.toLowerCase())
      );
    });

  useEffect(() => {
    if (searchValue) {
      const filteredUsers = getFilteredUsers();
      setFilteredData(filteredUsers);
    } else {
      setFilteredData(membersData);
    }
  }, [searchValue, membersData]);

  const columns = [
    {
      Header: createMessage(() =>
        MEMBERS_TAB_TITLE(filteredData?.length, cloudHosting),
      ),
      accessor: "users",
      Cell: function UserCell(props: any) {
        const member = props.cell.row.original;
        const isUserGroup = member.hasOwnProperty("userGroupId");
        const isNotSubRow = props.cell.row.id.split(".").length === 1;
        return isNotSubRow ? (
          <EachUser>
            {isUserGroup ? (
              <>
                <Icon
                  className="user-group-icons"
                  name="group-line"
                  size="md"
                />
                <HighlightText highlight={searchValue} text={member.name} />
              </>
            ) : (
              <>
                <Avatar
                  className="user-icons"
                  firstLetter={getInitials(member.username)}
                  image={
                    member.photoId
                      ? `/api/${USER_PHOTO_ASSET_URL}/${member.photoId}`
                      : undefined
                  }
                  label={member.username}
                  size="sm"
                />
                <HighlightText highlight={searchValue} text={member.username} />
              </>
            )}
          </EachUser>
        ) : null;
      },
    },
    {
      Header: "Resource",
      accessor: "resource",
      Cell: function ResourceCell(cellProps: any) {
        const isSubRow = cellProps.cell.row.id.split(".").length > 1;
        const del: JSX.Element[] = [];
        for (let i = 0; i < cellProps.row.depth; i++) {
          del.push(<Delimeter key={i} />);
        }
        return cellProps.row.canExpand ? (
          <RowWrapper
            {...cellProps.row.getToggleRowExpandedProps({ title: undefined })}
          >
            {cellProps.row.isExpanded ? (
              <Icon className="expand-more" name="expand-more" size="md" />
            ) : (
              <Icon className="right-arrow-2" name="right-arrow-2" size="md" />
            )}
            <div className="resource-name">
              {(cellProps.cell.row.original?.entityType ===
              ENTITY_TYPE.WORKSPACE
                ? cellProps.cell.row.original?.entityType
                : cellProps.cell.row.original?.entityName) || "Workspace"}
            </div>
          </RowWrapper>
        ) : (
          <RowWrapper isSubRow={isSubRow}>
            {cellProps.row.depth ? del : null}
            <div className="resource-name">
              {(cellProps.cell.row.original?.entityType ===
              ENTITY_TYPE.WORKSPACE
                ? cellProps.cell.row.original?.entityType
                : cellProps.cell.row.original?.entityName) || "Workspace"}
            </div>
          </RowWrapper>
        );
      },
    },
    {
      Header: "Role",
      accessor: "permissionGroupName",
      Cell: function DropdownCell(cellProps: any) {
        const { entityId, entityType, userGroupId, username } =
          cellProps.cell.row.original;
        const allRoles = useSelector(
          entityType === ENTITY_TYPE.WORKSPACE ? getAllRoles : getAllAppRoles,
        );
        const roles = allRoles
          ? allRoles.map((role: any) => {
              return {
                key:
                  entityId && entityType && entityType !== ENTITY_TYPE.WORKSPACE
                    ? role.name?.split(" - ")[0]
                    : role.id,
                value: role.name?.split(" - ")[0],
                description: role.description,
              };
            })
          : [];
        if (!cloudHosting && showAdminSettings(currentUser)) {
          roles.push({
            key: "custom-pg",
            value: "Assign Custom Role",
            link: "/settings/groups",
            icon: "right-arrow",
          });
        }
        const selectedRole = roles.find(
          (role: { key: string; value: string; description: string }) =>
            role.value?.split(" - ")[0] ===
            cellProps.cell.value?.split(" - ")[0],
        );
        if (username === currentUser?.username) {
          return (
            <StyledText renderAs="p">
              {cellProps.cell.value?.split(" - ")[0]}
            </StyledText>
          );
        }
        if (entityType === ENTITY_TYPE.WORKSPACE && !selectedRole) {
          return <StyledText renderAs="p">No Access</StyledText>;
        }

        const onSelectHandler = (_value: string, option: any) => {
          if (option.value === "custom-pg") {
            history.push("/settings/groups");
          } else {
            entityId && entityType && entityType !== ENTITY_TYPE.WORKSPACE
              ? dispatch(
                  changeApplicationUserRole(
                    entityId,
                    option.value,
                    username,
                    userGroupId,
                  ),
                )
              : dispatch(
                  changeWorkspaceUserRole(
                    workspaceId,
                    option.key,
                    username,
                    userGroupId,
                  ),
                );
          }
        };

        return (
          <StyledSelect
            className="t--user-status"
            dropdownMatchSelectWidth={false}
            dropdownStyle={{ width: "400px" }}
            isLoading={
              roleChangingUserInfo && roleChangingUserInfo.username === username
            }
            listHeight={300}
            onSelect={(_value: string, option: any) => {
              onSelectHandler(_value, option);
            }}
            size="md"
            value={selectedRole}
          >
            {roles.map((role: Partial<SelectOptionProps>) => (
              <Option key={role.key} label={role.value} value={role.key}>
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1">
                    {role.icon && <Icon name={role.icon} size="md" />}
                    <Text
                      color="var(--ads-v2-color-fg-emphasis)"
                      kind={role.description && "heading-xs"}
                    >
                      {role.value}
                    </Text>
                  </div>
                  {role.description && (
                    <Text className="description" kind="body-s">
                      {role.description}
                    </Text>
                  )}
                </div>
              </Option>
            ))}
          </StyledSelect>
        );
      },
    },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: function DeleteCell(cellProps: any) {
        const {
          entityId,
          entityType,
          permissionGroupName,
          userGroupId,
          username,
        } = cellProps.cell.row.original;

        if (entityType === ENTITY_TYPE.WORKSPACE && !permissionGroupName) {
          return "";
        }

        return (
          <Button
            className="t--deleteUser"
            data-testid="t--deleteUser"
            isIconButton
            isLoading={
              deletingUserInfo &&
              deletingUserInfo.username === cellProps.cell.row.original.username
            }
            kind="error"
            onClick={() => {
              onConfirmMemberDeletion(
                username,
                username,
                workspaceId,
                userGroupId,
                entityId,
                entityType,
              );
            }}
            size="sm"
            startIcon="delete-bin-line"
          />
        );
      },
    },
  ];

  const isMobile: boolean = useMediaQuery({ maxWidth: 767 });
  const roles = allRoles
    ? allRoles.map((role: any) => {
        return {
          key:
            role.entityId &&
            role.entityType &&
            role.entityType !== ENTITY_TYPE.WORKSPACE
              ? role.name?.split(" - ")[0]
              : role.id,
          value: role.name?.split(" - ")[0],
          description: role.description,
        };
      })
    : [];

  const selectRole = (option: any, username: any) => {
    dispatch(changeWorkspaceUserRole(workspaceId, option, username));
  };

  return (
    <MembersWrapper data-testid="t--members-wrapper" isMobile={isMobile}>
      <>
        {!isMobile && (
          <Table
            columns={columns}
            data={filteredData}
            data-testid="listing-table"
            isLoading={isFetchingAllUsers && isFetchingAllRoles}
            noDataComponent={
              <NoResultsText kind="heading-s">
                {createMessage(NO_SEARCH_DATA_TEXT)}
              </NoResultsText>
            }
          />
        )}
        {isMobile && (
          <UserCardContainer>
            {filteredData.map((member, index) => {
              const role = roles.find(
                (role: any) =>
                  role.value === member.permissionGroupName.split(" - ")[0],
              );
              const isOwner = member.username === currentUser?.username;
              const isUserGroup = member.hasOwnProperty("userGroupId");
              return (
                <UserCard key={index}>
                  {isUserGroup ? (
                    <>
                      <Icon
                        className="user-group-icons"
                        name="group-line"
                        size="md"
                      />
                      <HighlightText
                        highlight={searchValue}
                        text={member.name}
                      />
                    </>
                  ) : (
                    <>
                      <Avatar
                        className="avatar"
                        firstLetter={getInitials(member.username)}
                        image={
                          member.photoId
                            ? `/api/${USER_PHOTO_ASSET_URL}/${member.photoId}`
                            : undefined
                        }
                        label={member.username}
                        size="sm"
                      />
                      <HighlightText
                        highlight={searchValue}
                        text={member.username}
                      />
                      <Text
                        className="user-email"
                        color="var(--ads-v2-color-fg-muted)"
                        renderAs="p"
                      >
                        {member.username}
                      </Text>
                    </>
                  )}
                  {isOwner && (
                    <Text className="user-role" renderAs="p">
                      {member.permissionGroupName?.split(" - ")[0]}
                    </Text>
                  )}
                  {!isOwner && !role && (
                    <Text className="user-role" renderAs="p">
                      No Access
                    </Text>
                  )}
                  {!isOwner && role && (
                    <Select
                      className="t--user-status"
                      isLoading={
                        roleChangingUserInfo &&
                        roleChangingUserInfo.username === member.username
                      }
                      onSelect={(_value: string, option: any) => {
                        selectRole(option.key, member.username);
                      }}
                      size="md"
                      value={role}
                    >
                      {roles.map((role: Partial<SelectOptionProps>) => (
                        <Option
                          key={role.key}
                          label={role.value}
                          value={role.key}
                        >
                          <div className="flex flex-col gap-1">
                            <Text
                              color="var(--ads-v2-color-fg-emphasis)"
                              kind={role.description && "heading-xs"}
                            >
                              {role.value}
                            </Text>
                            <Text kind="body-s">{role.description}</Text>
                          </div>
                        </Option>
                      ))}
                    </Select>
                  )}
                  <DeleteIcon
                    className="t--deleteUser"
                    data-testid="t--deleteUser"
                    isIconButton
                    kind="error"
                    onClick={() => {
                      onConfirmMemberDeletion(
                        member.username,
                        member.username,
                        workspaceId,
                        member?.userGroupId || "",
                      );
                    }}
                    size="sm"
                    startIcon="delete-bin-line"
                  />
                </UserCard>
              );
            })}
          </UserCardContainer>
        )}
        {userToBeDeleted && (
          <DeleteConfirmationModal
            isDeletingUser={isDeletingUser}
            isOpen={showMemberDeletionConfirmation}
            onClose={onCloseConfirmationModal}
            onConfirm={onDeleteMember}
            userToBeDeleted={userToBeDeleted}
          />
        )}
      </>
    </MembersWrapper>
  );
}
