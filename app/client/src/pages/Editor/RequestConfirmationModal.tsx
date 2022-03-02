import React from "react";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { Keys } from "@blueprintjs/core";
import {
  showActionConfirmationModal,
  cancelActionConfirmationModal,
  acceptActionConfirmationModal,
} from "actions/pluginActionActions";
import DialogComponent from "components/ads/DialogComponent";
import styled from "styled-components";
import Button, { Category, Size } from "components/ads/Button";
import {
  createMessage,
  QUERY_CONFIRMATION_MODAL_MESSAGE,
} from "@appsmith/constants/messages";

type Props = {
  isModalOpen: boolean;
  dispatch: any;
};

const ModalBody = styled.div`
  padding-bottom: 20px;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;

  button {
    margin-left: 12px;
  }
`;

class RequestConfirmationModal extends React.Component<Props> {
  addEventListener = () => {
    document.addEventListener("keydown", this.onKeyUp);
  };

  removeEventListener = () => {
    document.removeEventListener("keydown", this.onKeyUp);
  };

  onKeyUp = (event: KeyboardEvent) => {
    if (event.keyCode === Keys.ENTER) {
      this.onConfirm();
    }
  };

  onConfirm = () => {
    const { dispatch } = this.props;
    dispatch(acceptActionConfirmationModal());
    this.handleClose();
  };

  handleClose = () => {
    const { dispatch } = this.props;
    dispatch(showActionConfirmationModal(false));
    dispatch(cancelActionConfirmationModal());
  };

  componentDidUpdate() {
    const { isModalOpen } = this.props;
    if (isModalOpen) {
      this.addEventListener();
    } else {
      this.removeEventListener();
    }
  }

  render() {
    const { dispatch, isModalOpen } = this.props;

    return (
      <DialogComponent
        canEscapeKeyClose
        isOpen={isModalOpen}
        maxHeight={"80vh"}
        onClose={this.handleClose}
        title="Confirm Action"
        width={"580px"}
      >
        <ModalBody>{createMessage(QUERY_CONFIRMATION_MODAL_MESSAGE)}</ModalBody>
        <ModalFooter>
          <Button
            category={Category.tertiary}
            cypressSelector="t--cancel-modal-btn"
            onClick={() => {
              dispatch(cancelActionConfirmationModal());
              this.handleClose();
            }}
            size={Size.medium}
            tag="button"
            text="Cancel"
            type="button"
          />
          <Button
            category={Category.primary}
            cypressSelector="t--confirm-modal-btn"
            onClick={this.onConfirm}
            size={Size.medium}
            tag="button"
            text="Confirm"
            type="button"
          />
        </ModalFooter>
      </DialogComponent>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  isModalOpen: state.ui.confirmRunAction.modalOpen,
});

export default connect(mapStateToProps)(RequestConfirmationModal);
