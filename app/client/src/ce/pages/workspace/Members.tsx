import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllRoles,
  getWorkspaceLoadingStates,
  getFetchedWorkspaces,
} from "ee/selectors/workspaceSelectors";
import type { RouteComponentProps } from "react-router";
import { useHistory } from "react-router";
import { getCurrentUser } from "selectors/usersSelectors";
import { HighlightText, Table } from "@appsmith/ads-old";
import {
  fetchUsersForWorkspace,
  fetchRolesForWorkspace,
  fetchWorkspace,
  changeWorkspaceUserRole,
  deleteWorkspaceUser,
} from "ee/actions/workspaceActions";
import type { SelectOptionProps } from "@appsmith/ads";
import { Avatar, Button, Option, Select, Text } from "@appsmith/ads";
import styled from "styled-components";
import DeleteConfirmationModal from "pages/workspace/DeleteConfirmationModal";
import { useMediaQuery } from "react-responsive";
import { Card } from "@blueprintjs/core";
import { USER_PHOTO_ASSET_URL } from "constants/userConstants";
import type { WorkspaceUser } from "ee/constants/workspaceConstants";
import {
  createMessage,
  MEMBERS_TAB_TITLE,
  NO_SEARCH_DATA_TEXT,
} from "ee/constants/messages";
import { APPLICATIONS_URL } from "constants/routes";
import { isPermitted, PERMISSION_TYPE } from "ee/utils/permissionHelpers";
import { getInitials } from "utils/AppsmithUtils";
import { CustomRolesRamp } from "ee/pages/workspace/InviteUsersForm";
import { showProductRamps } from "ee/selectors/rampSelectors";
import { RAMP_NAME } from "utils/ProductRamps/RampsControlList";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import {
  getAllUsersOfWorkspace,
  selectedWorkspaceLoadingStates,
} from "ee/selectors/selectedWorkspaceSelectors";

export type PageProps = RouteComponentProps<{
  workspaceId: string;
}> & {
  searchValue?: string;
};

export const MembersWrapper = styled.div<{
  isMobile?: boolean;
}>`
  &.members-wrapper {
    overflow: scroll;
    height: 100%;
    ${(props) => (props.isMobile ? "width: 100%; margin: auto" : null)}
    table {
      table-layout: fixed;

      thead {
        tr {
          border-bottom: 1px solid var(--ads-v2-color-border);
          th {
            font-size: 14px;
            font-weight: 500;
            line-height: 1.5;
            color: var(--ads-v2-color-fg);
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
            height: 40px;

            &:first-child {
              text-align: left;
            }

            .ads-v2-select {
              width: fit-content;
              > .rc-select-selector {
                border: none;

                > .rc-select-selection-item {
                  padding-left: 0;
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
  background-color: var(--ads-v2-color-bg-subtle);
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  padding: ${(props) =>
    `${props.theme.spaces[15]}px ${props.theme.spaces[7] * 4}px;`};
  width: 100%;
  height: 201px;
  margin: auto;
  margin-bottom: ${(props) => props.theme.spaces[7] - 1}px;
  align-items: center;
  justify-content: center;
  position: relative;

  .approve-btn {
    padding: ${(props) =>
      `${props.theme.spaces[1]}px ${props.theme.spaces[3]}px`};
  }
  .delete-btn {
    position: absolute;
  }
`;

export const EachUser = styled.div`
  display: flex;
  align-items: center;

  .user-icons {
    margin-right: 8px;
    flex-shrink: 0;
  }

  .user-group-icons {
    width: 24px;
    margin-right: 8px;
    flex-shrink: 0;
  }
`;

export const DeleteIcon = styled(Button)`
  position: absolute !important;
  top: ${(props) => props.theme.spaces[9]}px;
  right: ${(props) => props.theme.spaces[7]}px;
`;

export const NoResultsText = styled(Text)`
  color: var(--ads-v2-color-fg);
`;

export const RowWrapper = styled.div<{ isSubRow?: boolean }>`
  display: flex;
  height: 100%;
  align-items: center;

  ${({ isSubRow }) => (isSubRow ? `padding-left: 12px;` : ``)}

  .ads-v2-icon {
    margin: 0 4px 0 0;
    position: relative;
    left: -4px;
  }
`;

export const StyledText = styled(Text)`
  padding: var(--ads-v2-spaces-2) var(--ads-v2-spaces-3) var(--ads-v2-spaces-2)
    0;
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
  const history = useHistory();

  const showRampSelector = showProductRamps(RAMP_NAME.CUSTOM_ROLES);
  const canShowRamp = useSelector(showRampSelector);

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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDeleteMember = (data?: any) => {
    if (!userToBeDeleted && !data) return null;

    dispatch(
      deleteWorkspaceUser(
        userToBeDeleted?.workspaceId || data?.workspaceId,
        userToBeDeleted?.username || data?.username,
      ),
    );
  };

  const { deletingUserInfo, isFetchingAllUsers, roleChangingUserInfo } =
    useSelector(selectedWorkspaceLoadingStates);
  const { isFetchingAllRoles } = useSelector(getWorkspaceLoadingStates);
  const allRoles = useSelector(getAllRoles);
  const allUsers = useSelector(getAllUsersOfWorkspace);
  const currentUser = useSelector(getCurrentUser);
  const currentWorkspace = useSelector(getFetchedWorkspaces).find(
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

  const isGACEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

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

  useEffect(() => {
    if (
      currentWorkspace &&
      (!isMemberofTheWorkspace || !hasManageWorkspacePermissions)
    ) {
      history.replace(APPLICATIONS_URL);
    }
  }, [currentWorkspace, isMemberofTheWorkspace, hasManageWorkspacePermissions]);

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
        MEMBERS_TAB_TITLE(filteredData?.length, !isGACEnabled),
      ),
      accessor: "users",
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Cell: function UserCell(props: any) {
        const member = props.cell.row.original;

        return (
          <EachUser>
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
          </EachUser>
        );
      },
    },
    {
      Header: "Resource",
      accessor: "resource",
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Cell: function DropdownCell(cellProps: any) {
        const data = cellProps.cell.row.original;
        const allRoles = useSelector(getAllRoles);
        const roles = allRoles
          ? // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            allRoles.map((role: any) => {
              return {
                key: role.id,
                value: role.name?.split(" - ")[0],
                description: role.description,
              };
            })
          : [];
        const selectedRole = roles.find(
          (role: { key: string; value: string; description: string }) =>
            role.value?.split(" - ")[0] ===
            cellProps.cell.value?.split(" - ")[0],
        );

        if (data.username === currentUser?.username) {
          return (
            <StyledText renderAs="p">
              {cellProps.cell.value?.split(" - ")[0]}
            </StyledText>
          );
        }

        return (
          <Select
            className="t--user-status"
            dropdownMatchSelectWidth={false}
            dropdownStyle={{ width: "400px" }}
            isLoading={
              roleChangingUserInfo &&
              roleChangingUserInfo.username === data.username
            }
            listHeight={400}
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSelect={(_value: string, option: any) => {
              dispatch(
                changeWorkspaceUserRole(workspaceId, option.key, data.username),
              );
            }}
            size="md"
            value={selectedRole}
          >
            {roles.map((role: Partial<SelectOptionProps>) => (
              <Option key={role.key} label={role.value} value={role.key}>
                <div className="flex flex-col gap-1">
                  <Text
                    color="var(--ads-v2-color-fg-emphasis)"
                    kind={role.description && "heading-xs"}
                  >
                    {role.value}
                  </Text>
                  {role.description && (
                    <Text kind="body-s">{role.description}</Text>
                  )}
                </div>
              </Option>
            ))}
            {canShowRamp && (
              <Option disabled>
                <CustomRolesRamp />
              </Option>
            )}
          </Select>
        );
      },
    },
    {
      Header: "Actions",
      accessor: "actions",
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Cell: function DeleteCell(cellProps: any) {
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
                cellProps.cell.row.original.username,
                cellProps.cell.row.original.username,
                workspaceId,
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
    ? // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allRoles.map((role: any) => {
        return {
          key: role.id,
          value: role.name?.split(" - ")[0],
          description: role.description,
        };
      })
    : [];

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectRole = (option: any, username: any) => {
    dispatch(changeWorkspaceUserRole(workspaceId, option, username));
  };

  return (
    <MembersWrapper
      className="members-wrapper"
      data-testid="t--members-wrapper"
      isMobile={isMobile}
    >
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
              const role =
                roles.find(
                  // TODO: Fix this the next time the file is edited
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (role: any) =>
                    role.value === member.permissionGroupName.split(" - ")[0],
                ) || roles[0];
              const isOwner = member.username === currentUser?.username;

              return (
                <UserCard key={index}>
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
                  {!isOwner && (
                    <Select
                      className="t--user-status"
                      isLoading={
                        roleChangingUserInfo &&
                        roleChangingUserInfo.username === member.username
                      }
                      // TODO: Fix this the next time the file is edited
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                      {canShowRamp && (
                        <Option disabled>
                          <CustomRolesRamp />
                        </Option>
                      )}
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
