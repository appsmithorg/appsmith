import { Modal, ModalContent, ModalHeader, Text } from "design-system";
import React from "react";
import WidgetsExport from "./WidgetsExport";
import DatasourcesExport from "./DatasourcesExport";
import JSObjectsNQueriesExport from "./JSObjectsNQueriesExport";
import CustomJSLibsExport from "./CustomJSLibsExport";
import { PARTIAL_EXPORT, createMessage } from "@appsmith/constants/messages";

type Props = {
  handleModalClose: () => void;
  isModalOpen: boolean;
};
const PartiaExportModel = ({ handleModalClose, isModalOpen }: Props) => {
  return (
    <Modal onOpenChange={handleModalClose} open={isModalOpen}>
      <ModalContent>
        <ModalHeader>
          <Text className="title" kind="heading-xl">
            {createMessage(PARTIAL_EXPORT.modalHeading)}
          </Text>
        </ModalHeader>
        <Text kind="heading-m" renderAs="h2">
          {createMessage(PARTIAL_EXPORT.modalSubHeading)}
        </Text>
        <WidgetsExport />
        <JSObjectsNQueriesExport />
        <DatasourcesExport />
        <CustomJSLibsExport />
      </ModalContent>
    </Modal>
  );
};

export default PartiaExportModel;
