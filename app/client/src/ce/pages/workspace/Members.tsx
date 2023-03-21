import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllUsers,
  getAllRoles,
  // getCurrentWorkspace,
  getWorkspaceLoadingStates,
} from "@appsmith/selectors/workspaceSelectors";
import type { RouteComponentProps } from "react-router";
import { getCurrentUser } from "selectors/usersSelectors";
import { Table } from "design-system-old";
import {
  fetchUsersForWorkspace,
  fetchRolesForWorkspace,
  fetchWorkspace,
  changeWorkspaceUserRole,
  deleteWorkspaceUser,
} from "@appsmith/actions/workspaceActions";
import {
  Classes as AppClass,
  Dropdown,
  HighlightText,
  Icon,
  IconSize,
  Text,
  TextType,
} from "design-system-old";
import styled from "styled-components";
import DeleteConfirmationModal from "pages/workspace/DeleteConfirmationModal";
import { useMediaQuery } from "react-responsive";
import { Card } from "@blueprintjs/core";
import ProfileImage from "pages/common/ProfileImage";
import { USER_PHOTO_ASSET_URL } from "constants/userConstants";
import { Colors } from "constants/Colors";
import type { WorkspaceUser } from "@appsmith/constants/workspaceConstants";
import {
  createMessage,
  MEMBERS_TAB_TITLE,
  NO_SEARCH_DATA_TEXT,
} from "@appsmith/constants/messages";
import { getAppsmithConfigs } from "@appsmith/configs";

const { cloudHosting } = getAppsmithConfigs();

export type PageProps = RouteComponentProps<{
  workspaceId: string;
}> & {
  searchValue?: string;
};

export const MembersWrapper = styled.div<{
  isMobile?: boolean;
}>`
  ${(props) => (props.isMobile ? "width: 100%; margin: auto" : null)}
  table {
    margin-top: 12px;
    table-layout: fixed;

    thead {
      z-index: 1;
      tr {
        border-bottom: 1px solid #e8e8e8;
        th {
          font-size: 14px;
          font-weight: 500;
          line-height: 1.5;
          color: var(--appsmith-color-black-700);
          padding: 8px 20px;

          &:last-child {
            width: 120px;
          }

          svg {
            margin: auto 8px;
            display: initial;
          }
        }
      }
    }

    tbody {
      tr {
        td {
          word-break: break-word;
          padding: 0 var(--ads-spaces-9);
          border-bottom: none;
          line-height: 2.9;

          &:first-child {
            text-align: left;
          }

          .t--deleteUser {
            justify-content: center;
          }

          .selected-item {
            .cs-text {
              width: auto;
            }
          }

          .cs-text {
            text-align: left;
          }

          .bp3-popover-target {
            display: flex;

            > * {
              flex-grow: 0;
            }

            .t--user-status {
              border: none;
              padding: 0;
              background: none;
            }

            .cs-text {
              width: 100%;
              margin-right: 10px;
              color: var(--ads-text-color);
            }
          }

          .bp3-overlay {
            position: relative;

            .bp3-transition-container {
              transform: none !important;
              top: 8px !important;

              .bp3-popover-content {
                > div {
                  width: 340px;
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const UserCardContainer = styled.div`
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  margin: auto;
`;

export const UserCard = styled(Card)`
  display: flex;
  flex-direction: column;
  box-shadow: none;
  background-color: ${Colors.GREY_1};
  border: 1px solid ${Colors.GREY_3};
  border-radius: 0px;
  padding: ${(props) =>
    `${props.theme.spaces[15]}px ${props.theme.spaces[7] * 4}px;`}
  width: 343px;
  height: 201px;
  margin: auto;
  margin-bottom: ${(props) => props.theme.spaces[7] - 1}px;
  align-items: center;
  justify-content: center;
  position: relative;

  .avatar {
    min-height: 71px;

    .${AppClass.TEXT} {
      margin: auto;
    }
  }

  .${AppClass.TEXT} {
    color: ${Colors.GREY_10};
    margin-top: ${(props) => props.theme.spaces[1]}px;
    &.user-name {
      margin-top: ${(props) => props.theme.spaces[4]}px;
    }
    &.user-email {
      color: ${Colors.GREY_7};
    }
    &.user-role {
      margin-bottom: ${(props) => props.theme.spaces[3]}px;
    }
  }

  .approve-btn {
    padding: ${(props) =>
      `${props.theme.spaces[1]}px ${props.theme.spaces[3]}px`};
  }
  .delete-btn {
    position: absolute;
  }

  .t--user-status {
    background: transparent;
    border: 0px;
    width: fit-content;
    margin: auto;
    .${AppClass.TEXT} {
      width: fit-content;
      margin-top: 0px;
      color: ${Colors.GREY_10};
    }
  }
`;

export const EachUser = styled.div`
  display: flex;
  align-items: center;

  .user-icons {
    margin-right: 8px;
    cursor: initial;

    span {
      color: var(--appsmith-color-black-0);
    }
  }
`;

export const DeleteIcon = styled(Icon)`
  position: absolute;
  top: ${(props) => props.theme.spaces[9]}px;
  right: ${(props) => props.theme.spaces[7]}px;
`;

export const NoResultsText = styled.div`
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  color: var(--appsmith-color-black-700);
`;

export const RowWrapper = styled.div<{ isSubRow?: boolean }>`
  display: flex;

  ${({ isSubRow }) =>
    isSubRow
      ? `padding-left: 12px;`
      : `> div {
          margin-left: 8px;
        }`}
`;

export default function MemberSettings(props: PageProps) {
  const {
    match: {
      params: { workspaceId },
    },
    searchValue = "",
    // deleteWorkspaceUser,
    // changeWorkspaceUserRole,
  } = props;

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchUsersForWorkspace(workspaceId));
    dispatch(fetchRolesForWorkspace(workspaceId));
    dispatch(fetchWorkspace(workspaceId));
  }, [dispatch, workspaceId]);

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
  } | null>(null);

  const onConfirmMemberDeletion = (
    name: string,
    username: string,
    workspaceId: string,
  ) => {
    setUserToBeDeleted({ name, username, workspaceId });
    onOpenConfirmationModal();
  };

  const onDeleteMember = (data?: any) => {
    if (!userToBeDeleted && !data) return null;
    dispatch(
      deleteWorkspaceUser(
        userToBeDeleted?.workspaceId || data?.workspaceId,
        userToBeDeleted?.username || data?.username,
      ),
    );
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
  // const currentWorkspace = useSelector(getCurrentWorkspace).filter(
  //   (el) => el.id === workspaceId,
  // )[0];

  useEffect(() => {
    if (!!userToBeDeleted && showMemberDeletionConfirmation) {
      const userBeingDeleted = allUsers.find(
        (user) => user.username === userToBeDeleted.username,
      );
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
        return (
          <EachUser>
            <>
              <ProfileImage
                className="user-icons"
                size={20}
                source={
                  member.photoId
                    ? `/api/${USER_PHOTO_ASSET_URL}/${member.photoId}`
                    : undefined
                }
                userName={member.username}
              />
              <HighlightText highlight={searchValue} text={member.username} />
            </>
          </EachUser>
        );
      },
    },
    {
      Header: "Resource",
      accessor: "resource",
      Cell: function ResourceCell(cellProps: any) {
        return (
          <RowWrapper>
            <div className="resource-name">
              {cellProps.cell.row.original.roles?.[0]?.entityType ||
                "Workspace"}
            </div>
          </RowWrapper>
        );
      },
    },
    {
      Header: "Role",
      accessor: "permissionGroupName",
      Cell: function DropdownCell(cellProps: any) {
        const data = cellProps.cell.row.original;
        const allRoles = useSelector(getAllRoles);
        const roles = allRoles
          ? allRoles.map((role: any) => {
              return {
                id: role.id,
                value: role.name?.split(" - ")[0],
                label: role.description,
              };
            })
          : [];
        const selectedRole = roles.find(
          (role: { id: string; value: string; label: string }) =>
            role.value?.split(" - ")[0] ===
            cellProps.cell.value?.split(" - ")[0],
        );
        if (data.username === currentUser?.username) {
          return cellProps.cell.value?.split(" - ")[0];
        }
        return (
          <Dropdown
            boundary="viewport"
            className="t--user-status"
            defaultIcon="downArrow"
            dontUsePortal
            height="31px"
            isLoading={
              roleChangingUserInfo &&
              roleChangingUserInfo.username === data.username
            }
            onSelect={(_value: string, option: any) => {
              dispatch(
                changeWorkspaceUserRole(workspaceId, option.id, data.username),
              );
            }}
            options={roles}
            selected={selectedRole}
          />
        );
      },
    },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: function DeleteCell(cellProps: any) {
        return (
          <Icon
            className="t--deleteUser"
            cypressSelector="t--deleteUser"
            fillColor="#FF6786"
            hoverFillColor="#FF6786"
            isLoading={
              deletingUserInfo &&
              deletingUserInfo.username === cellProps.cell.row.original.username
            }
            name="trash-outline"
            onClick={() => {
              onConfirmMemberDeletion(
                cellProps.cell.row.original.username,
                cellProps.cell.row.original.username,
                workspaceId,
              );
            }}
            size={IconSize.LARGE}
          />
        );
      },
    },
  ];
  const isMobile: boolean = useMediaQuery({ maxWidth: 767 });
  const roles = allRoles
    ? allRoles.map((role: any) => {
        return {
          id: role.id,
          value: role.name?.split(" - ")[0],
          label: role.description,
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
              <NoResultsText>
                {createMessage(NO_SEARCH_DATA_TEXT)}
              </NoResultsText>
            }
          />
        )}
        {isMobile && (
          <UserCardContainer>
            {filteredData.map((member, index) => {
              const role =
                roles.find(
                  (role: any) =>
                    role.value === member.permissionGroupName.split(" - ")[0],
                ) || roles[0];
              const isOwner = member.username === currentUser?.username;
              return (
                <UserCard key={index}>
                  <>
                    <ProfileImage
                      className="avatar"
                      size={71}
                      source={
                        member.photoId
                          ? `/api/${USER_PHOTO_ASSET_URL}/${member.photoId}`
                          : undefined
                      }
                      userName={member.username}
                    />
                    <HighlightText
                      highlight={searchValue}
                      text={member.username}
                    />
                    <Text className="user-email" type={TextType.P1}>
                      {member.username}
                    </Text>
                  </>
                  {isOwner && (
                    <Text className="user-role" type={TextType.P1}>
                      {member.permissionGroupName?.split(" - ")[0]}
                    </Text>
                  )}
                  {!isOwner && (
                    <Dropdown
                      boundary="viewport"
                      className="t--user-status"
                      defaultIcon="downArrow"
                      height="31px"
                      onSelect={(value: any, option: any) => {
                        selectRole(option.id, member.username);
                      }}
                      options={roles}
                      selected={role}
                    />
                  )}
                  <DeleteIcon
                    className="t--deleteUser"
                    cypressSelector="t--deleteUser"
                    fillColor={Colors.DANGER_SOLID}
                    hoverFillColor={Colors.DANGER_SOLID_HOVER}
                    name="trash-outline"
                    onClick={() => {
                      onConfirmMemberDeletion(
                        member.username,
                        member.username,
                        workspaceId,
                      );
                    }}
                    size={IconSize.LARGE}
                  />
                </UserCard>
              );
            })}
          </UserCardContainer>
        )}
        <DeleteConfirmationModal
          isDeletingUser={isDeletingUser}
          isOpen={showMemberDeletionConfirmation}
          name={userToBeDeleted && userToBeDeleted.name}
          onClose={onCloseConfirmationModal}
          onConfirm={onDeleteMember}
          username={userToBeDeleted && userToBeDeleted.username}
        />
      </>
    </MembersWrapper>
  );
}
