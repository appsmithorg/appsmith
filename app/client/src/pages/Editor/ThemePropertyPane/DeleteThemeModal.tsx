import React from "react";

import Dialog from "components/ads/DialogComponent";
import CloseIcon from "remixicon-react/CloseLineIcon";
import Button, { Category, Size } from "components/ads/Button";
import { Variant } from "components/ads/common";
import {
  createMessage,
  DELETE_APP_THEME_WARNING,
  DELETE_CONFIRMATION_MODAL_TITLE,
} from "@appsmith/constants/messages";
import DeleteIcon from "remixicon-react/DeleteBinLineIcon";

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
      width="600px"
    >
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-medium">
          <DeleteIcon className="w-6 h-6 p-1 text-red-600 bg-red-100 rounded-full" />
          {createMessage(DELETE_CONFIRMATION_MODAL_TITLE)}
        </h2>
        <button onClick={onClose} type="button">
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="py-6 pb-8 space-y-3 ">
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
