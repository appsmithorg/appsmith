import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { connect, useSelector } from "react-redux";
import type { AppState } from "ee/reducers";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { isPermitted, PERMISSION_TYPE } from "ee/utils/permissionHelpers";
import WorkspaceInviteUsersForm from "pages/workspace/WorkspaceInviteUsersForm";
import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { viewerURL } from "ee/RouteBuilder";
import { fetchWorkspace } from "ee/actions/workspaceActions";
import {
  createMessage,
  INVITE_USERS_PLACEHOLDER,
  IN_APP_EMBED_SETTING,
  MAKE_APPLICATION_PUBLIC,
  MAKE_APPLICATION_PUBLIC_TOOLTIP,
} from "ee/constants/messages";
import { hasInviteUserToApplicationPermission } from "ee/utils/permissionHelpers";
import { Button, Icon, Switch, Tooltip } from "@appsmith/ads";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";

const SwitchContainer = styled.div`
  flex-basis: 220px;
`;

const BottomContainer = styled.div<{ canInviteToApplication?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  ${({ canInviteToApplication }) =>
    canInviteToApplication
      ? `border-top: 1px solid var(--ads-v2-color-border);`
      : `none`};

  .self-center {
    line-height: normal;
  }
`;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AppInviteUsersForm(props: any) {
  const {
    applicationId,
    changeAppViewAccess,
    currentApplicationDetails,
    currentUser,
    defaultBasePageId,
    fetchCurrentWorkspace,
    isChangingViewAccess,
    isFetchingApplication,
  } = props;
  const [isCopied, setIsCopied] = useState(false);
  const currentWorkspace = useSelector(getCurrentAppWorkspace);
  const userWorkspacePermissions = currentWorkspace?.userPermissions ?? [];
  const userAppPermissions = currentApplicationDetails?.userPermissions ?? [];
  const canInviteToApplication = hasInviteUserToApplicationPermission([
    ...userWorkspacePermissions,
    ...userAppPermissions,
  ]);
  const canShareWithPublic = isPermitted(
    userAppPermissions,
    PERMISSION_TYPE.MAKE_PUBLIC_APPLICATION,
  );

  const isGACEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const copyToClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(appViewEndPoint);
    } else {
      // text area method for http urls where navigator.clipboard doesn't work
      const textArea = document.createElement("textarea");

      textArea.value = appViewEndPoint;
      // make the textarea out of viewport
      textArea.style.position = "absolute";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      new Promise((res, rej) => {
        // here the magic happens
        document.execCommand("copy") ? res(appViewEndPoint) : rej();
        textArea.remove();
      });
    }

    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 3000);
  };

  const appViewEndPoint = React.useMemo(() => {
    const url = viewerURL({
      basePageId: defaultBasePageId,
    });

    return window.location.origin.toString() + url;
  }, [defaultBasePageId]);

  useEffect(() => {
    if (currentUser?.name !== ANONYMOUS_USERNAME) {
      fetchCurrentWorkspace(props.workspaceId);
    }
  }, [props.workspaceId, fetchCurrentWorkspace, currentUser?.name]);

  return (
    <>
      {canInviteToApplication && (
        <WorkspaceInviteUsersForm
          applicationId={applicationId}
          isApplicationPage
          placeholder={createMessage(INVITE_USERS_PLACEHOLDER, !isGACEnabled)}
          workspaceId={props.workspaceId}
        />
      )}
      <BottomContainer
        canInviteToApplication={canInviteToApplication}
        className={`${canInviteToApplication ? "pt-3" : ""}`}
      >
        <Button
          className="flex gap-1.5 cursor-pointer"
          data-testid={"copy-application-url"}
          endIcon="links-line"
          kind="tertiary"
          onClick={copyToClipboard}
          size="md"
        >
          {`${
            isCopied
              ? createMessage(IN_APP_EMBED_SETTING.copied)
              : createMessage(IN_APP_EMBED_SETTING.copy)
          } ${createMessage(IN_APP_EMBED_SETTING.applicationUrl)}`}
        </Button>
        {canShareWithPublic && (
          <SwitchContainer className="t--share-public-toggle">
            {currentApplicationDetails && (
              <Switch
                isDisabled={isChangingViewAccess || isFetchingApplication}
                isSelected={currentApplicationDetails.isPublic}
                onChange={() => {
                  AnalyticsUtil.logEvent("MAKE_APPLICATION_PUBLIC", {
                    isPublic: !currentApplicationDetails.isPublic,
                  });
                  changeAppViewAccess(
                    applicationId,
                    !currentApplicationDetails.isPublic,
                  );
                }}
              >
                {createMessage(MAKE_APPLICATION_PUBLIC)}
                {/* TODO: Fix this the next time the file is edited */}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <div onClick={(e: any) => e.preventDefault()}>
                  <Tooltip
                    content={createMessage(MAKE_APPLICATION_PUBLIC_TOOLTIP)}
                    placement="top"
                  >
                    <Icon
                      className="-ml-2 cursor-pointer"
                      name="question-line"
                      size="md"
                    />
                  </Tooltip>
                </div>
              </Switch>
            )}
          </SwitchContainer>
        )}
      </BottomContainer>
    </>
  );
}

export default connect(
  (state: AppState) => {
    return {
      currentUser: getCurrentUser(state),
      currentApplicationDetails: state.ui.applications.currentApplication,
      defaultPageId: state.entities.pageList.defaultBasePageId,
      isFetchingApplication: state.ui.applications.isFetchingApplication,
      isChangingViewAccess: state.ui.applications.isChangingViewAccess,
    };
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (dispatch: any) => ({
    changeAppViewAccess: (applicationId: string, publicAccess: boolean) =>
      dispatch({
        type: ReduxActionTypes.CHANGE_APPVIEW_ACCESS_INIT,
        payload: {
          applicationId,
          publicAccess,
        },
      }),
    fetchCurrentWorkspace: (workspaceId: string) =>
      dispatch(fetchWorkspace(workspaceId, true)),
  }),
)(AppInviteUsersForm);
