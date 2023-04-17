import React from "react";
import styled from "styled-components";
import { DialogComponent as Dialog, Text, TextType } from "design-system-old";
import { Button } from "design-system";
import {
  DELETE_CONFIRMATION_MODAL_TITLE,
  DELETE_CONFIRMATION_MODAL_SUBTITLE,
} from "@appsmith/constants/messages";
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

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: end;
  margin-top: 20px;

  & > a {
    margin: 0 4px;
  }
`;

type DeleteConfirmationProps = {
  userToBeDeleted: {
    name: string;
    username: string;
    workspaceId: string;
    userGroupId?: string;
    entityId?: string;
    entityType?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeletingUser: boolean;
};

function DeleteConfirmationModal(props: DeleteConfirmationProps) {
  const { isDeletingUser, isOpen, onClose, onConfirm, userToBeDeleted } = props;
  const { entityType, name, username } = userToBeDeleted;

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
          {DELETE_CONFIRMATION_MODAL_SUBTITLE(name || username, entityType)}
        </Text>
        <ButtonWrapper>
          <Button
            className=".button-item"
            kind="error"
            onClick={onClose}
            size="md"
          >
            Cancel
          </Button>
          <Button
            className=".button-item"
            isLoading={isDeletingUser}
            kind="error"
            onClick={onConfirm}
            size="md"
          >
            Remove
          </Button>
        </ButtonWrapper>
      </LeftContainer>
    </StyledDialog>
  );
}

export default DeleteConfirmationModal;
