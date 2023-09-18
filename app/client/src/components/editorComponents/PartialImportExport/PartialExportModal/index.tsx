import { Modal, ModalContent, ModalHeader } from "design-system";
import React from "react";
import WidgetsExport from "./WidgetsExport";
import DatasourcesExport from "./DatasourcesExport";

type Props = {
  handleModalClose: () => void;
  isModalOpen: boolean;
};
const PartiaExportModel = ({ handleModalClose, isModalOpen }: Props) => {
  return (
    <Modal onOpenChange={handleModalClose} open={isModalOpen}>
      <ModalContent>
        <ModalHeader>PartiaExportModel</ModalHeader>
        <WidgetsExport />
        <DatasourcesExport />
      </ModalContent>
    </Modal>
  );
};

export default PartiaExportModel;
