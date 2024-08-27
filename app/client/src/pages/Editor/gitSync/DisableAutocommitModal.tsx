import {
  toggleAutocommitEnabledInit,
  setIsAutocommitModalOpen,
} from "actions/gitSyncActions";
import {
  AUTOCOMMIT_CONFIRM_DISABLE_MESSAGE,
  AUTOCOMMIT_DISABLE,
  createMessage,
} from "ee/constants/messages";
import {
  Button,
  Callout,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
} from "@appsmith/ads";
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getIsAutocommitModalOpen,
  getIsAutocommitToggling,
} from "selectors/gitSyncSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

function DisableAutocommitModal() {
  const isAutocommitModalOpen = useSelector(getIsAutocommitModalOpen);
  const isAutocommitToggling = useSelector(getIsAutocommitToggling);

  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(setIsAutocommitModalOpen(false));
  };

  const handleDisableAutocommit = () => {
    dispatch(toggleAutocommitEnabledInit());
    AnalyticsUtil.logEvent("GS_AUTO_COMMIT_DISABLED");
    dispatch(setIsAutocommitModalOpen(false));
  };

  return (
    <Modal
      onOpenChange={(open: boolean) => {
        if (!open) handleClose();
      }}
      open={isAutocommitModalOpen}
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
            isLoading={isAutocommitToggling}
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
