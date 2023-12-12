import {
  PARTIAL_IMPORT_EXPORT,
  createMessage,
} from "@appsmith/constants/messages";
import { useAppWideAndOtherDatasource } from "@appsmith/pages/Editor/Explorer/hooks";
import { getPartialImportExportLoadingState } from "@appsmith/selectors/applicationSelectors";
import {
  selectFilesForExplorer,
  selectLibrariesForExplorer,
  selectWidgetsForCurrentPage,
} from "@appsmith/selectors/entitiesSelector";
import { partialExportWidgets } from "actions/widgetActions";
import {
  Button,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
} from "design-system";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { PartialExportParams } from "sagas/WidgetSelectionSagas";
import { getCurrentPageName } from "selectors/editorSelectors";
import type { JSLibrary } from "workers/common/JSLibrary";
import { Bar, ScrollableSection } from "./StyledSheet";
import {
  getAllExportableIds,
  selectOnlyParentIdsForSelectedWidgets,
} from "./partialExportUtils";
import { useEntitesToExport } from "./useEntitesToExport";

interface Props {
  handleModalClose: () => void;
  isModalOpen: boolean;
}
const selectedParamsInitValue: PartialExportParams = {
  jsObjects: [],
  datasources: [],
  customJSLibs: [],
  widgets: [],
  queries: [],
};
const PartiaExportModal = ({ handleModalClose, isModalOpen }: Props) => {
  const [customJsLibraries, setCustomJsLibraries] = useState<JSLibrary[]>([]);
  const dispatch = useDispatch();
  const [selectedParams, setSelectedParams] = useState<PartialExportParams>(
    selectedParamsInitValue,
  );

  const files = useSelector(selectFilesForExplorer);
  const libraries = useSelector(selectLibrariesForExplorer);
  const canvasWidgets = useSelector(selectWidgetsForCurrentPage);
  const partialImportExportLoadingState = useSelector(
    getPartialImportExportLoadingState,
  );
  const currentPageName = useSelector(getCurrentPageName);

  useEffect(() => {
    setCustomJsLibraries(libraries.filter((lib) => !!lib.url));
  }, [libraries]);

  const { appWideDS } = useAppWideAndOtherDatasource();
  const entities = useEntitesToExport(
    selectedParams,
    setSelectedParams,
    customJsLibraries,
  );

  const onExportClick = () => {
    dispatch(
      partialExportWidgets({
        ...selectedParams,
        widgets: selectOnlyParentIdsForSelectedWidgets(
          canvasWidgets!,
          selectedParams.widgets,
        ),
      }),
    );
  };

  const onExportAllClick = () => {
    const exportParams: PartialExportParams = getAllExportableIds(
      files,
      canvasWidgets!,
      customJsLibraries,
      appWideDS,
    );

    dispatch(partialExportWidgets(exportParams));
  };

  return (
    <Modal onOpenChange={handleModalClose} open={isModalOpen}>
      <ModalContent>
        <ModalHeader>
          <Text className="title" kind="heading-m">
            {createMessage(PARTIAL_IMPORT_EXPORT.export.modalHeading)}{" "}
            {currentPageName ? ` - ${currentPageName}` : ""}
          </Text>
        </ModalHeader>
        <Text kind="heading-s" renderAs="h2">
          {createMessage(PARTIAL_IMPORT_EXPORT.export.modalSubHeading)}
        </Text>
        <ScrollableSection>
          {entities.map(
            ({
              content,
              icon,
              isOpen,
              isSelectAllChecked,
              onResetClick,
              onSelectAllClick,
              shouldShowReset,
              title,
            }) => (
              <>
                <Collapsible className="mt-4" isOpen={isOpen} key={title}>
                  <CollapsibleHeader>
                    <div className="w-full flex justify-between">
                      <div className=" flex items-center justify-start">
                        <Checkbox
                          className="flex"
                          isSelected={isSelectAllChecked}
                          onChange={onSelectAllClick}
                        >
                          &nbsp;
                        </Checkbox>
                        <Text
                          className="w-full"
                          kind="heading-s"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {icon} {title}
                        </Text>
                      </div>

                      {shouldShowReset && (
                        <Button
                          className="mr-2"
                          endIcon="restart-line"
                          kind="tertiary"
                          onClick={onResetClick}
                          size="sm"
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </CollapsibleHeader>
                  <CollapsibleContent>{content}</CollapsibleContent>
                </Collapsible>
                <Bar />
              </>
            ),
          )}
        </ScrollableSection>
        <ModalFooter>
          <section className="w-full flex justify-between">
            <Button kind="secondary" onClick={onExportAllClick} size="md">
              {createMessage(PARTIAL_IMPORT_EXPORT.export.fullPageCta)}
            </Button>
            <Button
              isLoading={partialImportExportLoadingState.isExporting}
              onClick={onExportClick}
              size="md"
            >
              {createMessage(PARTIAL_IMPORT_EXPORT.export.cta)}
            </Button>
          </section>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PartiaExportModal;
