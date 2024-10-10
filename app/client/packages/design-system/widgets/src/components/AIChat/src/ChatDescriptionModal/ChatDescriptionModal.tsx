import { Modal, ModalBody, ModalContent, ModalHeader } from "@appsmith/wds";
import React from "react";
import type { ChatDescriptionModalProps } from "./types";

export const ChatDescriptionModal = ({
  children,
  ...rest
}: ChatDescriptionModalProps) => {
  return (
    <Modal {...rest}>
      <ModalContent>
        <ModalHeader title="Information about the bot" />
        <ModalBody>{children}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
