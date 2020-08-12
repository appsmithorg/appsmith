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
import { StyledSwitch } from "components/propertyControls/StyledControls";
import Spinner from "components/editorComponents/Spinner";
import { getCurrentUser } from "selectors/usersSelectors";

const Title = styled.div`
  font-weight: bold;
  padding: 10px 0px;
`;

const ShareWithPublicOption = styled.div`
   {
    display: flex;
    padding: 10px 0px;
    justify-content: space-between;
  }
`;

const ShareToggle = styled.div`
   {
    &&& label {
      margin-bottom: 0px;
    }
    &&& div {
      margin-right: 5px;
    }
    display: flex;
  }
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
    if (currentUser.name !== "anonymousUser") {
      fetchCurrentOrg(props.orgId);
    }
  }, [props.orgId, fetchCurrentOrg, currentUser.name]);

  return (
    <>
      {canShareWithPublic ? (
        <>
          <ShareWithPublicOption>
            Make the application public
            <ShareToggle>
              {(isChangingViewAccess || isFetchingApplication) && (
                <Spinner size={20} />
              )}
              {currentApplicationDetails && (
                <StyledSwitch
                  onChange={() => {
                    changeAppViewAccess(
                      applicationId,
                      !currentApplicationDetails.isPublic,
                    );
                  }}
                  disabled={isChangingViewAccess || isFetchingApplication}
                  checked={currentApplicationDetails.isPublic}
                  large
                />
              )}
            </ShareToggle>
          </ShareWithPublicOption>
          {currentApplicationDetails.isPublic && (
            <CopyToClipBoard copyText={getViewApplicationURL()} />
          )}
        </>
      ) : (
        <>
          <Title>Get Shareable link for this for this application </Title>
          <CopyToClipBoard copyText={getViewApplicationURL()} />
        </>
      )}
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
