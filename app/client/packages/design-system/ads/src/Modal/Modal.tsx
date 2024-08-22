import React from "react";

import type { DialogTriggerProps } from "@radix-ui/react-dialog";
import { Portal, Root, Trigger } from "@radix-ui/react-dialog";
import clsx from "classnames";

import { Button } from "../Button";
import { Text } from "../Text";
import {
  ModalContentClassName,
  ModalContentHeaderClassName,
  ModalContentHeaderCloseButtonClassName,
} from "./Modal.constants";
import {
  StyledBody,
  StyledClose,
  StyledContent,
  StyledFooter,
  StyledHeader,
  StyledOverlay,
} from "./Modal.styles";
import type { ModalContentProps, ModalHeaderProps } from "./Modal.types";

function ModalContent(props: ModalContentProps) {
  const { children, className, overlayClassName, ...rest } = props;
  return (
    <Portal>
      <StyledOverlay className={overlayClassName} />
      <StyledContent
        className={clsx(ModalContentClassName, className)}
        {...rest}
      >
        {children}
      </StyledContent>
    </Portal>
  );
}

function ModalHeader({
  children,
  isCloseButtonVisible = true,
}: ModalHeaderProps) {
  return (
    <StyledHeader className={ModalContentHeaderClassName}>
      <Text kind="heading-m" renderAs="h3">
        {children}
      </Text>
      {isCloseButtonVisible && (
        <StyledClose
          aria-label="Close"
          asChild
          className={ModalContentHeaderCloseButtonClassName}
        >
          <Button
            UNSAFE_height="36px !important"
            UNSAFE_width="36px !important"
            isIconButton
            kind="tertiary"
            size="md"
            startIcon="close-line"
          />
        </StyledClose>
      )}
    </StyledHeader>
  );
}

function ModalTrigger(props: DialogTriggerProps) {
  return (
    <Trigger {...props} asChild>
      {props.children}
    </Trigger>
  );
}

const Modal = Root;
const ModalBody = StyledBody;
const ModalFooter = StyledFooter;
Modal.displayName = "Modal";
ModalContent.displayName = "ModalContent";
ModalHeader.displayName = "ModalHeader";

export {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTrigger,
};
