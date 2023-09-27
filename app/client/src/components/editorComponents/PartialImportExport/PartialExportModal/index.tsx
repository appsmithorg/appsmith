import {
  Modal,
  ModalContent,
  ModalHeader,
  Text,
  Collapsible,
  CollapsibleHeader,
  CollapsibleContent,
} from "design-system";
import React from "react";
import WidgetsExport from "./WidgetsExport";
import DatasourcesExport from "./DatasourcesExport";
import JSObjectsNQueriesExport from "./JSObjectsNQueriesExport";
import CustomJSLibsExport from "./CustomJSLibsExport";
import { PARTIAL_EXPORT, createMessage } from "@appsmith/constants/messages";
import {
  JsFileIconV2,
  datasourceIcon,
  dbQueryIcon,
} from "pages/Editor/Explorer/ExplorerIcons";
import styled from "styled-components";

type Props = {
  handleModalClose: () => void;
  isModalOpen: boolean;
};
const PartiaExportModel = ({ handleModalClose, isModalOpen }: Props) => {
  const exportSections: {
    title: string;
    icon: JSX.Element;
    children: JSX.Element;
  }[] = [
    {
      title: "JsObjects",
      icon: JsFileIconV2(16, 16),
      children: <JSObjectsNQueriesExport />,
    },
    {
      title: "Databases",
      icon: datasourceIcon,
      children: <DatasourcesExport />,
    },
    {
      title: "Queries",
      icon: dbQueryIcon,
      children: <JSObjectsNQueriesExport />,
    },
    {
      title: "Custom libraries",
      icon: <span />,
      children: <CustomJSLibsExport />,
    },
    {
      title: "Widgets",
      icon: <span />,
      children: <WidgetsExport />,
    },
  ];
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
        {exportSections.map(({ children, icon, title }) => (
          <Collapsible isOpen key={title}>
            <CollapsibleHeader>
              <Text
                kind="heading-s"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {icon} {title}
              </Text>
            </CollapsibleHeader>
            <CollapsibleContent>
              <Content>{children}</Content>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </ModalContent>
    </Modal>
  );
};

export default PartiaExportModel;
const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: center;
  padding: 16px;
  background-color: var(--ads-v2-color-gray-100);
`;
