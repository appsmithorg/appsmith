import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { connect, useSelector } from "react-redux";
import { PopoverPosition } from "@blueprintjs/core";
import type { AppState } from "@appsmith/reducers";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { Case, Icon, IconSize, TooltipComponent } from "design-system-old";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import WorkspaceInviteUsersForm from "@appsmith/pages/workspace/WorkspaceInviteUsersForm";
import { getCurrentUser } from "selectors/usersSelectors";
import { Text, TextType, Toggle } from "design-system-old";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { Colors } from "constants/Colors";
import { viewerURL } from "RouteBuilder";
import { fetchWorkspace } from "@appsmith/actions/workspaceActions";
import useWorkspace from "utils/hooks/useWorkspace";
import TooltipWrapper from "pages/Applications/EmbedSnippet/TooltipWrapper";
import {
  createMessage,
  INVITE_USERS_PLACEHOLDER,
  IN_APP_EMBED_SETTING,
  MAKE_APPLICATION_PUBLIC,
  MAKE_APPLICATION_PUBLIC_TOOLTIP,
} from "@appsmith/constants/messages";
import { getAppsmithConfigs } from "@appsmith/configs";

const { cloudHosting } = getAppsmithConfigs();

const ShareToggle = styled.div`
  flex-basis: 46px;
  height: 23px;
`;

const BottomContainer = styled.div<{ canInviteToWorkspace?: boolean }>`
  ${({ canInviteToWorkspace }) =>
    canInviteToWorkspace ? `border-top: 1px solid ${Colors.GREY_200}` : ``};
`;

function AppInviteUsersForm(props: any) {
  const {
    applicationId,
    changeAppViewAccess,
    currentApplicationDetails,
    currentUser,
    defaultPageId,
    fetchCurrentWorkspace,
    isChangingViewAccess,
    isFetchingApplication,
  } = props;
  const [isCopied, setIsCopied] = useState(false);
  const currentWorkspaceId = useSelector(getCurrentWorkspaceId);
  const currentWorkspace = useWorkspace(currentWorkspaceId);
  const userWorkspacePermissions = currentWorkspace.userPermissions ?? [];
  const userAppPermissions = currentApplicationDetails?.userPermissions ?? [];
  const canInviteToWorkspace = isPermitted(
    userWorkspacePermissions,
    PERMISSION_TYPE.INVITE_USER_TO_WORKSPACE,
  );
  const canShareWithPublic = isPermitted(
    userAppPermissions,
    PERMISSION_TYPE.MAKE_PUBLIC_APPLICATION,
  );
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
      pageId: defaultPageId,
    });
    return window.location.origin.toString() + url;
  }, [defaultPageId]);

  useEffect(() => {
    if (currentUser?.name !== ANONYMOUS_USERNAME && canInviteToWorkspace) {
      fetchCurrentWorkspace(props.workspaceId);
    }
  }, [props.workspaceId, fetchCurrentWorkspace, currentUser?.name]);

  return (
    <>
      {canInviteToWorkspace && (
        <WorkspaceInviteUsersForm
          applicationId={applicationId}
          isApplicationInvite
          placeholder={createMessage(INVITE_USERS_PLACEHOLDER, cloudHosting)}
          workspaceId={props.workspaceId}
        />
      )}
      <BottomContainer
        canInviteToWorkspace={canInviteToWorkspace}
        className={`flex space-between ${
          canInviteToWorkspace ? "mt-6 pt-5" : ""
        }`}
      >
        <div
          className="flex gap-1.5 cursor-pointer"
          data-cy={"copy-application-url"}
          onClick={copyToClipboard}
        >
          <Icon
            fillColor={Colors.GRAY_700}
            name="links-line"
            size={IconSize.XL}
          />
          <Text
            case={Case.UPPERCASE}
            className="self-center"
            color={Colors.GRAY_700}
            type={TextType.P4}
          >{`${
            isCopied
              ? createMessage(IN_APP_EMBED_SETTING.copied)
              : createMessage(IN_APP_EMBED_SETTING.copy)
          } ${createMessage(IN_APP_EMBED_SETTING.applicationUrl)}`}</Text>
        </div>
        {canShareWithPublic && (
          <div className="flex flex-1 items-center justify-end">
            <Text color={Colors.GRAY_800} type={TextType.P1}>
              {createMessage(MAKE_APPLICATION_PUBLIC)}
            </Text>
            <TooltipComponent
              content={
                <TooltipWrapper className="text-center">
                  {createMessage(MAKE_APPLICATION_PUBLIC_TOOLTIP)}
                </TooltipWrapper>
              }
              position={PopoverPosition.TOP_RIGHT}
            >
              <Icon
                className="pl-1"
                fillColor={Colors.GRAY2}
                name="question-fill"
                size={IconSize.XL}
              />
            </TooltipComponent>
            <ShareToggle className="ml-4 t--share-public-toggle">
              {currentApplicationDetails && (
                <Toggle
                  disabled={isChangingViewAccess || isFetchingApplication}
                  isLoading={isChangingViewAccess || isFetchingApplication}
                  onToggle={() => {
                    changeAppViewAccess(
                      applicationId,
                      !currentApplicationDetails.isPublic,
                    );
                  }}
                  value={currentApplicationDetails.isPublic}
                />
              )}
            </ShareToggle>
          </div>
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
      defaultPageId: state.entities.pageList.defaultPageId,
      isFetchingApplication: state.ui.applications.isFetchingApplication,
      isChangingViewAccess: state.ui.applications.isChangingViewAccess,
    };
  },
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
      dispatch(fetchWorkspace(workspaceId)),
  }),
)(AppInviteUsersForm);
