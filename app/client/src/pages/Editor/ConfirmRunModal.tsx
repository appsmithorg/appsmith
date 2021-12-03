import React from "react";
import { connect } from "react-redux";
import { AppState } from "reducers";
import {
  showRunActionConfirmModal,
  cancelRunActionConfirmModal,
  acceptRunActionConfirmModal,
} from "actions/pluginActionActions";
import DialogComponent from "components/ads/DialogComponent";
import styled from "styled-components";
import Button, { Category, Size } from "components/ads/Button";
import {
  createMessage,
  QUERY_CONFIRMATION_MODAL_MESSAGE,
} from "constants/messages";

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

class ConfirmRunModal extends React.Component<Props> {
  render() {
    const { dispatch, isModalOpen } = this.props;
    const handleClose = () => {
      dispatch(showRunActionConfirmModal(false));

      dispatch(cancelRunActionConfirmModal());
    };

    return (
      <DialogComponent
        isOpen={isModalOpen}
        maxHeight={"80vh"}
        onClose={handleClose}
        title="Confirm Action"
        width={"580px"}
      >
        <ModalBody>{createMessage(QUERY_CONFIRMATION_MODAL_MESSAGE)}</ModalBody>
        <ModalFooter>
          <Button
            category={Category.tertiary}
            onClick={() => {
              dispatch(cancelRunActionConfirmModal());
              handleClose();
            }}
            size={Size.medium}
            tag="button"
            text="Cancel"
            type="button"
          />
          <Button
            category={Category.primary}
            onClick={() => {
              dispatch(acceptRunActionConfirmModal());
              handleClose();
            }}
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

export default connect(mapStateToProps)(ConfirmRunModal);
