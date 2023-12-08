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
    ${({ isSelected }) => (isSelected ? "#F86A2B" : "transparent")};
  height: 100%;
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
  const isSelected = selectedWidgets.length === 0;
  const isPagesPaneEnabled = useFeatureFlag(
    FEATURE_FLAG.release_show_new_sidebar_pages_pane_enabled,
  );
  const isPreviewMode = useSelector(previewModeSelector);

  const showSelectedState = isSelected && isPagesPaneEnabled && !isPreviewMode;

  return (
    <SelectedState isSelected={showSelectedState}>
      {showSelectedState && <WidgetName>Canvas</WidgetName>}
      {props.children}
    </SelectedState>
  );
};

export default MainCanvasSelectedLayer;
