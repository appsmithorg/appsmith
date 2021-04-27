import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Dialog from "components/ads/DialogComponent";
import Button, { Size } from "components/ads/Button";
import RadioComponent from "components/ads/Radio";
import { Classes } from "@blueprintjs/core";
import { getTypographyByKey } from "constants/DefaultTheme";
import {
  StyledDialog,
  StyledRadioComponent,
  ForkButton,
  OrganizationList,
  ButtonWrapper,
} from "./ForkModalStyles";

// const TriggerButton = styled(Button)`
//   ${(props) => getTypographyByKey(props, "btnLarge")}
//   height: 100%;
//   svg {
//     transform: rotate(-90deg);
//   }
// `;

// const StyledDialog = styled(Dialog)`
//   && .${Classes.DIALOG_BODY} {
//     padding-top: 0px;
//   }
// `;

// const StyledRadioComponent = styled(RadioComponent)`
//   label {
//     font-size: 16px;
//     margin-bottom: 32px;
//   }
// `;

// const ForkButton = styled(Button)`
//   height: 38px;
//   width: 203px;
// `;

// const OrganizationList = styled.div`
//   overflow: auto;
//   max-height: 250px;
//   margin-bottom: 10px;
//   margin-top: 20px;
// `;

// const ButtonWrapper = styled.div`
//   display: flex;
//   justify-content: flex-end;
// `;

// const SpinnerWrapper = styled.div`
//   display: flex;
//   justify-content: center;
// `;

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
