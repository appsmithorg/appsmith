import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { getSelectedWidgets } from "selectors/ui";
import { forceOpenWidgetPanel } from "../../../actions/widgetSidebarActions";
import { setExplorerSwitchIndex } from "../../../actions/editorContextActions";

const SelectedState = styled.div<{
  isSelected: boolean;
}>`
  border: 1px solid
    ${({ isSelected }) => (isSelected ? "#F86A2B" : "transparent")};
  border-radius: 0 4px 4px 4px;
  height: 100%;
`;

const WidgetName = styled.div`
  position: absolute;
  border-bottom-right-radius: 4px;
  border-top: none;
  color: white;
  padding: 0 5px;
  background: #ef7541;
`;

const MainCanvasSelectedLayer = (props: { children: React.ReactNode }) => {
  const selectedWidgets = useSelector(getSelectedWidgets);
  const isSelected = selectedWidgets.length === 0;
  const dispatch = useDispatch();

  useEffect(() => {
    if (isSelected) {
      dispatch(forceOpenWidgetPanel(true));
      dispatch(setExplorerSwitchIndex(1));
    }
  }, [isSelected]);

  return (
    <SelectedState isSelected={isSelected}>
      {isSelected && <WidgetName>Canvas</WidgetName>}
      {props.children}
    </SelectedState>
  );
};

export default MainCanvasSelectedLayer;
