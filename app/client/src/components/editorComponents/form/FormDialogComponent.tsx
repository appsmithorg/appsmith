import React, { useState, useEffect } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "design-system";

interface FormDialogComponentProps {
  isOpen?: boolean;
  workspace?: any;
  title?: string;
  message?: string;
  Form: any;
  onClose?: () => void;
  applicationId?: string;
  placeholder?: string;
  hideDefaultTrigger?: boolean;
}

export function FormDialogComponent(props: FormDialogComponentProps) {
  const [isModalOpen, setIsModalOpenState] = useState(!!props.isOpen);

  useEffect(() => {
    setIsOpen(!!props.isOpen);
  }, [props.isOpen]);

  const setIsOpen = (isOpen: boolean) => {
    setIsModalOpenState(isOpen);
  };

  const onOpenChange = (isOpen: boolean) => {
    props?.onClose?.();
    setIsOpen(isOpen);
  };

  const Form = props.Form;

  return (
    <>
      {!props.hideDefaultTrigger && (
        <Button
          kind="secondary"
          onClick={() => setIsOpen(true)}
          size="md"
          startIcon={"share-line"}
        >
          Share
        </Button>
      )}
      <Modal
        onOpenChange={(isOpen) => isModalOpen && onOpenChange(isOpen)}
        open={isModalOpen}
      >
        <ModalContent style={{ width: "640px" }}>
          <ModalHeader>
            <div className="text-ellipsis overflow-hidden whitespace-nowrap">
              {props.title || `Invite users to ${props.workspace.name}`}
            </div>
          </ModalHeader>
          <ModalBody>
            <Form
              applicationId={props.applicationId}
              placeholder={props.placeholder}
              workspaceId={props.workspace.id}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default FormDialogComponent;
