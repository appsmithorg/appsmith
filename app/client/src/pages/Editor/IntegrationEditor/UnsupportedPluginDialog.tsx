import React from "react";
import { Text, TextType } from "@appsmith/ads-old";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
} from "@appsmith/ads";
import { UNSUPPORTED_PLUGIN_DIALOG_MAIN_HEADING } from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import {
  UNSUPPORTED_PLUGIN_DIALOG_TITLE,
  UNSUPPORTED_PLUGIN_DIALOG_SUBTITLE,
} from "ee/constants/messages";

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

// Unsupported Plugin for gen CRUD page
function UnsupportedPluginDialog(props: Props) {
  const { isModalOpen, onContinue } = props;
  const handleClose = () => {
    props.onClose();
  };

  return (
    <Modal onOpenChange={handleClose} open={isModalOpen}>
      <ModalContent style={{ width: "600px" }}>
        <ModalHeader>{UNSUPPORTED_PLUGIN_DIALOG_MAIN_HEADING()}</ModalHeader>
        <ModalBody>
          <Text type={TextType.H5}>{UNSUPPORTED_PLUGIN_DIALOG_TITLE()}</Text>
          <br />
          <Text type={TextType.P1}>{UNSUPPORTED_PLUGIN_DIALOG_SUBTITLE()}</Text>
        </ModalBody>
        <ModalFooter>
          <Button
            data-testid="t--product-updates-close-btn"
            kind="secondary"
            onClick={() => {
              AnalyticsUtil.logEvent("UNSUPPORTED_PLUGIN_DIALOG_BACK_ACTION");
              handleClose();
            }}
            size="md"
          >
            Back
          </Button>
          <Button
            onClick={() => {
              handleClose();
              AnalyticsUtil.logEvent(
                "UNSUPPORTED_PLUGIN_DIALOG_CONTINUE_ACTION",
              );
              onContinue();
            }}
            size="md"
          >
            Continue
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default UnsupportedPluginDialog;
