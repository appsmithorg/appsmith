import React, { useRef, useState } from "react";
import { Modal, ModalBody, ModalContent, Button } from "@design-system/widgets";

export const CustomModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  return (
    <>
      <Button onPress={() => setIsOpen(!isOpen)} ref={ref}>
        Modal trigger
      </Button>
      <Modal isOpen={isOpen} setOpen={setIsOpen} triggerRef={ref}>
        <div style={{ border: "4px solid rgb(255, 155, 78)" }}>
          <ModalContent>
            <ModalBody>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias
              amet animi corporis laboriosam libero voluptas! A, reiciendis,
              veniam?
            </ModalBody>
          </ModalContent>
        </div>
      </Modal>
    </>
  );
};
