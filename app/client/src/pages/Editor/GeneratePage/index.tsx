import React, { useCallback } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Text,
} from "@appsmith/ads";
import {
  createMessage,
  GENERATE_PAGE_FORM_TITLE,
  GENERATE_PAGE_FORM_SUB_TITLE,
} from "ee/constants/messages";
import GeneratePageForm from "./components/GeneratePageForm/GeneratePageForm";
import { useSelector, useDispatch } from "react-redux";
import { getIsGeneratePageModalOpen } from "selectors/pageListSelectors";
import { closeGeneratePageModal, openGeneratePageModal } from "./helpers";

function GeneratePageModal() {
  const dispatch = useDispatch();
  const isOpen = useSelector(getIsGeneratePageModalOpen);

  const handleModalOpenChange = useCallback(
    (modalState: boolean) => {
      if (modalState) {
        dispatch(openGeneratePageModal());
      } else {
        dispatch(closeGeneratePageModal());
      }
    },
    [dispatch],
  );

  return (
    <Modal onOpenChange={handleModalOpenChange} open={isOpen}>
      <ModalContent style={{ width: "444px" }}>
        <ModalHeader>{createMessage(GENERATE_PAGE_FORM_TITLE)}</ModalHeader>
        <ModalBody>
          <Text renderAs="p">
            {createMessage(GENERATE_PAGE_FORM_SUB_TITLE)}
          </Text>
          <GeneratePageForm />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default GeneratePageModal;
