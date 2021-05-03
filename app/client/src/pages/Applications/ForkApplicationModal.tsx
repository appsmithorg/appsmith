import React, { useState, useMemo, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "store";
import { getUserApplicationsOrgs } from "selectors/applicationSelectors";
import { isPermitted, PERMISSION_TYPE } from "./permissionHelpers";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { AppState } from "reducers";
import { Size } from "components/ads/Button";
import {
  StyledDialog,
  StyledRadioComponent,
  ForkButton,
  OrganizationList,
  ButtonWrapper,
  TriggerButton,
  SpinnerWrapper,
} from "./ForkModalStyles";
import Divider from "components/editorComponents/Divider";
import { createMessage, FORK_APP } from "constants/messages";
import { getAllApplications } from "actions/applicationActions";
import { getIsFetchingApplications } from "selectors/applicationSelectors";
import { useLocation } from "react-router";
import { getApplicationViewerPageURL } from "constants/routes";
import { getCurrentPageId } from "selectors/editorSelectors";
import Spinner from "components/ads/Spinner";
import { IconSize } from "components/ads/Icon";

function ForkApplicationModal(props: any) {
  const { isDeployedApp, applicationId, setModalClose, isModalOpen } = props;
  const [organizationId, selectOrganizationId] = useState("");
  const dispatch = useDispatch();
  const userOrgs = useSelector(getUserApplicationsOrgs);
  const forkingApplication = useSelector(
    (state: AppState) => state.ui.applications.forkingApplication,
  );
  let showForkModal = props.isModalOpen;
  useEffect(() => {
    if (!isDeployedApp) {
      showForkModal = props.isModalOpen;
    }
  }, [props.isModalOpen]);

  useEffect(() => {
    if (isDeployedApp) {
      dispatch(getAllApplications());
    }
  }, [dispatch, getAllApplications]);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const currentPageId = useSelector(getCurrentPageId);
  const { pathname } = useLocation();

  if (isDeployedApp) {
    showForkModal =
      pathname ===
      `${getApplicationViewerPageURL(props.applicationId, currentPageId)}/fork`;
  }

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

  return (
    <StyledDialog
      canOutsideClickClose
      className={"fork-modal"}
      isOpen={showForkModal}
      maxHeight={"540px"}
      setModalClose={setModalClose}
      title={"Choose where to fork the app"}
      trigger={
        isDeployedApp ? (
          <TriggerButton
            className="t--fork-app"
            icon="fork"
            onClick={() => dispatch(getAllApplications())}
            size={Size.small}
            text={createMessage(FORK_APP)}
          />
        ) : null
      }
    >
      <Divider />
      {isDeployedApp && isFetchingApplications && (
        <SpinnerWrapper>
          <Spinner size={IconSize.XXXL} />
        </SpinnerWrapper>
      )}
      {!isDeployedApp && !organizationList.length && (
        <SpinnerWrapper>
          <Spinner size={IconSize.XXXL} />
        </SpinnerWrapper>
      )}
      {organizationList.length && (
        <OrganizationList>
          <StyledRadioComponent
            className={"radio-group"}
            columns={1}
            defaultValue={organizationList[0].value}
            onSelect={(value) => selectOrganizationId(value)}
            options={organizationList}
          />
        </OrganizationList>
      )}
      <ButtonWrapper>
        <ForkButton
          disabled={!organizationId}
          isLoading={forkingApplication}
          onClick={forkApplication}
          size={Size.large}
          text={"FORK"}
        />
      </ButtonWrapper>
    </StyledDialog>
  );
}

export default ForkApplicationModal;
