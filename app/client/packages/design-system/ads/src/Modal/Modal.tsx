import React from "react";
import type { DialogTriggerProps } from "@radix-ui/react-dialog";
import { Portal, Root, Trigger } from "@radix-ui/react-dialog";
import clsx from "classnames";

import type { ModalHeaderProps, ModalContentProps } from "./Modal.types";
import {
  StyledOverlay,
  StyledContent,
  StyledHeader,
  StyledClose,
  StyledBody,
  StyledFooter,
} from "./Modal.styles";
import {
  ModalContentClassName,
  ModalContentHeaderClassName,
  ModalContentHeaderCloseButtonClassName,
} from "./Modal.constants";
import { Text } from "../Text";
import { Button } from "../Button";

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
