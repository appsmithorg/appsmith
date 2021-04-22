import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Dialog from "components/ads/DialogComponent";
import { useDispatch } from "react-redux";
import { useSelector } from "store";
import { AppState } from "reducers";
import { useLocation } from "react-router";
import { getAllApplications } from "actions/applicationActions";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { Classes } from "@blueprintjs/core";
import {
  getIsFetchingApplications,
  getUserApplicationsOrgs,
} from "selectors/applicationSelectors";
import { isPermitted, PERMISSION_TYPE } from "./permissionHelpers";
// import { getApplicationDashboardPageURLWithAppId } from "constants/routes";

const StyledDialog = styled(Dialog)`
  && .${Classes.DIALOG_BODY} {
    padding-top: 0px;
  }
`;

const ForkApplicationAcrossOrganisationsModal = (props: any) => {
  const [organizationId, selectOrganizationId] = useState("");
  const dispatch = useDispatch();
  // useEffect(() => {
  //   dispatch(getAllApplications());
  // }, [dispatch, getAllApplications]);
  const userOrgs = useSelector(getUserApplicationsOrgs);
  const forkingApplication = useSelector(
    (state: AppState) => state.ui.applications.forkingApplication,
  );
  const { pathname } = useLocation();
  const forkApplication = () => {
    dispatch({
      type: ReduxActionTypes.FORK_APPLICATION_INIT,
      payload: {
        applicationId: props.applicationId,
        organizationId,
      },
    });
  };
  const organizationList = useMemo(() => {
    const filteredUserOrgs = userOrgs.filter((item) => {
      const permitted = isPermitted(
        item.organization.userPermissions ?? [],
        PERMISSION_TYPE.CREATE_APPLICATION,
      );
      return permitted;
    });

    if (filteredUserOrgs.length) {
      selectOrganizationId(filteredUserOrgs[0].organization.id);
    }

    return filteredUserOrgs.map((org) => {
      return {
        label: org.organization.name,
        value: org.organization.id,
      };
    });
  }, [userOrgs]);
  let showForkModal = props.isModalOpen;
  useEffect(() => {
    showForkModal = props.isModalOpen;
  }, []);

  return (
    <StyledDialog
      title={"Choose where to fork the app"}
      maxHeight={"540px"}
      className={"fork-modal"}
      canOutsideClickClose={true}
      isOpen={showForkModal}
    ></StyledDialog>
  );
};

export default ForkApplicationAcrossOrganisationsModal;
