import { Checkbox } from "design-system";
import WidgetIcon from "pages/Editor/Explorer/Widgets/WidgetIcon";
import React from "react";
import type { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import {
  CheckBoxGrid,
  CheckboxContainer,
  CheckboxWrapper,
} from "./StyledSheet";
import { getWidgetIdsForSelection } from "./partialExportUtils";

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
  selectedWidgetIds,
  updateSelectAllChecked,
  updateSelectedWidgets,
  widgetList,
}: WidgetSelectorProps) {
  const toggleNode = (node: CanvasStructure, checked: boolean) => {
    const prevSelectedWidgetIds = [...selectedWidgetIds];
    getWidgetIdsForSelection(node, prevSelectedWidgetIds, checked);
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
      <div style={{ marginLeft: level > 0 ? level + 8 : level }}>
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
      <CheckBoxGrid>
        {widgetList.map((widget) => renderWidget(widget, 0, false))}
      </CheckBoxGrid>
    </CheckboxWrapper>
  );
}
