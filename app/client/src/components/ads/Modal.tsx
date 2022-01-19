import {
  Modal as CModal,
  ModalProps,
  ModalOverlay as CModalOverlay,
  ModalOverlayProps,
  ModalContent as CModalContent,
  ModalContentProps,
  ModalHeader as CModalHeader,
  ModalFooter as CModalFooter,
  ModalBody as CModalBody,
  ModalBodyProps,
  ModalHeaderProps,
  ModalFooterProps,
  ModalCloseButton as CModalCloseButton,
  CloseButtonProps,
} from "@chakra-ui/react";
import React from "react";

function Modal(props: ModalProps) {
  return <CModal {...props} />;
}

function ModalOverlay(props: ModalOverlayProps) {
  return <CModalOverlay {...props} />;
}

function ModalContent(props: ModalContentProps) {
  return <CModalContent rounded={0} {...props} />;
}

function ModalHeader(props: ModalHeaderProps) {
  return <CModalHeader fontSize="inherit" p={0} {...props} />;
}

function ModalBody(props: ModalBodyProps) {
  return <CModalBody p={0} {...props} />;
}

function ModalFooter(props: ModalFooterProps) {
  return <CModalFooter p={0} {...props} />;
}

function ModalCloseButton(props: CloseButtonProps) {
  return <CModalCloseButton p={0} rounded={0} top={0} {...props} />;
}

export {
  Modal,
  ModalOverlay,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalCloseButton,
};
