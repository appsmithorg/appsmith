import React from "react";

import {
  createMessage,
  DELETE_APP_THEME_WARNING,
  DELETE_CONFIRMATION_MODAL_TITLE,
} from "@appsmith/constants/messages";
import { Colors } from "constants/Colors";
import { DialogComponent as Dialog } from "design-system-old";
import { Button } from "design-system";

interface DeleteThemeModalProps {
  isOpen: boolean;
  onClose(): void;
  onDelete(): void;
}

const deleteIconConfig = {
  name: "delete",
  fillColor: Colors.DANGER_SOLID,
  hoverColor: Colors.DANGER_SOLID_HOVER,
};

function DeleteThemeModal(props: DeleteThemeModalProps) {
  const { isOpen, onClose, onDelete } = props;

  return (
    <Dialog
      canOutsideClickClose
      headerIcon={deleteIconConfig}
      isOpen={isOpen}
      onClose={onClose}
      title={createMessage(DELETE_CONFIRMATION_MODAL_TITLE)}
    >
      <div id="delete-theme-modal">
        <div className="pb-8 space-y-3 ">
          <p>{createMessage(DELETE_APP_THEME_WARNING)}</p>
        </div>
        <div className="">
          <div className="flex items-center justify-end space-x-3">
            <Button kind="secondary" onPress={onClose} size="md">
              Cancel
            </Button>
            <Button kind="error" onPress={onDelete} size="md">
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

export default DeleteThemeModal;
