import React from "react";
import {
  createMessage,
  DELETE_CONFIRMATION_MODAL_TITLE,
  DISCARD_POPUP_DONT_SAVE_BUTTON_TEXT,
  SAVE_OR_DISCARD_DATASOURCE_WARNING,
} from "@appsmith/constants/messages";
import {
  Button,
  Category,
  DialogComponent as Dialog,
  Size,
} from "design-system-old";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import { hasManageDatasourcePermission } from "@appsmith/utils/permissionHelpers";

interface SaveOrDiscardModalProps {
  isOpen: boolean;
  onDiscard(): void;
  onSave?(): void;
  onClose(): void;
  datasourceId: string;
  datasourcePermissions: string[];
  saveButtonText: string;
}

function SaveOrDiscardDatasourceModal(props: SaveOrDiscardModalProps) {
  const {
    datasourceId,
    datasourcePermissions,
    isOpen,
    onClose,
    onDiscard,
    onSave,
    saveButtonText,
  } = props;

  const createMode = datasourceId === TEMP_DATASOURCE_ID;
  const canManageDatasources = hasManageDatasourcePermission(
    datasourcePermissions,
  );
  const disableSaveButton = !createMode && !canManageDatasources;

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
            category={Category.secondary}
            className="t--datasource-modal-do-not-save"
            onClick={onDiscard}
            size={Size.medium}
            text={createMessage(DISCARD_POPUP_DONT_SAVE_BUTTON_TEXT)}
          />
          <Button
            category={Category.primary}
            className="t--datasource-modal-save"
            disabled={disableSaveButton}
            onClick={!disableSaveButton && onSave}
            size={Size.medium}
            text={saveButtonText}
          />
        </div>
      </div>
    </Dialog>
  );
}

export default SaveOrDiscardDatasourceModal;
