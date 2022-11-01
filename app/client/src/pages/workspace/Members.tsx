import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllUsers,
  getAllRoles,
  // getCurrentWorkspace,
  getWorkspaceLoadingStates,
} from "@appsmith/selectors/workspaceSelectors";
import { RouteComponentProps } from "react-router";
import { getCurrentUser } from "selectors/usersSelectors";
import { Table } from "design-system";
import {
  fetchUsersForWorkspace,
  fetchRolesForWorkspace,
  fetchWorkspace,
  changeWorkspaceUserRole,
  deleteWorkspaceUser,
} from "actions/workspaceActions";
import {
  Classes as AppClass,
  Dropdown,
  HighlightText,
  Icon,
  IconSize,
  TableDropdown,
  TableDropdownOption,
  Text,
  TextType,
} from "design-system";
import styled from "styled-components";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { useMediaQuery } from "react-responsive";
import { Card } from "@blueprintjs/core";
import ProfileImage from "pages/common/ProfileImage";
import { USER_PHOTO_URL } from "constants/userConstants";
import { Colors } from "constants/Colors";
import { WorkspaceUser } from "constants/workspaceConstants";
import {
  createMessage,
  MEMBERS_TAB_TITLE,
  NO_SEARCH_DATA_TEXT,
} from "@appsmith/constants/messages";

export type PageProps = RouteComponentProps<{
  workspaceId: string;
}> & {
  searchValue?: string;
};

const MembersWrapper = styled.div<{
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

          &:first-child {
            width: 320px;
          }

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

          .bp3-overlay {
            position: relative;

            .bp3-transition-container {
              transform: none !important;
              top: 8px !important;

              .bp3-popover-content {
                > div {
                  width: 440px;
                }
              }
            }
          }
        }
      }
    }
  }
`;

const UserCardContainer = styled.div`
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  margin: auto;
`;

const UserCard = styled(Card)`
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

const EachUser = styled.div`
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

const DeleteIcon = styled(Icon)`
  position: absolute;
  top: ${(props) => props.theme.spaces[9]}px;
  right: ${(props) => props.theme.spaces[7]}px;
`;

const NoResultsText = styled.div`
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  color: var(--appsmith-color-black-700);
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

  const [
    showMemberDeletionConfirmation,
    setShowMemberDeletionConfirmation,
  ] = useState(false);
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
      Header: createMessage(() => MEMBERS_TAB_TITLE(filteredData?.length)),
      accessor: "users",
      Cell: function UserCell(props: any) {
        const member = props.cell.row.original;
        const isUserGroup = member.hasOwnProperty("users");
        return (
          <EachUser>
            {isUserGroup ? (
              <>
                <Icon
                  className="user-icons"
                  name="group-line"
                  size={IconSize.XXL}
                />
                <HighlightText highlight={searchValue} text={member.name} />
              </>
            ) : (
              <>
                <ProfileImage
                  className="user-icons"
                  size={20}
                  source={`/api/v1/users/photo/${member.username}`}
                  userName={member.username}
                />
                <HighlightText highlight={searchValue} text={member.username} />
              </>
            )}
          </EachUser>
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
                name: role.name,
                desc: role.description,
              };
            })
          : [];
        const index = roles.findIndex(
          (role: { id: string; name: string; desc: string }) =>
            role.name === cellProps.cell.value,
        );
        if (data.username === currentUser?.username) {
          return cellProps.cell.value;
        }
        return (
          <TableDropdown
            isLoading={
              roleChangingUserInfo &&
              roleChangingUserInfo.username === data.username
            }
            onSelect={(option: TableDropdownOption) => {
              dispatch(
                changeWorkspaceUserRole(workspaceId, option.id, data.username),
              );
            }}
            options={roles}
            selectedIndex={index}
            selectedTextWidth="90px"
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
          value: role.name,
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
                  (role: any) => role.value === member.permissionGroupName,
                ) || roles[0];
              const isOwner = member.username === currentUser?.username;
              const isUserGroup = member.hasOwnProperty("users");
              return (
                <UserCard key={index}>
                  {isUserGroup ? (
                    <>
                      <Icon
                        className="user-icons"
                        name="group-line"
                        size={IconSize.XXL}
                      />
                      <HighlightText
                        highlight={searchValue}
                        text={member.name}
                      />
                    </>
                  ) : (
                    <>
                      <ProfileImage
                        className="avatar"
                        size={71}
                        source={`/api/${USER_PHOTO_URL}/${member.username}`}
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
                  )}
                  {isOwner && (
                    <Text className="user-role" type={TextType.P1}>
                      {member.permissionGroupName}
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
