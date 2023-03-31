export * from "ce/pages/workspace/Members";
import type { PageProps } from "ce/pages/workspace/Members";
import {
  EachUser,
  MembersWrapper,
  NoResultsText,
  UserCard,
  UserCardContainer,
  DeleteIcon,
  RowWrapper,
} from "ce/pages/workspace/Members";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllUsers,
  getAllRoles,
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
import {
  Dropdown,
  HighlightText,
  Icon,
  IconSize,
  Table,
  Text,
  TextType,
} from "design-system-old";
import DeleteConfirmationModal from "pages/workspace/DeleteConfirmationModal";
import { useMediaQuery } from "react-responsive";
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
import styled from "styled-components";
import { showAdminSettings } from "@appsmith/utils/adminSettingsHelpers";
import { useHistory } from "react-router";

const { cloudHosting } = getAppsmithConfigs();

const Delimeter = styled.div`
  border-left: 1px solid var(--appsmith-color-black-200);
  line-height: 24px;
  padding-right: 12px;
  text-align: center;
  width: 15px;
  /*height: 44px;*/
  /*margin: 0 12px 0 6px;*/
  margin: 0 4px 0 16px;
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
    userId: string;
    userGroupId: string;
  } | null>(null);

  const onConfirmMemberDeletion = (
    name: string,
    username: string,
    workspaceId: string,
    userId: string,
    userGroupId: string,
  ) => {
    setUserToBeDeleted({ name, username, workspaceId, userId, userGroupId });
    onOpenConfirmationModal();
  };

  const onDeleteMember = (data?: any) => {
    if (!userToBeDeleted && !data) return null;
    dispatch(
      deleteWorkspaceUser(
        userToBeDeleted?.workspaceId || data?.workspaceId,
        userToBeDeleted?.username || data?.username,
        userToBeDeleted?.userGroupId || data?.userGroupId,
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

  useEffect(() => {
    if (!!userToBeDeleted && showMemberDeletionConfirmation) {
      const userBeingDeleted = allUsers.find((user) =>
        user.userGroupId
          ? user.userGroupId === userToBeDeleted.userGroupId
          : user.username === userToBeDeleted.username,
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
        const isUserGroup = member.hasOwnProperty("userGroupId");
        const isNotSubRow = props.cell.row.id.split(".").length === 1;
        return isNotSubRow ? (
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
                  source={
                    member.photoId
                      ? `/api/${USER_PHOTO_ASSET_URL}/${member.photoId}`
                      : undefined
                  }
                  userName={member.username}
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
              <Icon name="arrow-down-s-fill" size={IconSize.XL} />
            ) : (
              <Icon name="arrow-right-s-fill" size={IconSize.XL} />
            )}
            <div className="resource-name">
              {cellProps.cell.row.original.roles?.[0]?.entityType ||
                "Workspace"}
            </div>
          </RowWrapper>
        ) : (
          <RowWrapper isSubRow={isSubRow}>
            {cellProps.row.depth ? del : null}
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
        const { userGroupId, username } = cellProps.cell.row.original;
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
        if (!cloudHosting && showAdminSettings(currentUser)) {
          roles.push({
            id: "custom-pg",
            value: "Assign Custom Role",
            link: "/settings/groups",
            icon: "right-arrow",
          });
        }
        const selectedRole = roles.find(
          (role: { id: string; value: string; label: string }) =>
            role.value?.split(" - ")[0] ===
            cellProps.cell.value?.split(" - ")[0],
        );
        if (username === currentUser?.username) {
          return cellProps.cell.value?.split(" - ")[0];
        }

        const onSelectHandler = (_value: string, option: any) => {
          if (option.link) {
            history.push(option.link);
          } else {
            userGroupId
              ? dispatch(
                  changeWorkspaceUserRole(
                    workspaceId,
                    option.id,
                    username,
                    userGroupId,
                  ),
                )
              : dispatch(
                  changeWorkspaceUserRole(workspaceId, option.id, username),
                );
          }
        };

        return (
          <Dropdown
            boundary="viewport"
            className="t--user-status"
            defaultIcon="downArrow"
            dontUsePortal
            height="31px"
            isLoading={
              roleChangingUserInfo && roleChangingUserInfo.username === username
            }
            onSelect={(_value: string, option: any) =>
              onSelectHandler(_value, option)
            }
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
        const { userGroupId, userId, username } = cellProps.cell.row.original;

        return (
          <Icon
            className="t--deleteUser"
            cypressSelector="t--deleteUser"
            fillColor="#FF6786"
            hoverFillColor="#FF6786"
            isLoading={
              deletingUserInfo && deletingUserInfo.username === username
            }
            name="trash-outline"
            onClick={() => {
              onConfirmMemberDeletion(
                username,
                username,
                workspaceId,
                userId,
                userGroupId,
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
              const isUserGroup = member.hasOwnProperty("userGroupId");
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
                  )}
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
                        member.userId,
                        member?.userGroupId || "",
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
