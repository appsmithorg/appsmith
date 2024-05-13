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
import { getIsMobileCanvasLayout } from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import BuildingBlockExplorerDropTarget from "../buildingBlockExplorerDropTarget";
import StarterBuildingBlocks from "../starterBuildingBlocks";

function Onboarding() {
  const isMobileCanvas = useSelector(getIsMobileCanvasLayout);
  const appState = useCurrentAppState();
  const isAirgappedInstance = isAirgapped();
  const { segment } = useCurrentEditorState();

  const releaseDragDropBuildingBlocksEnabled = useFeatureFlag(
    FEATURE_FLAG.release_drag_drop_building_blocks_enabled,
  );

  const isEditorState = appState === IDEAppState.EDITOR;
  const isUISegment = segment === EditorEntityTab.UI;

  const shouldShowStarterTemplates = useMemo(
    () => isEditorState && !isMobileCanvas,
    [isMobileCanvas, isEditorState],
  );
  const shouldShowBuildingBlocksDropTarget = useMemo(
    () => isEditorState && isUISegment && releaseDragDropBuildingBlocksEnabled,
    [isEditorState, releaseDragDropBuildingBlocksEnabled, isUISegment],
  );

  if (!isAirgappedInstance) {
    if (shouldShowBuildingBlocksDropTarget) {
      return <BuildingBlockExplorerDropTarget />;
    } else if (shouldShowStarterTemplates) {
      return <StarterBuildingBlocks />;
    }
  }
  return (
    <h2 className="absolute top-0 left-0 right-0 flex items-end h-108 justify-center text-2xl font-bold text-gray-300">
      {createMessage(EMPTY_CANVAS_HINTS.DRAG_DROP_WIDGET_HINT)}
    </h2>
  );
}

export default Onboarding;
