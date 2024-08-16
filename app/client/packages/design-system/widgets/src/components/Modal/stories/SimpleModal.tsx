import React, { useState } from "react";
import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ModalContent,
  Button,
} from "@appsmith/wds";
import type { ModalProps } from "../src/types";
// Since the Modal is rendered at the root of the Provider, we need to add Unstyled as a wrapper
// so that Storybook does not break styles.
import { Unstyled } from "@storybook/blocks";

const fakeSubmit = async () => {
  return new Promise<void>((resolve) =>
    setTimeout(() => {
      alert("Submitted");
      resolve();
    }, 500),
  );
};

export const SimpleModal = (props: Omit<ModalProps, "children">) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onPress={() => setIsOpen(!isOpen)}>Modal trigger</Button>
      <Modal initialFocus={2} isOpen={isOpen} setOpen={setIsOpen} {...props}>
        <Unstyled>
          <ModalContent>
            <ModalHeader title="Modal title" />
            <ModalBody>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias
              amet animi corporis laboriosam libero voluptas! A, reiciendis,
              veniam?
            </ModalBody>
            <ModalFooter onSubmit={fakeSubmit} />
          </ModalContent>
        </Unstyled>
      </Modal>
    </>
  );
};
