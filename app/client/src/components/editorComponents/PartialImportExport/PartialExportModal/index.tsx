import {
  PARTIAL_IMPORT_EXPORT,
  createMessage,
} from "@appsmith/constants/messages";
import {
  selectFilesForExplorer,
  selectLibrariesForExplorer,
  selectWidgetsForCurrentPage,
} from "@appsmith/selectors/entitiesSelector";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
} from "design-system";
import {
  JsFileIconV2,
  datasourceIcon,
  dbQueryIcon,
} from "pages/Editor/Explorer/ExplorerIcons";
import { useAppWideAndOtherDatasource } from "pages/Editor/Explorer/hooks";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import EntityCheckboxSelector from "./EntityCheckboxSelector";
import JSObjectsNQueriesExport from "./JSObjectsNQueriesExport";
import WidgetsExport from "./WidgetsExport";

interface Props {
  handleModalClose: () => void;
  isModalOpen: boolean;
}
const PartiaExportModel = ({ handleModalClose, isModalOpen }: Props) => {
  const files = useSelector(selectFilesForExplorer);
  const { appWideDS } = useAppWideAndOtherDatasource();
  const libraries = useSelector(selectLibrariesForExplorer);

  const entities = useMemo(() => {
    const groupedData: Record<string, any> = {};

    let currentGroup: unknown = null;

    for (const item of files) {
      if (item.type === "group") {
        currentGroup = item.entity.name;
        groupedData[currentGroup as string] = [];
      } else if (currentGroup) {
        groupedData[currentGroup as string].push(item);
      }
    }
    const jsObjects =
      groupedData["JS Objects"] &&
      groupedData["JS Objects"].map((item: any) => item.entity);
    delete groupedData["JS Objects"];

    return [
      {
        title: "Widgets",
        icon: <span />,
        children: <WidgetsExport />,
      },
      {
        title: "JsObjects",
        icon: JsFileIconV2(16, 16),
        children: jsObjects ? (
          <EntityCheckboxSelector entities={jsObjects} />
        ) : null,
      },
      {
        title: "Databases",
        icon: datasourceIcon,
        children: appWideDS ? (
          <EntityCheckboxSelector entities={appWideDS} />
        ) : null,
      },
      {
        title: "Queries",
        icon: dbQueryIcon,
        children: groupedData ? (
          <JSObjectsNQueriesExport data={groupedData} />
        ) : null,
      },
      {
        title: "Custom libraries",
        icon: <span />,
        children: libraries ? (
          <EntityCheckboxSelector entities={libraries} />
        ) : null,
      },
    ];
  }, [files, selectWidgetsForCurrentPage]);

  return (
    <Modal onOpenChange={handleModalClose} open={isModalOpen}>
      <ModalContent>
        <ModalHeader>
          <Text className="title" kind="heading-xl">
            {createMessage(PARTIAL_IMPORT_EXPORT.export.modalHeading)}
          </Text>
        </ModalHeader>
        <Text kind="heading-s" renderAs="h2">
          {createMessage(PARTIAL_IMPORT_EXPORT.export.modalSubHeading)}
        </Text>
        <ScrollableSection>
          {entities.map(({ children, icon, title }) => (
            <>
              <Collapsible className="mt-4" isOpen key={title}>
                <CollapsibleHeader>
                  <Text
                    kind="heading-s"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {icon} {title}
                  </Text>
                </CollapsibleHeader>
                <CollapsibleContent>{children}</CollapsibleContent>
              </Collapsible>
              <Bar />
            </>
          ))}
        </ScrollableSection>
        <ModalFooter>
          <Button size="md">
            {createMessage(PARTIAL_IMPORT_EXPORT.export.cta)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PartiaExportModel;

const ScrollableSection = styled.section`
  overflow-y: auto;
`;

const Bar = styled.hr`
  margin: 16px 0;
`;
