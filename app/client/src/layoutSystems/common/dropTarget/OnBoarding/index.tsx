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
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import BuildingBlockExplorerDropTarget from "../buildingBlockExplorerDropTarget";
import { useSelector } from "react-redux";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";

function Onboarding() {
  const appState = useCurrentAppState();
  const isPreviewMode = useSelector(combinedPreviewModeSelector);
  const isAirgappedInstance = isAirgapped();
  const { segment } = useCurrentEditorState();

  const releaseDragDropBuildingBlocksEnabled = useFeatureFlag(
    FEATURE_FLAG.release_drag_drop_building_blocks_enabled,
  );

  const isEditorState = appState === IDEAppState.EDITOR;
  const isUISegment = segment === EditorEntityTab.UI;

  const shouldShowBuildingBlocksDropTarget = useMemo(
    () =>
      !isAirgappedInstance &&
      isEditorState &&
      isUISegment &&
      !isPreviewMode &&
      releaseDragDropBuildingBlocksEnabled,
    [
      isEditorState,
      releaseDragDropBuildingBlocksEnabled,
      isUISegment,
      isPreviewMode,
      isAirgappedInstance,
    ],
  );

  if (shouldShowBuildingBlocksDropTarget) {
    return <BuildingBlockExplorerDropTarget />;
  }
  return (
    <h2 className="absolute top-0 left-0 right-0 flex items-end h-108 justify-center text-2xl font-bold text-gray-300">
      {createMessage(EMPTY_CANVAS_HINTS.DRAG_DROP_WIDGET_HINT)}
    </h2>
  );
}

export default Onboarding;
