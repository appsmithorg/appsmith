import React from "react";
import { connect } from "react-redux";
import { AppState } from "@appsmith/reducers";
import { Keys } from "@blueprintjs/core";
import {
  showActionConfirmationModal,
  cancelActionConfirmationModal,
  acceptActionConfirmationModal,
} from "actions/pluginActionActions";
import { DialogComponent } from "design-system";
import styled from "styled-components";
import { Button, Category, Size } from "design-system";
import {
  createMessage,
  QUERY_CONFIRMATION_MODAL_MESSAGE,
} from "@appsmith/constants/messages";
import { ModalInfo } from "reducers/uiReducers/modalActionReducer";

type Props = {
  modals: ModalInfo[];
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
    // Sometimes calling the shortcut keys "Cmd + Enter" also triggers the onConfirm function below
    // so We check if no multiple keys are being pressed currently before executing this block of code.
    if (!(event.metaKey || event.ctrlKey) && event.keyCode === Keys.ENTER) {
      // please note: due to the way the state is being updated, the last action will always correspond to the right Action Modal.
      // this is not a bug.
      this.onConfirm(this.props.modals[this.props.modals.length - 1]);
    }
  };

  onConfirm = (modalInfo: ModalInfo) => {
    const { dispatch } = this.props;
    dispatch(acceptActionConfirmationModal(modalInfo.name));
    this.handleClose(modalInfo);
  };

  handleClose = (modalInfo: ModalInfo) => {
    const { dispatch } = this.props;
    dispatch(showActionConfirmationModal({ ...modalInfo, modalOpen: false }));
    dispatch(cancelActionConfirmationModal(modalInfo.name));
  };

  componentDidUpdate() {
    const { modals } = this.props;
    if (!!modals) {
      this.addEventListener();
    } else {
      this.removeEventListener();
    }
  }

  render() {
    const { dispatch, modals } = this.props;

    // making sure that only modals that are set to be open are eventually opened.
    // basically filters out modals that have already been opened and prevents it from flashing after other modals have been confirmed.
    const modalsToBeOpened = modals.filter((modal) => modal.modalOpen === true);

    return (
      <>
        {modalsToBeOpened.map((modalInfo: ModalInfo, index: number) => (
          <DialogComponent
            canEscapeKeyClose
            canOutsideClickClose
            isOpen={modalInfo?.modalOpen}
            key={index}
            maxHeight={"80vh"}
            noModalBodyMarginTop
            onClose={() => this.handleClose(modalInfo)}
            title="Confirmation Dialog"
            width={"580px"}
          >
            <ModalBody>
              {createMessage(QUERY_CONFIRMATION_MODAL_MESSAGE)}{" "}
              <b>{modalInfo.name}</b> ?
            </ModalBody>
            <ModalFooter>
              <Button
                category={Category.secondary}
                cypressSelector="t--cancel-modal-btn"
                onClick={() => {
                  dispatch(cancelActionConfirmationModal(modalInfo.name));
                  this.handleClose(modalInfo);
                }}
                size={Size.large}
                tag="button"
                text="No"
                type="button"
              />
              <Button
                category={Category.primary}
                cypressSelector="t--confirm-modal-btn"
                onClick={() => this.onConfirm(modalInfo)}
                size={Size.large}
                tag="button"
                text="Yes"
                type="button"
              />
            </ModalFooter>
          </DialogComponent>
        ))}
      </>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  modals: state.ui.modalAction.modals,
});

export default connect(mapStateToProps)(RequestConfirmationModal);
