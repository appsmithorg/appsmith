import React, { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "store";
import { getUserApplicationsOrgs } from "selectors/applicationSelectors";
import { isPermitted, PERMISSION_TYPE } from "./permissionHelpers";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { AppState } from "reducers";
import ForkApplicationAcrossOrganisationsModal from "./ForkApplicationAcrossOrganisationsModal";
import ForkApplicationModal from "./ForkApplicationModal";

const ForkApplicationModalHOC = (props: any) => {
  const { isDeployedApp, applicationId, setModalClose, isModalOpen } = props;
  const [organizationId, selectOrganizationId] = useState("");
  const dispatch = useDispatch();
  const userOrgs = useSelector(getUserApplicationsOrgs);
  const forkingApplication = useSelector(
    (state: AppState) => state.ui.applications.forkingApplication,
  );
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

  if (isDeployedApp) {
    return (
      <ForkApplicationModal
        organizationList={organizationList}
        selectOrganizationId={selectOrganizationId}
        forkingApplication={forkingApplication}
        organizationId={organizationId}
        forkApplication={forkApplication}
      />
    );
  }
  return (
    <ForkApplicationAcrossOrganisationsModal
      setModalClose={setModalClose}
      isModalOpen={isModalOpen}
      applicationId={applicationId}
      organizationList={organizationList}
      selectOrganizationId={selectOrganizationId}
      forkingApplication={forkingApplication}
      organizationId={organizationId}
      forkApplication={forkApplication}
    />
  );
};

export default ForkApplicationModalHOC;
