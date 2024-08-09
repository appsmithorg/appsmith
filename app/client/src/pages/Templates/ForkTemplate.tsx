import type { ReactNode } from "react";
import React, { useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
} from "@appsmith/ads";
import { useDispatch, useSelector } from "react-redux";
import {
  getForkableWorkspaces,
  isImportingTemplateSelector,
} from "selectors/templatesSelectors";
import { importTemplateToWorkspace } from "actions/templateActions";
import {
  CANCEL,
  CHOOSE_WHERE_TO_FORK,
  createMessage,
  FORK_TEMPLATE,
  SELECT_WORKSPACE,
} from "ee/constants/messages";

interface ForkTemplateProps {
  children?: ReactNode;
  showForkModal: boolean;
  onClose: (e?: React.MouseEvent<HTMLElement>) => void;
  templateId: string;
}

function ForkTemplate({
  children,
  onClose,
  showForkModal,
  templateId,
}: ForkTemplateProps) {
  const workspaceList = useSelector(getForkableWorkspaces);
  const [selectedWorkspace, setSelectedWorkspace] = useState(workspaceList[0]);
  const isImportingTemplate = useSelector(isImportingTemplateSelector);
  const dispatch = useDispatch();

  const onFork = () => {
    dispatch(importTemplateToWorkspace(templateId, selectedWorkspace.value));
  };

  const closeModal = (isOpen: boolean) => {
    if (!isOpen && !isImportingTemplate) {
      onClose();
    }
  };

  return (
    <>
      {children}
      <Modal onOpenChange={closeModal} open={showForkModal}>
        <ModalContent style={{ width: "640px" }}>
          <ModalHeader>{createMessage(CHOOSE_WHERE_TO_FORK)}</ModalHeader>
          <ModalBody style={{ overflow: "unset", paddingBottom: "4px" }}>
            <Select
              dropdownMatchSelectWidth
              getPopupContainer={(triggerNode) => triggerNode.parentNode}
              // TODO: (Albin) Fix this
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              //@ts-ignore
              onSelect={(
                dropdownOptionValue: string,
                dropdownOption: {
                  label: string;
                  value: string;
                },
              ) => setSelectedWorkspace(dropdownOption)}
              options={workspaceList}
              placeholder={createMessage(SELECT_WORKSPACE)}
              value={selectedWorkspace}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              isDisabled={isImportingTemplate}
              kind="secondary"
              onClick={onClose}
              size="md"
            >
              {createMessage(CANCEL)}
            </Button>
            <Button
              className="t--fork-template-button"
              isLoading={isImportingTemplate}
              onClick={onFork}
              size="md"
            >
              {createMessage(FORK_TEMPLATE)}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default ForkTemplate;
