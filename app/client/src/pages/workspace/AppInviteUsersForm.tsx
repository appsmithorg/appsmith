import React, { useEffect } from "react";
import styled, { css } from "styled-components";
import { connect, useSelector } from "react-redux";
import { AppState } from "@appsmith/reducers";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { CopyToClipboard } from "design-system";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import WorkspaceInviteUsersForm, {
  InviteButtonWidth,
} from "@appsmith/pages/workspace/WorkspaceInviteUsersForm";
import { getCurrentUser } from "selectors/usersSelectors";
import { Text, TextType, Toggle } from "design-system";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { Colors } from "constants/Colors";
import { viewerURL } from "RouteBuilder";
import { fetchWorkspace } from "actions/workspaceActions";
import useWorkspace from "utils/hooks/useWorkspace";

const StyledCopyToClipBoard = styled(CopyToClipboard)`
  margin-bottom: 24px;
`;

const CommonTitleTextStyle = css`
  color: ${Colors.CHARCOAL};
  font-weight: normal;
`;

const Title = styled.div`
  padding: 0 0 8px 0;
  & > span[type="h5"] {
    ${CommonTitleTextStyle}
  }
`;

const ShareWithPublicOption = styled.div`
  display: flex;
  margin-bottom: 8px;
  align-items: center;
  justify-content: space-between;

  & > span[type="h5"] {
    ${CommonTitleTextStyle}
    color: ${Colors.COD_GRAY};
  }
`;

const ShareToggle = styled.div`
  flex-basis: 46px;
  height: 23px;
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
      {canShareWithPublic && (
        <ShareWithPublicOption>
          <Text type={TextType.H5}>Make the application public</Text>
          <ShareToggle className="t--share-public-toggle">
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
        </ShareWithPublicOption>
      )}
      <Title>
        <Text type={TextType.H5}>Get shareable link for this application</Text>
      </Title>
      <StyledCopyToClipBoard
        btnWidth={InviteButtonWidth}
        copyText={appViewEndPoint}
      />

      {canInviteToWorkspace && (
        <WorkspaceInviteUsersForm
          isApplicationInvite
          workspaceId={props.workspaceId}
        />
      )}
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
