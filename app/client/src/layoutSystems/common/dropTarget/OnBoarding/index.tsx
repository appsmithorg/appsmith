import {
  EMPTY_CANVAS_HINTS,
  createMessage,
} from "@appsmith/constants/messages";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import {
  EditorEntityTab,
  EditorState as IDEAppState,
} from "@appsmith/entities/IDE/constants";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import {
  useCurrentAppState,
  useCurrentEditorState,
} from "pages/Editor/IDE/hooks";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { isDraggingBuildingBlockToCanvas } from "selectors/buildingBlocksSelectors";
import { getIsMobileCanvasLayout } from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import BuildingBlockExplorerDropTarget from "../buildingBlockExplorerDropTarget";
import StarterBuildingBlocks from "../starterBuildingBlocks";
function Onboarding() {
  const isMobileCanvas = useSelector(getIsMobileCanvasLayout);
  const isDraggingBuildingBlock = useSelector(isDraggingBuildingBlockToCanvas);
  const appState = useCurrentAppState();
  const isAirgappedInstance = isAirgapped();
  const { segment } = useCurrentEditorState();

  const showStarterTemplatesInsteadOfBlankCanvas = useFeatureFlag(
    FEATURE_FLAG.ab_show_templates_instead_of_blank_canvas_enabled,
  );
  const releaseDragDropBuildingBlocksEnabled = useFeatureFlag(
    FEATURE_FLAG.release_drag_drop_building_blocks_enabled,
  );

  const isEditorState = appState === IDEAppState.EDITOR;
  const isUISegment = segment === EditorEntityTab.UI;

  const shouldShowStarterTemplates = useMemo(
    () =>
      isEditorState &&
      showStarterTemplatesInsteadOfBlankCanvas &&
      !isMobileCanvas &&
      !isAirgappedInstance &&
      !releaseDragDropBuildingBlocksEnabled, // Hide starter templates when drag-drop building blocks are available
    [
      showStarterTemplatesInsteadOfBlankCanvas,
      isMobileCanvas,
      isAirgappedInstance,
      releaseDragDropBuildingBlocksEnabled,
      isEditorState,
    ],
  );
  const shouldShowBuildingBlocksDropTarget = useMemo(
    () =>
      isEditorState &&
      isUISegment &&
      releaseDragDropBuildingBlocksEnabled &&
      !isDraggingBuildingBlock,
    [
      isEditorState,
      releaseDragDropBuildingBlocksEnabled,
      isDraggingBuildingBlock,
      isUISegment,
    ],
  );

  if (shouldShowStarterTemplates) {
    return <StarterBuildingBlocks />;
  } else if (shouldShowBuildingBlocksDropTarget) {
    return <BuildingBlockExplorerDropTarget />;
  } else if (!isDraggingBuildingBlock) {
    return (
      <h2 className="absolute top-0 left-0 right-0 flex items-end h-108 justify-center text-2xl font-bold text-gray-300">
        {createMessage(EMPTY_CANVAS_HINTS.DRAG_DROP_WIDGET_HINT)}
      </h2>
    );
  } else {
    return null;
  }
}

export default Onboarding;
