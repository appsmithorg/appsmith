import { showLicenseModal } from "@appsmith/actions/tenantActions";
import {
  UPDATE_LICENSE,
  LICENSE_KEY_MODAL_INPUT_LABEL,
  PASTE_LICENSE_KEY,
  createMessage,
} from "@appsmith/constants/messages";
import { LicenseForm } from "@appsmith/pages/LicenseSetup/LicenseForm";
import { Modal, ModalBody, ModalContent, ModalHeader } from "design-system";
import React from "react";
import { useDispatch } from "react-redux";

export interface ShowLicenceModalProps {
  isUpdateModalOpen?: boolean;
  onUpgradeDowngradeClick?: (key: string) => void;
}

export default function ShowLicenceModal(props: ShowLicenceModalProps) {
  const dispatch = useDispatch();

  return (
    <Modal
      onOpenChange={(open: boolean) => dispatch(showLicenseModal(open))}
      open={props.isUpdateModalOpen}
    >
      <ModalContent style={{ width: "640px" }}>
        <ModalHeader>{createMessage(UPDATE_LICENSE)}</ModalHeader>
        <ModalBody>
          <LicenseForm
            isModal
            isUpdate
            label={createMessage(LICENSE_KEY_MODAL_INPUT_LABEL)}
            onUpgradeDowngradeClick={(key) => {
              if (props.onUpgradeDowngradeClick)
                props.onUpgradeDowngradeClick(key);
            }}
            placeholder={createMessage(PASTE_LICENSE_KEY)}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
