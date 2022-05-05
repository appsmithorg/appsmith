import React from "react";

import { Variant } from "components/ads/common";
import {
  createMessage,
  DELETE_APP_THEME_WARNING,
  DELETE_CONFIRMATION_MODAL_TITLE,
} from "@appsmith/constants/messages";
import { Colors } from "constants/Colors";
import Dialog from "components/ads/DialogComponent";
import Button, { Category, Size } from "components/ads/Button";

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
      <div className="pb-8 space-y-3 ">
        <p>{createMessage(DELETE_APP_THEME_WARNING)}</p>
      </div>

      <div className="">
        <div className="flex items-center justify-end space-x-3">
          <Button
            category={Category.tertiary}
            onClick={onClose}
            size={Size.medium}
            text="Cancel"
          />
          <Button
            category={Category.primary}
            onClick={onDelete}
            size={Size.medium}
            text="Delete"
            variant={Variant.danger}
          />
        </div>
      </div>
    </Dialog>
  );
}

export default DeleteThemeModal;
