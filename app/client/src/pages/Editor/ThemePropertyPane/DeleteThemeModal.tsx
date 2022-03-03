import React from "react";

import Dialog from "components/ads/DialogComponent";
import Button, { Category, Size } from "components/ads/Button";
import { Variant } from "components/ads/common";
import {
  createMessage,
  DELETE_APP_THEME_WARNING,
  DELETE_CONFIRMATION_MODAL_TITLE,
} from "@appsmith/constants/messages";

interface DeleteThemeModalProps {
  isOpen: boolean;
  onClose(): void;
  onDelete(): void;
}

function DeleteThemeModal(props: DeleteThemeModalProps) {
  const { isOpen, onClose, onDelete } = props;

  return (
    <Dialog
      canOutsideClickClose
      isOpen={isOpen}
      onClose={onClose}
      title={createMessage(DELETE_CONFIRMATION_MODAL_TITLE)}
      width="500px"
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
