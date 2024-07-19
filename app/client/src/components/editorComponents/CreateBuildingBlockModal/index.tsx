import { selectWidgetsForCurrentPage } from "@appsmith/selectors/entitiesSelector";
import { openCreateBuildingBlockModal } from "actions/buildingBlockActions";
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
import { ControlIcons } from "design-system-old";
import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCreateBuildingBlockActionStates } from "selectors/buildingBlocksSelectors";
import {
  Bar,
  ScrollableSection,
} from "../PartialImportExport/PartialExportModal/StyledSheet";
import WidgetsExport from "../PartialImportExport/PartialExportModal/WidgetsExport";
import { BuildingBlockInfoForm } from "./BuildingBlockInfoForm";

interface CreateBuildingBlockParams {
  widgets: string[];
}

const selectedParamsInitValue: CreateBuildingBlockParams = {
  widgets: [],
};

const CreateBuildingBlockModal = () => {
  const dispatch = useDispatch();
  const createBuildingBlockActionStates = useSelector(
    getCreateBuildingBlockActionStates,
  );
  const canvasWidgets = useSelector(selectWidgetsForCurrentPage);
  const [buildingBlockName, setBuildingBlockName] = useState("");
  const [buildingBlockIconURL, setBuildingBlockIconURL] = useState("");

  const [selectedParams, setSelectedParams] =
    useState<CreateBuildingBlockParams>(selectedParamsInitValue);
  const [widgetSelectAllChecked, setWidgetSelectAllChecked] = useState(false);

  const disableCreateBuildingBlockCTA = useMemo(() => {
    return (
      !selectedParams.widgets.length ||
      !buildingBlockName.length ||
      !buildingBlockIconURL.length
    );
  }, [selectedParams, buildingBlockIconURL, buildingBlockName]);

  const entities = useMemo(() => {
    return [
      {
        content: canvasWidgets ? (
          <WidgetsExport
            selectAllchecked={widgetSelectAllChecked}
            selectedWidgetIds={selectedParams.widgets}
            updateSelectAllChecked={setWidgetSelectAllChecked}
            updateSelectedWidgets={(widgets) => {
              setSelectedParams((prev) => ({
                ...prev,
                widgets,
              }));
            }}
            widgets={canvasWidgets}
          />
        ) : null,
        icon: <ControlIcons.GROUP_CONTROL height={16} keepColors width={16} />,
        shouldShowReset: !!selectedParams.widgets.length,
        onResetClick: (event: React.MouseEvent<HTMLElement>) => {
          setSelectedParams((prev) => ({
            ...prev,
            widgets: [],
          }));
          setWidgetSelectAllChecked(false);
          event.stopPropagation();
        },
        title: "Widgets",
      },
    ];
  }, [canvasWidgets, selectedParams, widgetSelectAllChecked]);

  const handleModalClose = (open: boolean) => {
    if (!open) {
      dispatch(openCreateBuildingBlockModal(false));
      setSelectedParams(selectedParamsInitValue);
    }
  };

  const onCreateBuildingBlockClick = () => {};
  return (
    <Modal
      onOpenChange={handleModalClose}
      open={createBuildingBlockActionStates.isCreateBuildingBlockModalOpen}
    >
      <ModalContent>
        <ModalHeader>
          <Text className="title" kind="heading-xl">
            Create Building Block
          </Text>
        </ModalHeader>
        <Text kind="heading-s" renderAs="h2">
          Choose entities to form a reusable building block
        </Text>

        <BuildingBlockInfoForm
          buildingBlockIconURL={buildingBlockIconURL}
          buildingBlockName={buildingBlockName}
          setBuildingBlockIcon={setBuildingBlockIconURL}
          setBuildingBlockName={setBuildingBlockName}
        />
        <ScrollableSection data-testid="t--createBuildingBlock">
          {entities.map(
            ({ content, icon, onResetClick, shouldShowReset, title }) => (
              <React.Fragment key={title}>
                <Collapsible className="mt-4" isOpen key={title}>
                  <CollapsibleHeader>
                    <div className="w-full flex justify-between">
                      <Text
                        data-testid="t--createBuildingBlock-collapsibleHeader"
                        kind="heading-s"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {icon} {title}
                      </Text>

                      {shouldShowReset && (
                        <Button
                          className="mr-2"
                          data-testid={`t--create-building-block-reset-${title}`}
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
              </React.Fragment>
            ),
          )}
        </ScrollableSection>
        <ModalFooter>
          <Button
            data-testid="t--create-building-block-entities-btn"
            isDisabled={disableCreateBuildingBlockCTA}
            isLoading={
              createBuildingBlockActionStates.isLoadingCreateBuildingBlock
            }
            onClick={onCreateBuildingBlockClick}
            size="md"
          >
            Create Building Block
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateBuildingBlockModal;
