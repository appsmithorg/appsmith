import React from "react";
import { connect } from "react-redux";
import type { DefaultRootState } from "react-redux";
import { Keys } from "@blueprintjs/core";
import {
  showActionConfirmationModal,
  cancelActionConfirmationModal,
  acceptActionConfirmationModal,
} from "actions/pluginActionActions";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@appsmith/ads";
import {
  createMessage,
  QUERY_CONFIRMATION_MODAL_MESSAGE,
} from "ee/constants/messages";
import type { ModalInfo } from "reducers/uiReducers/modalActionReducer";

interface Props {
  modals: ModalInfo[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any;
}

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
    const modalsToBeOpened = modals.filter((modal) => modal.modalOpen);

    return (
      <>
        {modalsToBeOpened.map((modalInfo: ModalInfo) => (
          <Modal
            key={modalInfo.name}
            onOpenChange={() => this.handleClose(modalInfo)}
            open={modalInfo?.modalOpen}
          >
            <ModalContent
              data-testid="t--query-run-confirmation-modal"
              style={{ width: "600px" }}
            >
              <ModalHeader>Confirmation dialog</ModalHeader>
              <ModalBody>
                {createMessage(QUERY_CONFIRMATION_MODAL_MESSAGE)}{" "}
                <b>{modalInfo.name}</b> ?
              </ModalBody>
              <ModalFooter>
                <Button
                  kind="secondary"
                  onClick={() => {
                    dispatch(cancelActionConfirmationModal(modalInfo.name));
                    this.handleClose(modalInfo);
                  }}
                  size="md"
                >
                  No
                </Button>
                <Button
                  kind="primary"
                  onClick={() => this.onConfirm(modalInfo)}
                  size="md"
                >
                  Yes
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        ))}
      </>
    );
  }
}

const mapStateToProps = (state: DefaultRootState) => ({
  modals: state.ui.modalAction.modals,
});

export default connect(mapStateToProps)(RequestConfirmationModal);
