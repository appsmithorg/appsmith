import { Checkbox } from "design-system";
import WidgetIcon from "pages/Editor/Explorer/Widgets/WidgetIcon";
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

interface WidgetSelectorProps extends BaseProps {
  widgetList: CanvasStructure[];
}
function WidgetSelector({
  selectedWidgetIds,
  updateSelectedWidgets,
  widgetList,
}: WidgetSelectorProps) {
  const toggleNestedChildrenSelection = (
    node: CanvasStructure,
    selectedWidgetIds: string[],
    checked: boolean,
  ) => {
    const isSelected = selectedWidgetIds.includes(node.widgetId);
    if (checked) {
      !isSelected && selectedWidgetIds.push(node.widgetId);
    } else {
      isSelected &&
        selectedWidgetIds.splice(selectedWidgetIds.indexOf(node.widgetId), 1);
    }
    node?.children?.forEach((child) => {
      toggleNestedChildrenSelection(child, selectedWidgetIds, checked);
    });
  };

  const toggleNode = (node: CanvasStructure, checked: boolean) => {
    const prevSelectedWidgetIds = [...selectedWidgetIds];
    toggleNestedChildrenSelection(node, prevSelectedWidgetIds, checked);
    updateSelectedWidgets(prevSelectedWidgetIds);
  };

  function renderWidget(
    widget: CanvasStructure,
    level = 0,
    isParentSelected: boolean,
  ) {
    const isSelected = selectedWidgetIds.includes(widget.widgetId);
    return (
      <div style={{ marginLeft: level + 8 }}>
        <CheckboxContainer>
          <Checkbox
            isDisabled={isParentSelected}
            isSelected={isSelected}
            onChange={(checked) => toggleNode(widget, checked)}
          >
            <div className="flex items-center">
              <WidgetIcon height={12} type={widget.type} width={12} />
              &nbsp;
              {widget.widgetName}
            </div>
          </Checkbox>
        </CheckboxContainer>
        {widget.children?.map((child) =>
          renderWidget(child, level + 1, isSelected),
        )}
      </div>
    );
  }

  return (
    <CheckboxWrapper>
      {widgetList.map((widget) => renderWidget(widget, 0, false))}
    </CheckboxWrapper>
  );
}

const CheckboxContainer = styled.div`
  margin-bottom: 8px;
`;
