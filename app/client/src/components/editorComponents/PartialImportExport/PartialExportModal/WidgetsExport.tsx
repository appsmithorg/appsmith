import { Checkbox } from "design-system";
import React from "react";
import type { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import styled from "styled-components";
import { CheckboxWrapper } from "./StyledSheet";

interface BaseProps {
  selectedWidgetIds: string[];
  updateSelectedWidgets: (widgetIds: string[]) => void;
}
interface Props extends BaseProps {
  widgets: CanvasStructure;
}
const WidgetsExport = ({
  selectedWidgetIds,
  updateSelectedWidgets,
  widgets,
}: Props) => {
  if (!widgets || !widgets.children || widgets.children.length === 0)
    return null;
  return (
    <WidgetSelector
      selectedWidgetIds={selectedWidgetIds}
      updateSelectedWidgets={updateSelectedWidgets}
      widgetList={widgets.children}
    />
  );
};

export default WidgetsExport;

function selectAllNestedChildren(
  node: CanvasStructure,
  selectedNodes: string[],
) {
  node.children?.forEach((child) => {
    if (!selectedNodes.includes(child.widgetId)) {
      selectedNodes.push(child.widgetId);
      child.children && selectAllNestedChildren(child, selectedNodes);
    }
  });
}

interface WidgetSelectorProps extends BaseProps {
  widgetList: CanvasStructure[];
}
function WidgetSelector({
  selectedWidgetIds,
  updateSelectedWidgets,
  widgetList,
}: WidgetSelectorProps) {
  const toggleNode = (node: CanvasStructure, parentArray: string[]) => {
    const prevSelectedWidgetIds = [...selectedWidgetIds];

    if (prevSelectedWidgetIds.includes(node.widgetId)) {
      // Node is already selected, so deselect it and its children
      prevSelectedWidgetIds.splice(
        prevSelectedWidgetIds.indexOf(node.widgetId),
        1,
      );
      parentArray.forEach((parentId) => {
        prevSelectedWidgetIds.includes(parentId) &&
          prevSelectedWidgetIds.splice(
            prevSelectedWidgetIds.indexOf(parentId),
            1,
          );
      });
    } else {
      // Node is not selected, so select it and all its children
      prevSelectedWidgetIds.push(node.widgetId);
      selectAllNestedChildren(node, prevSelectedWidgetIds);
    }

    updateSelectedWidgets(prevSelectedWidgetIds);
  };
  function renderWidget(
    widget: CanvasStructure,
    parentArray: string[],
    level = 0,
  ) {
    const isSelected = selectedWidgetIds.includes(widget.widgetId);
    return (
      <div style={{ marginLeft: level + 8 }}>
        <CheckboxContainer>
          <Checkbox
            isSelected={isSelected}
            onChange={() => toggleNode(widget, parentArray)}
          >
            {widget.widgetName}
          </Checkbox>
        </CheckboxContainer>
        {widget.children?.map((child) =>
          renderWidget(child, [...parentArray, widget.widgetId], level + 1),
        )}
      </div>
    );
  }

  return (
    <CheckboxWrapper>
      {widgetList.map((widget) => renderWidget(widget, [], 0))}
    </CheckboxWrapper>
  );
}

const CheckboxContainer = styled.div`
  margin-bottom: 8px;
`;
