import React, { useState } from "react";
import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ModalContent,
  Button,
} from "@design-system/widgets";
import type { ModalProps } from "../src/types";

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
        <ModalContent>
          <ModalHeader title="Modal title" />
          <ModalBody>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias amet
            animi corporis laboriosam libero voluptas! A, reiciendis, veniam?
          </ModalBody>
          <ModalFooter onSubmit={fakeSubmit} />
        </ModalContent>
      </Modal>
    </>
  );
};
