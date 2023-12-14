import React from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { getSelectedWidgets } from "selectors/ui";
import { Layers } from "constants/Layers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { previewModeSelector } from "selectors/editorSelectors";

const SelectedState = styled.div<{
  isSelected: boolean;
}>`
  border: 1px solid
    ${({ isSelected }) =>
      isSelected ? "var(--ads-v2-color-orange-500)" : "transparent"};
`;

const WidgetName = styled.div`
  position: absolute;
  border-bottom-right-radius: 4px;
  border-top: none;
  color: white;
  padding: 0 5px;
  background: #ef7541;
  z-index: ${Layers.widgetName};
`;

const MainCanvasSelectedLayer = (props: { children: React.ReactNode }) => {
  const selectedWidgets = useSelector(getSelectedWidgets);
  const isPreviewMode = useSelector(previewModeSelector);
  const isCanvasSelectedStateEnabled = useFeatureFlag(
    FEATURE_FLAG.release_canvas_selected_state_enabled,
  );
  if (!isCanvasSelectedStateEnabled) {
    return <div>{props.children}</div>;
  }
  const isSelected = selectedWidgets.length === 0;

  const showSelectedState =
    isSelected && isCanvasSelectedStateEnabled && !isPreviewMode;

  return (
    <SelectedState isSelected={showSelectedState}>
      {showSelectedState && <WidgetName>Canvas</WidgetName>}
      {props.children}
    </SelectedState>
  );
};

export default MainCanvasSelectedLayer;
