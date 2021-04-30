import React, { useEffect } from "react";
import { Size } from "components/ads/Button";
import Divider from "components/editorComponents/Divider";
import { createMessage, FORK_APP } from "constants/messages";
import { useDispatch } from "react-redux";
import { getAllApplications } from "actions/applicationActions";
import { useSelector } from "store";
import { getIsFetchingApplications } from "selectors/applicationSelectors";
import { useLocation } from "react-router";
import { getApplicationViewerPageURL } from "constants/routes";
import { getCurrentPageId } from "selectors/editorSelectors";
import Spinner from "components/ads/Spinner";
import { IconSize } from "components/ads/Icon";
import {
  TriggerButton,
  StyledDialog,
  StyledRadioComponent,
  ForkButton,
  OrganizationList,
  ButtonWrapper,
  SpinnerWrapper,
} from "./ForkModalStyles";

function ForkApplicationModal(props: any) {
  const {
    organizationList,
    selectOrganizationId,
    forkingApplication,
    organizationId,
    forkApplication,
  } = props;
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getAllApplications());
  }, [dispatch, getAllApplications]);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const currentPageId = useSelector(getCurrentPageId);
  const { pathname } = useLocation();
  const showForkModal =
    pathname ===
    `${getApplicationViewerPageURL(props.applicationId, currentPageId)}/fork`;

  return (
    <StyledDialog
      canOutsideClickClose
      className={"fork-modal"}
      isOpen={showForkModal}
      maxHeight={"540px"}
      title={"Choose where to fork the app"}
      trigger={
        <TriggerButton
          className="t--fork-app"
          icon="fork"
          onClick={() => dispatch(getAllApplications())}
          size={Size.small}
          text={createMessage(FORK_APP)}
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
