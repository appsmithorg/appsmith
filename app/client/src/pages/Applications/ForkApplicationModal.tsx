import React, { useEffect, useMemo, useState } from "react";
import Dialog from "components/ads/DialogComponent";
import Button, { Size } from "components/ads/Button";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import Divider from "components/editorComponents/Divider";
import { createMessage, FORK_APP } from "constants/messages";
import { useDispatch } from "react-redux";
import { getAllApplications } from "actions/applicationActions";
import { useSelector } from "store";
import {
  getIsFetchingApplications,
  getUserApplicationsOrgs,
} from "selectors/applicationSelectors";
import { isPermitted, PERMISSION_TYPE } from "./permissionHelpers";
import RadioComponent from "components/ads/Radio";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { Classes } from "@blueprintjs/core";
import { useLocation } from "react-router";
import { getApplicationViewerPageURL } from "constants/routes";
import { getCurrentPageId } from "selectors/editorSelectors";
import { AppState } from "reducers";
import Spinner from "components/ads/Spinner";
import { IconSize } from "components/ads/Icon";

const TriggerButton = styled(Button)`
  ${(props) => getTypographyByKey(props, "btnLarge")}
  height: 100%;
  svg {
    transform: rotate(-90deg);
  }
  margin-right: ${(props) => props.theme.spaces[7]}px;
`;

const StyledDialog = styled(Dialog)`
  && .${Classes.DIALOG_BODY} {
    padding-top: 0px;
  }
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

const OrganizationList = styled.div`
  overflow: auto;
  max-height: 250px;
  margin-bottom: 10px;
  margin-top: 20px;
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const SpinnerWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const ForkApplicationModal = (props: any) => {
  const [organizationId, selectOrganizationId] = useState("");
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getAllApplications());
  }, [dispatch, getAllApplications]);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const userOrgs = useSelector(getUserApplicationsOrgs);
  const currentPageId = useSelector(getCurrentPageId);
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
  const showForkModal =
    pathname ===
    `${getApplicationViewerPageURL(props.applicationId, currentPageId)}/fork`;

  return (
    <StyledDialog
      title={"Select the organisation to fork"}
      maxHeight={"540px"}
      className={"fork-modal"}
      canOutsideClickClose={true}
      isOpen={showForkModal}
      trigger={
        <TriggerButton
          text={createMessage(FORK_APP)}
          icon="fork"
          size={Size.small}
          className="t--fork-app"
          onClick={() => dispatch(getAllApplications())}
        />
      }
    >
      <Divider />
      {isFetchingApplications && (
        <SpinnerWrapper>
          <Spinner size={IconSize.XXXL} />
        </SpinnerWrapper>
      )}
      {!isFetchingApplications && organizationList.length && (
        <OrganizationList>
          <StyledRadioComponent
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
          onClick={forkApplication}
          size={Size.large}
        />
      </ButtonWrapper>
    </StyledDialog>
  );
};

export default ForkApplicationModal;
