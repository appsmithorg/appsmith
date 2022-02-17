import React from "react";
import styled from "styled-components";
import Button, { Size, Category } from "components/ads/Button";
import Text, { TextType } from "components/ads/Text";
import { Variant } from "components/ads/common";
import {
  DELETE_CONFIRMATION_MODAL_TITLE,
  DELETE_CONFIRMATION_MODAL_SUBTITLE,
} from "@appsmith/constants/messages";
import Dialog from "components/ads/DialogComponent";
import { Classes } from "@blueprintjs/core";
import { Colors } from "constants/Colors";

const StyledDialog = styled(Dialog)`
  && .${Classes.DIALOG_BODY} {
    padding-top: 0px;
  }
`;

const LeftContainer = styled.div`
  text-align: left;
`;

const ImportButton = styled(Button)<{ disabled?: boolean }>`
  height: 30px;
  width: 81px;
  pointer-events: ${(props) => (!!props.disabled ? "none" : "auto")};
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: end;
  margin-top: 20px;

  & > a {
    margin: 0 4px;
  }
`;

type DeleteConfirmationProps = {
  username?: string | null;
  name?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeletingUser: boolean;
};

function DeleteConfirmationModal(props: DeleteConfirmationProps) {
  const { isDeletingUser, isOpen, name, onClose, onConfirm, username } = props;

  return (
    <StyledDialog
      canOutsideClickClose
      className={"t--member-delete-confirmation-modal"}
      headerIcon={{
        name: "delete",
        fillColor: Colors.DANGER_SOLID,
        hoverColor: Colors.DANGER_SOLID_HOVER,
      }}
      isOpen={isOpen}
      maxHeight={"540px"}
      setModalClose={onClose}
      title={DELETE_CONFIRMATION_MODAL_TITLE()}
    >
      <LeftContainer>
        <Text textAlign="center" type={TextType.P1}>
          {DELETE_CONFIRMATION_MODAL_SUBTITLE(name || username)}
        </Text>
        <ButtonWrapper>
          <ImportButton
            category={Category.tertiary}
            className=".button-item"
            onClick={onClose}
            size={Size.large}
            text={"CANCEL"}
            variant={Variant.danger}
          />
          <ImportButton
            className=".button-item"
            cypressSelector={"t--org-leave-button"}
            isLoading={isDeletingUser}
            onClick={onConfirm}
            size={Size.large}
            text={"REMOVE"}
            variant={Variant.danger}
          />
        </ButtonWrapper>
      </LeftContainer>
    </StyledDialog>
  );
}

export default DeleteConfirmationModal;
