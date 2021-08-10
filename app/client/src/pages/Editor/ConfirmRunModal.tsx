import React from "react";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { Dialog, Classes } from "@blueprintjs/core";
import Button from "components/editorComponents/Button";
import {
  showRunActionConfirmModal,
  cancelRunActionConfirmModal,
  acceptRunActionConfirmModal,
} from "actions/pluginActionActions";

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
      <Dialog isOpen={isModalOpen} onClose={handleClose} title="Confirm Action">
        <div className={Classes.DIALOG_BODY}>
          Are you sure you want to perform this action?
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              filled
              onClick={() => {
                dispatch(cancelRunActionConfirmModal());

                handleClose();
              }}
              text="Cancel"
            />
            <Button
              filled
              intent="primary"
              onClick={() => {
                dispatch(acceptRunActionConfirmModal());

                handleClose();
              }}
              text="Confirm"
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
