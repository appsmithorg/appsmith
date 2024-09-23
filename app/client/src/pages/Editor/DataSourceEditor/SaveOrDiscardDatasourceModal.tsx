import React from "react";
import {
  createMessage,
  DELETE_CONFIRMATION_MODAL_TITLE,
  DISCARD_POPUP_DONT_SAVE_BUTTON_TEXT,
  SAVE_OR_DISCARD_DATASOURCE_WARNING,
} from "ee/constants/messages";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
} from "@appsmith/ads";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { getHasManageDatasourcePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";

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
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const canManageDatasources = getHasManageDatasourcePermission(
    isFeatureEnabled,
    datasourcePermissions,
  );
  const disableSaveButton = !createMode && !canManageDatasources;

  return (
    <Modal onOpenChange={onClose} open={isOpen}>
      <ModalContent style={{ width: "600px" }}>
        <ModalHeader>
          {createMessage(DELETE_CONFIRMATION_MODAL_TITLE)}
        </ModalHeader>
        <ModalBody>
          <Text>{createMessage(SAVE_OR_DISCARD_DATASOURCE_WARNING)}</Text>
        </ModalBody>
        <ModalFooter>
          <Button
            className="t--datasource-modal-do-not-save"
            kind="secondary"
            onClick={onDiscard}
            size="md"
          >
            {createMessage(DISCARD_POPUP_DONT_SAVE_BUTTON_TEXT)}
          </Button>
          <Button
            className="t--datasource-modal-save"
            isDisabled={disableSaveButton}
            onClick={onSave}
            size="md"
          >
            {saveButtonText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default SaveOrDiscardDatasourceModal;
