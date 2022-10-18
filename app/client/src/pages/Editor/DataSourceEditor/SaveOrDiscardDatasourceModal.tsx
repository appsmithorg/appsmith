import React from "react";

import { Variant } from "components/ads/common";
import {
  createMessage,
  DELETE_CONFIRMATION_MODAL_TITLE,
  SAVE_OR_DISCARD_DATASOURCE_WARNING,
} from "@appsmith/constants/messages";
import { Colors } from "constants/Colors";
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

const deleteIconConfig = {
  name: "delete",
  fillColor: Colors.DANGER_SOLID,
  hoverColor: Colors.DANGER_SOLID_HOVER,
};

function SaveOrDiscardDatasourceModal(props: SaveOrDiscardModalProps) {
  const { isOpen, onClose, onDiscard, onSave } = props;

  return (
    <Dialog
      canOutsideClickClose
      headerIcon={deleteIconConfig}
      isOpen={isOpen}
      onClose={onClose}
      title={createMessage(DELETE_CONFIRMATION_MODAL_TITLE)}
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
            variant={Variant.danger}
          />
        </div>
      </div>
    </Dialog>
  );
}

export default SaveOrDiscardDatasourceModal;
