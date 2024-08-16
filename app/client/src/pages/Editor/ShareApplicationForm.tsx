import React from "react";
import styled from "styled-components";
import { withRouter } from "react-router";
import { connect } from "react-redux";
import type { AppState } from "ee/reducers";
import { Switch } from "@appsmith/ads-old";
import Spinner from "components/editorComponents/Spinner";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { getCurrentApplicationId } from "selectors/editorSelectors";

const ShareWithPublicOption = styled.div`
   {
    display: flex;
    padding-top: 20px;
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

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ShareApplicationForm(props: any) {
  const {
    applicationId,
    changeAppViewAccess,
    currentApplicationDetails,
    isChangingViewAccess,
    isFetchingApplication,
  } = props;

  return (
    <ShareWithPublicOption>
      Share the application with anyone
      <ShareToggle>
        {(isChangingViewAccess || isFetchingApplication) && (
          <Spinner size={20} />
        )}
        {currentApplicationDetails && (
          <Switch
            checked={currentApplicationDetails.isPublic}
            disabled={isChangingViewAccess || isFetchingApplication}
            large
            onChange={() => {
              changeAppViewAccess(
                applicationId,
                !currentApplicationDetails.isPublic,
              );
            }}
          />
        )}
      </ShareToggle>
    </ShareWithPublicOption>
  );
}

const mapStateToProps = (state: AppState) => ({
  currentApplicationDetails: state.ui.applications.currentApplication,
  isFetchingApplication: state.ui.applications.isFetchingApplication,
  isChangingViewAccess: state.ui.applications.isChangingViewAccess,
  applicationId: getCurrentApplicationId(state),
});

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any) => ({
  changeAppViewAccess: (applicationId: string, publicAccess: boolean) =>
    dispatch({
      type: ReduxActionTypes.CHANGE_APPVIEW_ACCESS_INIT,
      payload: {
        applicationId,
        publicAccess,
      },
    }),
});

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(ShareApplicationForm),
);
