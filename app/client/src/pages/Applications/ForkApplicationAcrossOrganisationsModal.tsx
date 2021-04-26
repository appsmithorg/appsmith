import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Dialog from "components/ads/DialogComponent";
import Button, { Size } from "components/ads/Button";
import RadioComponent from "components/ads/Radio";
import { useDispatch } from "react-redux";
import { useSelector } from "store";
import { AppState } from "reducers";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { Classes } from "@blueprintjs/core";
import { getUserApplicationsOrgs } from "selectors/applicationSelectors";
import { isPermitted, PERMISSION_TYPE } from "./permissionHelpers";

const StyledDialog = styled(Dialog)`
  && .${Classes.DIALOG_BODY} {
    padding-top: 0px;
  }
`;

const OrganizationList = styled.div`
  overflow: auto;
  max-height: 250px;
  margin-bottom: 10px;
  margin-top: 20px;
`;

const StyledRadioComponent = styled(RadioComponent)`
  label {
    font-size: 16px;
    margin-bottom: 32px;
  }
`;

const ForkButton = styled(Button)`
  height: 38px;
  width: 203px;
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const ForkApplicationAcrossOrganisationsModal = (props: any) => {
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
      setModalClose={props.setModalClose}
    >
      {organizationList.length && (
        <OrganizationList>
          <StyledRadioComponent
            data-cy="t--org-list-fork-app"
            className={"radio-group"}
            columns={1}
            defaultValue={organizationList[0].value}
            options={organizationList}
            onSelect={(value) => selectOrganizationId(value)}
          />
        </OrganizationList>
      )}
      <ButtonWrapper>
        <ForkButton
          isLoading={forkingApplication}
          disabled={!organizationId}
          text={"FORK"}
          data-cy="t--fork-app-to-org-button"
          onClick={forkApplication}
          size={Size.large}
        />
      </ButtonWrapper>
    </StyledDialog>
  );
};

export default ForkApplicationAcrossOrganisationsModal;
