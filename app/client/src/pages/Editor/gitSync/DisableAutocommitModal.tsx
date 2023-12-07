import {
  setIsAutocommitEnabled,
  setIsAutocommitModalOpen,
} from "actions/gitSyncActions";
import {
  AUTOCOMMIT_CONFIRM_DISABLE_MESSAGE,
  AUTOCOMMIT_DISABLE,
  createMessage,
} from "@appsmith/constants/messages";
import {
  Button,
  Callout,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
} from "design-system";
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { getIsAutocommitModalOpen } from "selectors/gitSyncSelectors";

function DisableAutocommitModal() {
  const isAutocommitModal = useSelector(getIsAutocommitModalOpen);

  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(setIsAutocommitModalOpen(false));
  };

  const handleDisableAutocommit = () => {
    dispatch(setIsAutocommitEnabled(false));
    dispatch(setIsAutocommitModalOpen(false));
  };

  return (
    <Modal
      onOpenChange={(open: boolean) => {
        if (!open) handleClose();
      }}
      open={isAutocommitModal}
    >
      <ModalContent
        data-testid="t--autocommit-git-modal"
        style={{ width: "640px" }}
      >
        <ModalHeader style={{ margin: 0 }}>
          {createMessage(AUTOCOMMIT_DISABLE)}
        </ModalHeader>
        <ModalBody>
          <Callout kind="warning">
            <Text>{createMessage(AUTOCOMMIT_CONFIRM_DISABLE_MESSAGE)}</Text>
          </Callout>
        </ModalBody>
        <ModalFooter>
          <Button
            className="t--autocommit-modal-cta-button"
            kind="primary"
            onClick={handleDisableAutocommit}
            size="md"
          >
            {createMessage(AUTOCOMMIT_DISABLE)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default DisableAutocommitModal;
