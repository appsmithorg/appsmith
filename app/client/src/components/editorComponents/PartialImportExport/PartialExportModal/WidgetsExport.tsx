import { Checkbox, Text } from "@appsmith/ads";
import WidgetIcon from "pages/Editor/Explorer/Widgets/WidgetIcon";
import React from "react";
import type { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import {
  CheckBoxGrid,
  CheckboxContainer,
  CheckboxWrapper,
} from "./StyledSheet";

interface BaseProps {
  selectedWidgetIds: string[];
  selectAllchecked: boolean;
  updateSelectedWidgets: (widgetIds: string[]) => void;
  updateSelectAllChecked: (checked: boolean) => void;
}
interface Props extends BaseProps {
  widgets: CanvasStructure;
}
const WidgetsExport = ({
  selectAllchecked,
  selectedWidgetIds,
  updateSelectAllChecked,
  updateSelectedWidgets,
  widgets,
}: Props) => {
  if (!widgets || !widgets.children || widgets.children.length === 0)
    return null;
  return (
    <WidgetSelector
      selectAllchecked={selectAllchecked}
      selectedWidgetIds={selectedWidgetIds}
      updateSelectAllChecked={updateSelectAllChecked}
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
  selectAllchecked,
  selectedWidgetIds,
  updateSelectAllChecked,
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
    if (!checked) updateSelectAllChecked(false);
  };

  function renderWidget(
    widget: CanvasStructure,
    level = 0,
    isParentSelected: boolean,
  ) {
    const isSelected = selectedWidgetIds.includes(widget.widgetId);
    return (
      <div
        key={widget.widgetId}
        style={{ marginLeft: level > 0 ? level + 8 : level }}
      >
        <CheckboxContainer>
          <Checkbox
            data-testid={`t--partial-export-modal-widget-select-${widget.widgetId}`}
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

  const handleSelectAllClick = (checked: boolean) => {
    const prevSelectedWidgetIds = [...selectedWidgetIds];
    widgetList.forEach((widget) => {
      toggleNestedChildrenSelection(widget, prevSelectedWidgetIds, checked);
    });
    updateSelectedWidgets(prevSelectedWidgetIds);
    updateSelectAllChecked(checked);
  };
  return (
    <CheckboxWrapper data-testid="t--partialExportModal-widgetsSection">
      <Checkbox
        className="mb-4"
        data-testid="t--partial-export-modal-widget-select-all"
        isSelected={selectAllchecked}
        onChange={handleSelectAllClick}
      >
        <Text kind="body-m" renderAs="p">
          Select All
        </Text>
      </Checkbox>
      <CheckBoxGrid>
        {widgetList.map((widget) => renderWidget(widget, 0, false))}
      </CheckBoxGrid>
    </CheckboxWrapper>
  );
}
