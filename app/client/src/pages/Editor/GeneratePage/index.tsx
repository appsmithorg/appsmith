import React, { useCallback } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Text,
} from "@appsmith/ads";
import { GENERATE_PAGE_FORM_TITLE, createMessage } from "ee/constants/messages";
import GeneratePageForm from "./components/GeneratePageForm/GeneratePageForm";
import { useSelector } from "react-redux";
import { getIsGeneratePageModalOpen } from "selectors/pageListSelectors";
import { useDispatch } from "react-redux";
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
      <ModalContent>
        <ModalHeader>{createMessage(GENERATE_PAGE_FORM_TITLE)}</ModalHeader>
        <ModalBody>
          <Text renderAs="p">
            Auto create a simple CRUD interface on top of your data
          </Text>
          <GeneratePageForm />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default GeneratePageModal;
