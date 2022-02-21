import React, { useEffect } from "react";
import styled, { css } from "styled-components";
import { connect, useSelector } from "react-redux";
import { AppState } from "reducers";
import { getCurrentAppOrg } from "selectors/organizationSelectors";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import CopyToClipBoard from "components/ads/CopyToClipBoard";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "../Applications/permissionHelpers";
import { getApplicationViewerPageURL } from "constants/routes";
import OrgInviteUsersForm, { InviteButtonWidth } from "./OrgInviteUsersForm";
import { getCurrentUser } from "selectors/usersSelectors";
import Text, { TextType } from "components/ads/Text";
import Toggle from "components/ads/Toggle";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { Colors } from "constants/Colors";

const CommonTitleTextStyle = css`
  color: ${Colors.CHARCOAL};
  font-weight: normal;
`;

const Title = styled.div`
  padding: 0 0 10px 0;
  & > span[type="h5"] {
    ${CommonTitleTextStyle}
  }
`;

const StyledCopyToClipBoard = styled(CopyToClipBoard)`
  margin-bottom: 24px;
`;

const ShareWithPublicOption = styled.div`
  display: flex;
  margin-bottom: 24px;
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
    fetchCurrentOrg,
    isChangingViewAccess,
    isFetchingApplication,
  } = props;

  const currentOrg = useSelector(getCurrentAppOrg);
  const userOrgPermissions = currentOrg.userPermissions ?? [];
  const userAppPermissions = currentApplicationDetails?.userPermissions ?? [];
  const canInviteToOrg = isPermitted(
    userOrgPermissions,
    PERMISSION_TYPE.INVITE_USER_TO_ORGANIZATION,
  );
  const canShareWithPublic = isPermitted(
    userAppPermissions,
    PERMISSION_TYPE.MAKE_PUBLIC_APPLICATION,
  );

  const getViewApplicationURL = () => {
    const appViewEndPoint = getApplicationViewerPageURL({
      applicationId: applicationId,
      pageId: defaultPageId,
    });
    return window.location.origin.toString() + appViewEndPoint;
  };

  useEffect(() => {
    if (currentUser?.name !== ANONYMOUS_USERNAME && canInviteToOrg) {
      fetchCurrentOrg(props.orgId);
    }
  }, [props.orgId, fetchCurrentOrg, currentUser?.name]);

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
        copyText={getViewApplicationURL()}
      />

      {canInviteToOrg && (
        <OrgInviteUsersForm isApplicationInvite orgId={props.orgId} />
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
    fetchCurrentOrg: (orgId: string) =>
      dispatch({
        type: ReduxActionTypes.FETCH_CURRENT_ORG,
        payload: {
          orgId,
        },
      }),
  }),
)(AppInviteUsersForm);
