import React, { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "store";
import { getUserApplicationsOrgs } from "selectors/applicationSelectors";
import { isPermitted, PERMISSION_TYPE } from "./permissionHelpers";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { AppState } from "reducers";
import ForkApplicationAcrossOrganisationsModal from "./ForkApplicationAcrossOrganisationsModal";
import ForkApplicationModalDeployed from "./ForkApplicationModalDeployed";

function ForkApplicationModal(props: any) {
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
      <ForkApplicationModalDeployed
        forkApplication={forkApplication}
        forkingApplication={forkingApplication}
        organizationId={organizationId}
        organizationList={organizationList}
        selectOrganizationId={selectOrganizationId}
      />
    );
  }
  return (
    <ForkApplicationAcrossOrganisationsModal
      applicationId={applicationId}
      forkApplication={forkApplication}
      forkingApplication={forkingApplication}
      isModalOpen={isModalOpen}
      organizationId={organizationId}
      organizationList={organizationList}
      selectOrganizationId={selectOrganizationId}
      setModalClose={setModalClose}
    />
  );
}

export default ForkApplicationModal;
