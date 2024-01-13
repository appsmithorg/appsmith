import React, { useState, useRef } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import {
  getAllUsers,
  getCurrentAppWorkspace,
  getWorkspaceLoadingStates,
} from "@appsmith/selectors/workspaceSelectors";
import { createMessage, NO_USERS_INVITED } from "@appsmith/constants/messages";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import { getAppsmithConfigs } from "@appsmith/configs";
import { Avatar, Icon, Spinner, Text, Tooltip } from "design-system";
import { getInitialsFromName } from "utils/AppsmithUtils";
import ManageUsers from "pages/workspace/ManageUsers";
import { USER_PHOTO_ASSET_URL } from "constants/userConstants";
import { importSvg } from "design-system-old";
import type { WorkspaceUserRoles } from "@appsmith/constants/workspaceConstants";
import { getDomainFromEmail } from "utils/helpers";
import { getCurrentUser } from "selectors/usersSelectors";
import PartnerProgramCallout from "pages/workspace/PartnerProgramCallout";
import {
  getPartnerProgramCalloutShown,
  setPartnerProgramCalloutShown,
} from "utils/storage";
import InviteUsersForm from "@appsmith/pages/workspace/InviteUsersForm";
import { ENTITY_TYPE } from "@appsmith/constants/workspaceConstants";
import {
  getAllAppUsers,
  getApplicationLoadingStates,
} from "@appsmith/selectors/applicationSelectors";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

const NoEmailConfigImage = importSvg(
  async () => import("assets/images/email-not-configured.svg"),
);

const { cloudHosting } = getAppsmithConfigs();

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

function WorkspaceInviteUsers(props: any) {
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const userRef = React.createRef<HTMLDivElement>();
  const currentUser = useSelector(getCurrentUser);
  const currentWorkspace = useSelector(getCurrentAppWorkspace);
  const showAppLevelInviteModal =
    (isFeatureEnabled && props.isApplicationPage) || false;
  const allUsers = useSelector(
    showAppLevelInviteModal ? getAllAppUsers : getAllUsers,
  );
  const isLoading: boolean =
    useSelector(
      showAppLevelInviteModal
        ? getApplicationLoadingStates
        : getWorkspaceLoadingStates,
    )?.isFetchingAllUsers || false;

  const emailOutsideCurrentDomain = useRef<undefined | string>();
  const [showPartnerProgramCallout, setShowPartnerProgramCallout] =
    useState(false);

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

  const checkIfInvitedUsersFromDifferentDomain = async (
    invitedEmails?: string[],
  ) => {
    if (!currentUser?.email) return true;

    const currentUserEmail = currentUser?.email;
    const partnerProgramCalloutShown = await getPartnerProgramCalloutShown();
    const currentUserDomain = getDomainFromEmail(currentUserEmail);

    if (invitedEmails && !partnerProgramCalloutShown) {
      const _emailOutsideCurrentDomain = invitedEmails.find(
        (email) => getDomainFromEmail(email) !== currentUserDomain,
      );
      if (_emailOutsideCurrentDomain) {
        emailOutsideCurrentDomain.current = _emailOutsideCurrentDomain;
        invitedEmails = undefined;
        setShowPartnerProgramCallout(true);
      }
    }
  };

  return (
    <WorkspaceInviteWrapper>
      <InviteUsersForm
        {...props}
        checkIfInvitedUsersFromDifferentDomain={
          checkIfInvitedUsersFromDifferentDomain
        }
      />
      {!cloudHosting &&
        showPartnerProgramCallout &&
        emailOutsideCurrentDomain.current && (
          <div className="mt-2">
            <PartnerProgramCallout
              email={emailOutsideCurrentDomain.current}
              onClose={() => {
                setShowPartnerProgramCallout(false);
                setPartnerProgramCalloutShown();
                emailOutsideCurrentDomain.current = undefined;
              }}
            />
          </div>
        )}
      {isLoading ? (
        <div className="pt-4 overflow-hidden">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {allUsers.length === 0 && (
            <MailConfigContainer data-testid="no-users-content">
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
