import {
  PARTIAL_IMPORT_EXPORT,
  createMessage,
} from "@appsmith/constants/messages";
import { getPartialImportExportLoadingState } from "@appsmith/selectors/applicationSelectors";
import {
  selectFilesForExplorer,
  selectLibrariesForExplorer,
  selectWidgetsForCurrentPage,
} from "@appsmith/selectors/entitiesSelector";
import { partialExportWidgets } from "actions/widgetActions";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  Icon,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
} from "design-system";
import { ControlIcons } from "icons/ControlIcons";
import { MenuIcons } from "icons/MenuIcons";
import { useAppWideAndOtherDatasource } from "pages/Editor/Explorer/hooks";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import type { PartialExportParams } from "sagas/WidgetSelectionSagas";
import { getCurrentPageName } from "selectors/editorSelectors";
import styled from "styled-components";
import type { JSLibrary } from "workers/common/JSLibrary";
import EntityCheckboxSelector from "./EntityCheckboxSelector";
import JSObjectsNQueriesExport from "./JSObjectsNQueriesExport";
import WidgetsExport from "./WidgetsExport";

interface Props {
  handleModalClose: () => void;
  isModalOpen: boolean;
}
const PartiaExportModel = ({ handleModalClose, isModalOpen }: Props) => {
  const [customJsLibraries, setCustomJsLibraries] = useState<JSLibrary[]>([]);
  const dispatch = useDispatch();
  const [selectedParams, setSelectedParams] = useState<PartialExportParams>({
    jsObjects: [],
    datasources: [],
    customJSLibs: [],
    widgets: [],
    queries: [],
  });
  const files = useSelector(selectFilesForExplorer);
  const { appWideDS } = useAppWideAndOtherDatasource();
  const libraries = useSelector(selectLibrariesForExplorer);
  const canvasWidgets = useSelector(selectWidgetsForCurrentPage);
  const partialImportExportLoadingState = useSelector(
    getPartialImportExportLoadingState,
  );
  const currentPageName = useSelector(getCurrentPageName);

  useEffect(() => {
    setCustomJsLibraries(libraries.filter((lib) => !!lib.url));
  }, [libraries]);

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
        title: createMessage(PARTIAL_IMPORT_EXPORT.export.sections.jsObjects),
        icon: <Icon name="js" size="md" />,
        children: jsObjects ? (
          <EntityCheckboxSelector
            entities={jsObjects}
            onEntityChecked={(id, selected) =>
              onEntitySelected("jsObjects", id, selected)
            }
            selectedIds={selectedParams.jsObjects}
          />
        ) : null,
      },
      {
        title: createMessage(PARTIAL_IMPORT_EXPORT.export.sections.databases),
        icon: <Icon name="database-2-line" size="md" />,
        children:
          appWideDS.length > 0 ? (
            <EntityCheckboxSelector
              entities={appWideDS}
              onEntityChecked={(id, selected) =>
                onEntitySelected("datasources", id, selected)
              }
              selectedIds={selectedParams.datasources}
            />
          ) : null,
      },
      {
        title: createMessage(PARTIAL_IMPORT_EXPORT.export.sections.queries),
        icon: <MenuIcons.GROUP_QUERY_ICON height={16} keepColors width={16} />,
        children: groupedData ? (
          <JSObjectsNQueriesExport
            appDS={appWideDS}
            data={groupedData}
            selectedQueries={selectedParams.queries}
            updateSelectedQueries={(queries) =>
              setSelectedParams((prev) => ({ ...prev, queries }))
            }
          />
        ) : null,
      },
      {
        title: createMessage(PARTIAL_IMPORT_EXPORT.export.sections.customLibs),
        icon: <MenuIcons.LIBRARY_ICON height={16} keepColors width={16} />,
        children:
          customJsLibraries.length > 0 ? (
            <EntityCheckboxSelector
              entities={customJsLibraries}
              onEntityChecked={(id, selected) =>
                onEntitySelected("customJSLibs", id, selected)
              }
              selectedIds={selectedParams.customJSLibs}
            />
          ) : null,
      },
      {
        title: createMessage(PARTIAL_IMPORT_EXPORT.export.sections.widgets),
        icon: <ControlIcons.GROUP_CONTROL height={16} keepColors width={16} />,
        children: canvasWidgets ? (
          <WidgetsExport
            selectedWidgetIds={selectedParams.widgets}
            updateSelectedWidgets={(widgets) =>
              setSelectedParams((prev) => ({ ...prev, widgets }))
            }
            widgets={canvasWidgets}
          />
        ) : null,
      },
    ];
  }, [
    files,
    appWideDS,
    customJsLibraries,
    canvasWidgets,
    selectedParams,
    setSelectedParams,
  ]);

  const onEntitySelected = (
    keyToUpdate: keyof PartialExportParams,
    id: string,
    selected: boolean,
  ) => {
    const prevSelectedIdsCopy = [...selectedParams[keyToUpdate]];
    if (selected) {
      prevSelectedIdsCopy.push(id);
    } else {
      prevSelectedIdsCopy.splice(prevSelectedIdsCopy.indexOf(id), 1);
    }
    setSelectedParams((prev: PartialExportParams): PartialExportParams => {
      const toUpdate = { ...prev, [keyToUpdate]: prevSelectedIdsCopy };
      return toUpdate;
    });
  };

  const selectOnlyParentIds = (
    widget: CanvasStructure,
    ids: string[],
    finalWidgetIDs: string[] = [],
  ) => {
    if (widget.widgetId && ids.includes(widget.widgetId)) {
      finalWidgetIDs.push(widget.widgetId);
      return finalWidgetIDs;
    }
    if (widget.children) {
      widget.children.forEach((child) => {
        selectOnlyParentIds(child, ids, finalWidgetIDs);
      });
    }
    return finalWidgetIDs;
  };

  const onExportClick = () => {
    dispatch(
      partialExportWidgets({
        ...selectedParams,
        widgets: selectOnlyParentIds(canvasWidgets!, selectedParams.widgets),
      }),
    );
  };

  return (
    <Modal onOpenChange={handleModalClose} open={isModalOpen}>
      <ModalContent>
        <ModalHeader>
          <Text className="title" kind="heading-xl">
            {createMessage(PARTIAL_IMPORT_EXPORT.export.modalHeading)}{" "}
            {currentPageName ? ` - ${currentPageName}` : ""}
          </Text>
        </ModalHeader>
        <Text kind="heading-s" renderAs="h2">
          {createMessage(PARTIAL_IMPORT_EXPORT.export.modalSubHeading)}
        </Text>
        <ScrollableSection>
          {entities.map(({ children, icon, title }) => (
            <>
              <Collapsible className="mt-4" key={title}>
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
          <Button
            isLoading={partialImportExportLoadingState.isExporting}
            onClick={onExportClick}
            size="md"
          >
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
