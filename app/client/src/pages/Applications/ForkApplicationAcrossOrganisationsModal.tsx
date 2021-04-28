import React, { useEffect } from "react";
import { Size } from "components/ads/Button";
import {
  StyledDialog,
  StyledRadioComponent,
  ForkButton,
  OrganizationList,
  ButtonWrapper,
} from "./ForkModalStyles";

function ForkApplicationAcrossOrganisationsModal(props: any) {
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
      canOutsideClickClose
      className={"fork-modal"}
      isOpen={showForkModal}
      maxHeight={"540px"}
      setModalClose={props.setModalClose}
      title={"Choose where to fork the app"}
    >
      {organizationList.length && (
        <OrganizationList>
          <StyledRadioComponent
            className={"radio-group"}
            columns={1}
            data-cy="t--org-list-fork-app"
            defaultValue={organizationList[0].value}
            onSelect={(value) => selectOrganizationId(value)}
            options={organizationList}
          />
        </OrganizationList>
      )}
      <ButtonWrapper>
        <ForkButton
          data-cy="t--fork-app-to-org-button"
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

export default ForkApplicationAcrossOrganisationsModal;
