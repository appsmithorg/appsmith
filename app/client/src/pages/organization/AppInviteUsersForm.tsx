import React, { useEffect } from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { getCurrentOrg } from "selectors/organizationSelectors";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import CopyToClipBoard from "components/designSystems/appsmith/CopyToClipBoard";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "../Applications/permissionHelpers";
import { getDefaultPageId } from "sagas/SagaUtils";
import { getApplicationViewerPageURL } from "constants/routes";
import OrgInviteUsersForm from "./OrgInviteUsersForm";
import { getCurrentUser } from "selectors/usersSelectors";
import Text, { TextType } from "components/ads/Text";
import Toggle from "components/ads/Toggle";
import { ANONYMOUS_USERNAME } from "constants/userConstants";

const Title = styled.div`
  padding: 10px 0px;
`;

const ShareWithPublicOption = styled.div`
  display: flex;
  margin-bottom: 15px;
  align-items: center;
  justify-content: space-between;
`;

const ShareToggle = styled.div`
  flex-basis: 48px;
  height: 23px;
`;

const AppInviteUsersForm = (props: any) => {
  const {
    isFetchingApplication,
    isChangingViewAccess,
    currentApplicationDetails,
    changeAppViewAccess,
    applicationId,
    fetchCurrentOrg,
    currentOrg,
    currentUser,
  } = props;

  const userOrgPermissions = currentOrg?.userPermissions ?? [];
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
    const defaultPageId = getDefaultPageId(currentApplicationDetails.pages);
    const appViewEndPoint = getApplicationViewerPageURL(
      applicationId,
      defaultPageId,
    );
    return window.location.origin.toString() + appViewEndPoint;
  };

  useEffect(() => {
    if (currentUser.name !== ANONYMOUS_USERNAME) {
      fetchCurrentOrg(props.orgId);
    }
  }, [props.orgId, fetchCurrentOrg, currentUser.name]);

  return (
    <>
      {canShareWithPublic && (
        <>
          <ShareWithPublicOption>
            <Text type={TextType.H5}>Make the application public</Text>
            <ShareToggle>
              {currentApplicationDetails && (
                <Toggle
                  isLoading={isChangingViewAccess || isFetchingApplication}
                  value={currentApplicationDetails.isPublic}
                  disabled={isChangingViewAccess || isFetchingApplication}
                  onToggle={() => {
                    changeAppViewAccess(
                      applicationId,
                      !currentApplicationDetails.isPublic,
                    );
                  }}
                />
              )}
            </ShareToggle>
          </ShareWithPublicOption>
        </>
      )}
      <Title>
        <Text type={TextType.H5}>
          Get Shareable link for this for this application
        </Text>
      </Title>
      <CopyToClipBoard copyText={getViewApplicationURL()} />

      {canInviteToOrg && (
        <OrgInviteUsersForm orgId={props.orgId} isApplicationInvite={true} />
      )}
    </>
  );
};

export default connect(
  (state: AppState) => {
    return {
      currentOrg: getCurrentOrg(state),
      currentUser: getCurrentUser(state),
      currentApplicationDetails: state.ui.applications.currentApplication,
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
