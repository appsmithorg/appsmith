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
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@appsmith/ads";
import {
  createMessage,
  QUERY_CONFIRMATION_MODAL_MESSAGE,
  DISABLE_PREPARED_STATEMENT_CONFIRMATION_HEADING,
  DISABLE_PREPARED_STATEMENT_CONFIRMATION_DESCRIPTION,
  DISABLE_SMART_SUBSTITUTION_CONFIRMATION_HEADING,
  DISABLE_SMART_SUBSTITUTION_CONFIRMATION_DESCRIPTION,
} from "ee/constants/messages";
import type { ModalInfo } from "reducers/uiReducers/modalActionReducer";
import { ModalType } from "reducers/uiReducers/modalActionReducer";
import { Text } from "@appsmith/ads";

type SecurityModalContent = {
  heading: () => string;
  description: () => string;
  docLink?: string;
};

const SECURITY_MODAL_CONTENT: Partial<
  Record<ModalType, SecurityModalContent>
> = {
  [ModalType.DISABLE_PREPARED_STATEMENT]: {
    heading: DISABLE_PREPARED_STATEMENT_CONFIRMATION_HEADING,
    description: DISABLE_PREPARED_STATEMENT_CONFIRMATION_DESCRIPTION,
    docLink: "https://docs.appsmith.com/connect-data/concepts/how-to-use-prepared-statements",
  },
  [ModalType.DISABLE_SMART_SUBSTITUTION]: {
    heading: DISABLE_SMART_SUBSTITUTION_CONFIRMATION_HEADING,
    description: DISABLE_SMART_SUBSTITUTION_CONFIRMATION_DESCRIPTION,
  },
};

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

    // Call custom onConfirm callback if provided
    if (modalInfo.onConfirm) {
      modalInfo.onConfirm();
    }

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
              <ModalHeader>
                {SECURITY_MODAL_CONTENT[modalInfo.modalType]
                  ? createMessage(
                      SECURITY_MODAL_CONTENT[modalInfo.modalType]!.heading,
                    )
                  : "Confirmation dialog"}
              </ModalHeader>
              <ModalBody>
                {SECURITY_MODAL_CONTENT[modalInfo.modalType] ? (
                  <div>
                    <Text kind="body-m">
                      {createMessage(
                        SECURITY_MODAL_CONTENT[modalInfo.modalType]!.description,
                      )}
                    </Text>
                    {SECURITY_MODAL_CONTENT[modalInfo.modalType]?.docLink && (
                      <Link
                        kind="secondary"
                        style={{ marginTop: "var(--ads-v2-spaces-3)" }}
                        target="_blank"
                        to={SECURITY_MODAL_CONTENT[modalInfo.modalType]!.docLink}
                      >
                        Learn more
                      </Link>
                    )}
                  </div>
                ) : (
                  <>
                    {createMessage(QUERY_CONFIRMATION_MODAL_MESSAGE)}{" "}
                    <b>{modalInfo.name}</b> ?
                  </>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  kind="secondary"
                  onClick={() => {
                    // Call custom onCancel callback if provided
                    if (modalInfo.onCancel) {
                      modalInfo.onCancel();
                    }
                    dispatch(cancelActionConfirmationModal(modalInfo.name));
                    this.handleClose(modalInfo);
                  }}
                  size="md"
                >
                  {SECURITY_MODAL_CONTENT[modalInfo.modalType]
                    ? "Cancel"
                    : "No"}
                </Button>
                <Button
                  data-testid={
                    modalInfo.modalType === ModalType.DISABLE_PREPARED_STATEMENT
                      ? "t--disable-prepared-statement-confirm-button"
                      : undefined
                  }
                  kind={
                    SECURITY_MODAL_CONTENT[modalInfo.modalType]
                      ? "error"
                      : "primary"
                  }
                  onClick={() => this.onConfirm(modalInfo)}
                  size="md"
                >
                  {SECURITY_MODAL_CONTENT[modalInfo.modalType]
                    ? "Disable anyway"
                    : "Yes"}
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
