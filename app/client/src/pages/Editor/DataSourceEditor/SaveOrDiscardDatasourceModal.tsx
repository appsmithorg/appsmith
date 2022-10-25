import React from "react";
import {
  createMessage,
  DELETE_CONFIRMATION_MODAL_TITLE,
  SAVE_OR_DISCARD_DATASOURCE_WARNING,
} from "@appsmith/constants/messages";
import {
  Button,
  Category,
  DialogComponent as Dialog,
  Size,
} from "design-system";

interface SaveOrDiscardModalProps {
  isOpen: boolean;
  onDiscard(): void;
  onSave?(): void;
  onClose(): void;
}

function SaveOrDiscardDatasourceModal(props: SaveOrDiscardModalProps) {
  const { isOpen, onClose, onDiscard, onSave } = props;

  return (
    <Dialog
      canOutsideClickClose
      isOpen={isOpen}
      onClose={onClose}
      title={createMessage(DELETE_CONFIRMATION_MODAL_TITLE)}
      width={"596px"}
    >
      <div className="pb-8 space-y-3 ">
        <p>{createMessage(SAVE_OR_DISCARD_DATASOURCE_WARNING)}</p>
      </div>

      <div className="">
        <div className="flex items-center justify-end space-x-3">
          <Button
            category={Category.tertiary}
            onClick={onDiscard}
            size={Size.medium}
            text="DON'T SAVE"
          />
          <Button
            category={Category.primary}
            onClick={onSave}
            size={Size.medium}
            text="SAVE"
          />
        </div>
      </div>
    </Dialog>
  );
}

export default SaveOrDiscardDatasourceModal;
