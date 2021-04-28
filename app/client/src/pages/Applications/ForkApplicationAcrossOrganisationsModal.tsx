import React, { useEffect } from "react";
import { Size } from "components/ads/Button";
import {
  StyledDialog,
  StyledRadioComponent,
  ForkButton,
  OrganizationList,
  ButtonWrapper,
} from "./ForkModalStyles";

const ForkApplicationAcrossOrganisationsModal = (props: any) => {
  const {
    organizationList,
    selectOrganizationId,
    forkingApplication,
    organizationId,
    forkApplication,
  } = props;
  let showForkModal = props.isModalOpen;
  useEffect(() => {
    showForkModal = props.isModalOpen;
  }, [props.isModalOpen]);

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
