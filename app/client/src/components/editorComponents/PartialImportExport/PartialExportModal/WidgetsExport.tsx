import { selectWidgetsForCurrentPage } from "@appsmith/selectors/entitiesSelector";
import { Checkbox } from "design-system";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import type { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import { CheckboxWrapper } from "./StyledSheet";
import styled from "styled-components";

const WidgetsExport = () => {
  const widgets = useSelector(selectWidgetsForCurrentPage);
  if (!widgets || !widgets.children || widgets.children.length === 0)
    return null;
  return <WidgetSelector widgets={widgets.children} />;
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

function WidgetSelector({ widgets }: { widgets: CanvasStructure[] }) {
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  const toggleNode = (node: CanvasStructure, parentArray: string[]) => {
    const updatedSelectedNodes = [...selectedNodes];

    if (updatedSelectedNodes.includes(node.widgetId)) {
      // Node is already selected, so deselect it and its children
      updatedSelectedNodes.splice(
        updatedSelectedNodes.indexOf(node.widgetId),
        1,
      );
      parentArray.forEach((parentId) => {
        updatedSelectedNodes.splice(updatedSelectedNodes.indexOf(parentId), 1);
      });
    } else {
      // Node is not selected, so select it and all its children
      updatedSelectedNodes.push(node.widgetId);

      selectAllNestedChildren(node, updatedSelectedNodes);
    }

    setSelectedNodes(updatedSelectedNodes);
  };
  function renderWidget(
    widget: CanvasStructure,
    parentArray: string[],
    level = 0,
  ) {
    const isSelected = selectedNodes.includes(widget.widgetId);
    return (
      <div style={{ marginLeft: level * 8 }}>
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
      {widgets.map((widget) => renderWidget(widget, [], 0))}
    </CheckboxWrapper>
  );
}

const CheckboxContainer = styled.div`
  margin-bottom: 8px;
`;
