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
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import { hasManageDatasourcePermission } from "@appsmith/utils/permissionHelpers";

interface SaveOrDiscardModalProps {
  isOpen: boolean;
  onDiscard(): void;
  onSave?(): void;
  onClose(): void;
  datasourceId: string;
  datasourcePermissions: string[];
}

function SaveOrDiscardDatasourceModal(props: SaveOrDiscardModalProps) {
  const {
    datasourceId,
    datasourcePermissions,
    isOpen,
    onClose,
    onDiscard,
    onSave,
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
            category={Category.tertiary}
            className="t--datasource-modal-do-not-save"
            onClick={onDiscard}
            size={Size.medium}
            text="DON'T SAVE"
          />
          <Button
            category={Category.primary}
            className="t--datasource-modal-save"
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

export default SaveOrDiscardDatasourceModal;
