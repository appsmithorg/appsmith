import React, { useState } from "react";
import { Modal, ModalBody, Button } from "@design-system/widgets";

export const ControlledModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Modal isOpen={isOpen} setOpen={setIsOpen}>
      <Button>My modal trigger</Button>
      <ModalBody>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloribus,
        vero!
      </ModalBody>
    </Modal>
  );
};
