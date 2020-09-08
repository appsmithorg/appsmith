import React from "react";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { Dialog, Classes } from "@blueprintjs/core";
import Button from "components/editorComponents/Button";
import {
  showRunActionConfirmModal,
  cancelRunActionConfirmModal,
  acceptRunActionConfirmModal,
} from "actions/actionActions";

type Props = {
  isModalOpen: boolean;
  dispatch: any;
};

class ConfirmRunModal extends React.Component<Props> {
  render() {
    const { dispatch, isModalOpen } = this.props;
    const handleClose = () => {
      dispatch(showRunActionConfirmModal(false));

      dispatch(cancelRunActionConfirmModal());
    };

    return (
      <Dialog title="Confirm run" isOpen={isModalOpen} onClose={handleClose}>
        <div className={Classes.DIALOG_BODY}>
          Are you sure you want to refresh your current data
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              filled
              text="Cancel"
              onClick={() => {
                dispatch(cancelRunActionConfirmModal());

                handleClose();
              }}
            />
            <Button
              filled
              text="Confirm and run"
              intent="primary"
              onClick={() => {
                dispatch(acceptRunActionConfirmModal());

                handleClose();
              }}
            />
          </div>
        </div>
      </Dialog>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  isModalOpen: state.ui.confirmRunAction.modalOpen,
});

export default connect(mapStateToProps)(ConfirmRunModal);
