import React, { useRef, useState } from "react";
import { Modal, ModalBody, ModalContent, Button } from "@appsmith/wds";
// Since the Modal is rendered at the root of the Provider, we need to add Unstyled as a wrapper
// so that Storybook does not break styles.
import { Unstyled } from "@storybook/blocks";

export const CustomModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  return (
    <>
      <Button onPress={() => setIsOpen(!isOpen)} ref={ref}>
        Modal trigger
      </Button>
      <Modal isOpen={isOpen} setOpen={setIsOpen} triggerRef={ref}>
        <Unstyled>
          <div style={{ border: "4px solid rgb(255, 155, 78)" }}>
            <ModalContent>
              <ModalBody>
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias
                amet animi corporis laboriosam libero voluptas! A, reiciendis,
                veniam?
              </ModalBody>
            </ModalContent>
          </div>
        </Unstyled>
      </Modal>
    </>
  );
};
