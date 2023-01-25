import React from "react";
import {
  createMessage,
  DELETE_CONFIRMATION_MODAL_TITLE,
} from "@appsmith/constants/messages";
import {
  Button,
  Category,
  DialogComponent as Dialog,
  Size,
} from "design-system-old";

interface SaveOrDiscardModalProps {
  isOpen: boolean;
  onDiscard(): void;
  onSave?(): void;
  onClose(): void;
  disabledButtons: boolean;
}

function SaveOrDiscardRoleModal(props: SaveOrDiscardModalProps) {
  const { disabledButtons, isOpen, onClose, onDiscard, onSave } = props;

  const disableSaveButton = disabledButtons;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={createMessage(DELETE_CONFIRMATION_MODAL_TITLE)}
      width={"596px"}
    >
      <div className="pb-8 space-y-3 ">
        <p>
          Unsaved changes will be lost if you switch tab, save the changes
          before exiting.
        </p>
      </div>

      <div className="">
        <div className="flex items-center justify-end space-x-3">
          <Button
            category={Category.secondary}
            className="t--role-modal-do-not-save"
            onClick={onDiscard}
            size={Size.medium}
            text="DON'T SAVE"
          />
          <Button
            category={Category.primary}
            className="t--role-modal-save"
            disabled={disableSaveButton}
            onClick={!disableSaveButton && onSave}
            size={Size.medium}
            text="SAVE"
          />
        </div>
      </div>
    </Dialog>
  );
}

export default SaveOrDiscardRoleModal;
