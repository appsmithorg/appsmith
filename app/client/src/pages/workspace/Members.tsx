import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllUsers,
  getAllRoles,
  getCurrentWorkspace,
  getWorkspaceLoadingStates,
} from "@appsmith/selectors/workspaceSelectors";
import PageSectionHeader from "pages/common/PageSectionHeader";
import WorkspaceInviteUsersForm from "pages/workspace/WorkspaceInviteUsersForm";
import { RouteComponentProps } from "react-router";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import { getCurrentUser } from "selectors/usersSelectors";
import Table from "components/ads/Table";
import Icon, { IconSize } from "components/ads/Icon";
import {
  fetchUsersForWorkspace,
  fetchRolesForWorkspace,
  fetchWorkspace,
  changeWorkspaceUserRole,
  deleteWorkspaceUser,
} from "actions/workspaceActions";
import Button, { Size, Category } from "components/ads/Button";
import TableDropdown from "components/ads/TableDropdown";
import Dropdown from "components/ads/Dropdown";
import Text, { TextType } from "components/ads/Text";
import { SettingsHeading } from "./General";
import styled from "styled-components";
import { Classes } from "@blueprintjs/core";
import { Classes as AppClass } from "components/ads/common";
import { Variant } from "components/ads/common";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { useMediaQuery } from "react-responsive";
import { Card } from "@blueprintjs/core";
import ProfileImage from "pages/common/ProfileImage";
import { USER_PHOTO_URL } from "constants/userConstants";
import { Colors } from "constants/Colors";

export type PageProps = RouteComponentProps<{
  workspaceId: string;
}>;

const Loader = styled.div`
  height: 120px;
  width: 100%;
`;

const MembersWrapper = styled.div<{
  isMobile?: boolean;
}>`
  ${(props) => (props.isMobile ? "width: 100%; margin: auto" : null)}
  table {
    tbody {
      tr {
        td:first-child {
          word-break: break-word;
        }
      }
    }
  }
`;

const ButtonWrapper = styled.div`
  margin-top: 10px;
  a {
    padding: 0 8px;
  }
  span:last-child {
    font-size: 14px;
  }
  svg {
    path {
      stroke: #ffffff;
      fill: #ffffff;
    }
  }
  button {
    padding: 6px 8px;
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

const TableWrapper = styled(Table)`
  tbody {
    tr:hover {
      .t--deleteUser {
        path {
          fill: #ff6786;
        }
      }
    }
  }
`;

const DeleteIcon = styled(Icon)`
  position: absolute;
  top: ${(props) => props.theme.spaces[9]}px;
  right: ${(props) => props.theme.spaces[7]}px;
`;

export default function MemberSettings(props: PageProps) {
  const {
    match: {
      params: { workspaceId },
    },
    // deleteWorkspaceUser,
    // changeWorkspaceUserRole,
  } = props;

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchUsersForWorkspace(workspaceId));
    dispatch(fetchRolesForWorkspace(workspaceId));
    dispatch(fetchWorkspace(workspaceId));
  }, [workspaceId]);

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

  const onDeleteMember = () => {
    if (!userToBeDeleted) return null;
    dispatch(
      deleteWorkspaceUser(
        userToBeDeleted.workspaceId,
        userToBeDeleted.username,
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
  const currentWorkspace = useSelector(getCurrentWorkspace).filter(
    (el) => el.id === workspaceId,
  )[0];

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

  const userTableData = allUsers.map((user) => ({
    ...user,
    isCurrentUser: user.username === currentUser?.username,
  }));

  const columns = [
    {
      Header: "Name",
      accessor: "name",
    },
    {
      Header: "Email",
      accessor: "username",
    },
    {
      Header: "Role",
      accessor: "roleName",
      Cell: function DropdownCell(cellProps: any) {
        const allRoles = useSelector(getAllRoles);
        const roles = allRoles
          ? Object.keys(allRoles).map((role) => {
              return {
                name: role,
                desc: allRoles[role],
              };
            })
          : [];
        const index = roles.findIndex(
          (role: { name: string; desc: string }) =>
            role.name === cellProps.cell.value,
        );
        if (cellProps.cell.row.values.username === currentUser?.username) {
          return cellProps.cell.value;
        }
        return (
          <TableDropdown
            isLoading={
              roleChangingUserInfo &&
              roleChangingUserInfo.username ===
                cellProps.cell.row.values.username
            }
            onSelect={(option) => {
              dispatch(
                changeWorkspaceUserRole(
                  workspaceId,
                  option.name,
                  cellProps.cell.row.values.username,
                ),
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
      Header: "Status",
      accessor: "status",
    },
    {
      Header: "Actions",
      accessor: "delete",
      disableSortBy: true,
      Cell: function DeleteCell(cellProps: any) {
        return (
          <Icon
            className="t--deleteUser"
            cypressSelector="t--deleteUser"
            fillColor="#FF6786"
            hoverFillColor="#FF6786"
            isLoading={
              deletingUserInfo &&
              deletingUserInfo.username === cellProps.cell.row.values.username
            }
            name="trash-outline"
            onClick={() => {
              onConfirmMemberDeletion(
                cellProps.cell.row.values.username,
                cellProps.cell.row.values.username,
                workspaceId,
              );
            }}
            size={IconSize.LARGE}
          />
        );
      },
    },
  ];
  const currentWorkspaceName = currentWorkspace?.name ?? "";
  const isMobile: boolean = useMediaQuery({ maxWidth: 767 });
  const roles = allRoles
    ? Object.keys(allRoles).map((role) => {
        return {
          id: role,
          value: role,
          label: allRoles[role],
        };
      })
    : [];

  const selectRole = (option: any, username: any) => {
    dispatch(changeWorkspaceUserRole(workspaceId, option, username));
  };
  return (
    <MembersWrapper isMobile={isMobile}>
      <PageSectionHeader>
        <SettingsHeading type={TextType.H1}>Manage Users</SettingsHeading>
        <FormDialogComponent
          Form={WorkspaceInviteUsersForm}
          canOutsideClickClose
          title={`Invite Users to ${currentWorkspaceName}`}
          trigger={
            <ButtonWrapper>
              <Button
                cypressSelector="t--invite-users"
                icon="plus"
                size={Size.medium}
                tag="button"
                text="Invite Users"
                variant={Variant.info}
              />
            </ButtonWrapper>
          }
          workspaceId={workspaceId}
        />
      </PageSectionHeader>
      {isFetchingAllUsers && isFetchingAllRoles ? (
        <Loader className={Classes.SKELETON} />
      ) : (
        <>
          {!isMobile && <TableWrapper columns={columns} data={userTableData} />}
          {isMobile && (
            <UserCardContainer>
              {allUsers.map((user, index) => {
                const role =
                  roles.find((role) => role.value === user.roleName) ||
                  roles[0];
                const isOwner = user.username === currentUser?.username;
                return (
                  <UserCard key={index}>
                    <ProfileImage
                      className="avatar"
                      size={71}
                      source={`/api/${USER_PHOTO_URL}/${user.username}`}
                      userName={user.name || user.username}
                    />
                    <Text className="user-name" type={TextType.P1}>
                      {user.name || user.username}
                    </Text>
                    <Text className="user-email" type={TextType.P1}>
                      {user.username}
                    </Text>
                    {isOwner && (
                      <Text className="user-role" type={TextType.P1}>
                        {user.roleName}
                      </Text>
                    )}
                    {!isOwner && (
                      <Dropdown
                        boundary="viewport"
                        className="t--user-status"
                        defaultIcon="downArrow"
                        height="31px"
                        onSelect={(value) => {
                          selectRole(value, user.username);
                        }}
                        options={roles}
                        selected={role}
                        width="140px"
                      />
                    )}
                    <Button
                      category={Category.primary}
                      className="approve-btn"
                      size={Size.xxs}
                      text="Approve"
                    />
                    <DeleteIcon
                      className="t--deleteUser"
                      cypressSelector="t--deleteUser"
                      fillColor={Colors.DANGER_SOLID}
                      hoverFillColor={Colors.DANGER_SOLID_HOVER}
                      name="trash-outline"
                      onClick={() => {
                        onConfirmMemberDeletion(
                          user.username,
                          user.username,
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
      )}
    </MembersWrapper>
  );
}
