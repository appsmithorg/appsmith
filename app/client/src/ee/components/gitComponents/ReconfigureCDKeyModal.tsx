import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
} from "design-system";
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { showReconfigureCdKeyModalSelector } from "@appsmith/selectors/gitExtendedSelectors";
import {
  setLoadCdKeyOnMountAction,
  setShowReconfigureCdKeyAction,
} from "@appsmith/actions/gitExtendedActions";
import { setGitSettingsModalOpenAction } from "actions/gitSyncActions";
import { GitSettingsTab } from "reducers/uiReducers/gitSyncReducer";
import {
  GIT_CD_RECONFIGURE_KEY_MODAL_CTA,
  GIT_CD_RECONFIGURE_KEY_MODAL_DESC,
  GIT_CD_RECONFIGURE_KEY_MODAL_TITLE,
  createMessage,
} from "@appsmith/constants/messages";

function ReconfigureCDKeyModal() {
  const showModal = useSelector(showReconfigureCdKeyModalSelector);

  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(setShowReconfigureCdKeyAction(false));
    dispatch(setGitSettingsModalOpenAction({ open: true }));
  };

  const handleDisableAutocommit = () => {
    dispatch(setShowReconfigureCdKeyAction(false));
    dispatch(setLoadCdKeyOnMountAction(true));
    dispatch(
      setGitSettingsModalOpenAction({ open: true, tab: GitSettingsTab.CD }),
    );
  };

  return (
    <Modal
      onOpenChange={(open: boolean) => {
        if (!open) handleClose();
      }}
      open={showModal}
    >
      <ModalContent
        data-testid="t--reconfigure-cd-key-modal"
        style={{ width: "640px" }}
      >
        <ModalHeader style={{ margin: 0 }}>
          {createMessage(GIT_CD_RECONFIGURE_KEY_MODAL_TITLE)}
        </ModalHeader>
        <ModalBody>
          <Text renderAs="p">
            {createMessage(GIT_CD_RECONFIGURE_KEY_MODAL_DESC)}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button
            className="t--reconfigure-cd-key-cta-button"
            kind="primary"
            onClick={handleDisableAutocommit}
            size="md"
          >
            {createMessage(GIT_CD_RECONFIGURE_KEY_MODAL_CTA)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ReconfigureCDKeyModal;
