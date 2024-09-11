import React from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { createMessage, NO_USERS_INVITED } from "ee/constants/messages";
import { isPermitted, PERMISSION_TYPE } from "ee/utils/permissionHelpers";
import { Avatar, Icon, Spinner, Text, Tooltip } from "@appsmith/ads";
import { getInitialsFromName } from "utils/AppsmithUtils";
import ManageUsers from "pages/workspace/ManageUsers";
import { USER_PHOTO_ASSET_URL } from "constants/userConstants";
import { importSvg } from "@appsmith/ads-old";
import type { WorkspaceUserRoles } from "ee/constants/workspaceConstants";
import InviteUsersForm from "ee/pages/workspace/InviteUsersForm";
import { ENTITY_TYPE } from "ee/constants/workspaceConstants";
import {
  getAllAppUsers,
  getApplicationLoadingStates,
} from "ee/selectors/applicationSelectors";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import {
  getAllUsersOfWorkspace,
  selectedWorkspaceLoadingStates,
} from "ee/selectors/selectedWorkspaceSelectors";
import type { AppState } from "ee/reducers";

const NoEmailConfigImage = importSvg(
  async () => import("assets/images/email-not-configured.svg"),
);

export const WorkspaceInviteWrapper = styled.div``;

export const UserList = styled.div`
  margin-top: 10px;
  max-height: 260px;
  overflow-y: auto;
  justify-content: space-between;
  margin-left: 0.1rem;

  .user-icons {
    width: 32px;
    justify-content: center;
  }
`;

export const User = styled.div`
  display: flex;
  align-items: center;
  min-height: 54px;
  justify-content: space-between;
  border-bottom: 1px solid var(--ads-v2-color-border);
`;

export const UserInfo = styled.div`
  display: inline-flex;
  align-items: center;
  div:first-child {
    cursor: default;
  }
`;

export const UserRole = styled.div`
  span {
    word-break: break-word;
    margin-right: 8px;
  }
`;

export const UserName = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 10px;
  span {
    word-break: break-word;

    &:nth-child(1) {
      margin-bottom: 1px;
    }
  }
`;

export const MailConfigContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px 4px;
  padding-bottom: 0;
  align-items: center;
  && > span {
    color: var(--ads-v2-color-fg);
  }
`;

export const ManageUsersContainer = styled.div`
  padding: 12px 0;
`;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WorkspaceInviteUsers(props: any) {
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const userRef = React.createRef<HTMLDivElement>();
  const currentWorkspace = useSelector(getCurrentAppWorkspace);
  const showAppLevelInviteModal =
    (isFeatureEnabled && props.isApplicationPage) || false;
  const allUsers = useSelector(
    showAppLevelInviteModal ? getAllAppUsers : getAllUsersOfWorkspace,
  );
  const isLoading: boolean =
    useSelector((state: AppState) =>
      showAppLevelInviteModal
        ? getApplicationLoadingStates(state).isFetchingAllUsers
        : selectedWorkspaceLoadingStates(state).isFetchingAllUsers,
    ) || false;

  const userWorkspacePermissions = currentWorkspace?.userPermissions ?? [];
  const canManage = isPermitted(
    userWorkspacePermissions,
    PERMISSION_TYPE.MANAGE_WORKSPACE,
  );

  const allUsersProfiles = React.useMemo(
    () =>
      allUsers.map(
        (user: {
          userId: string;
          username: string;
          permissionGroupId: string;
          permissionGroupName: string;
          name: string;
          roles: WorkspaceUserRoles[];
          userGroupId?: string;
        }) => ({
          ...user,
          initials: getInitialsFromName(user.name || user.username),
        }),
      ),
    [allUsers],
  );

  return (
    <WorkspaceInviteWrapper>
      <InviteUsersForm {...props} />
      {isLoading ? (
        <div className="pt-4 overflow-hidden">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {allUsers.length === 0 && (
            <MailConfigContainer data-testid="t--no-users-content">
              <NoEmailConfigImage />
              <Text kind="action-s">{createMessage(NO_USERS_INVITED)}</Text>
            </MailConfigContainer>
          )}
          <UserList ref={userRef}>
            {allUsersProfiles.map(
              (user: {
                username: string;
                name: string;
                roles: WorkspaceUserRoles[];
                initials: string;
                photoId?: string;
                userId: string;
                userGroupId?: string;
              }) => {
                const showUser =
                  (showAppLevelInviteModal
                    ? user.roles?.[0]?.entityType === ENTITY_TYPE.APPLICATION
                    : user.roles?.[0]?.entityType === ENTITY_TYPE.WORKSPACE) &&
                  user.roles?.[0]?.id;
                return showUser ? (
                  <User
                    key={user?.userGroupId ? user.userGroupId : user.username}
                  >
                    <UserInfo>
                      {user?.userGroupId ? (
                        <>
                          <Icon
                            className="user-icons"
                            name="group-line"
                            size="lg"
                          />
                          <UserName>
                            <Text
                              color="var(--ads-v2-color-fg)"
                              kind="heading-xs"
                            >
                              {user.name}
                            </Text>
                          </UserName>
                        </>
                      ) : (
                        <>
                          <Avatar
                            firstLetter={user.initials}
                            image={
                              user.photoId
                                ? `/api/${USER_PHOTO_ASSET_URL}/${user.photoId}`
                                : undefined
                            }
                            isTooltipEnabled={false}
                            label={user.name || user.username}
                          />
                          <UserName>
                            <Tooltip content={user.username} placement="top">
                              <Text
                                color="var(--ads-v2-color-fg)"
                                kind="heading-xs"
                              >
                                {user.name}
                              </Text>
                            </Tooltip>
                          </UserName>
                        </>
                      )}
                    </UserInfo>
                    <UserRole>
                      <Text kind="action-m">
                        {user.roles?.[0]?.name?.split(" - ")[0] || ""}
                      </Text>
                    </UserRole>
                  </User>
                ) : null;
              },
            )}
          </UserList>
        </>
      )}
      {canManage && (
        <ManageUsersContainer>
          <ManageUsers workspaceId={props.workspaceId} />
        </ManageUsersContainer>
      )}
    </WorkspaceInviteWrapper>
  );
}

export default WorkspaceInviteUsers;
