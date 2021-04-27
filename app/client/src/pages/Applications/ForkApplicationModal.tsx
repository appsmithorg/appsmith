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

const ForkApplicationModal = (props: any) => {
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
      title={"Choose where to fork the app"}
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
