import { selectWidgetsForCurrentPage } from "@appsmith/selectors/entitiesSelector";
import { Checkbox } from "design-system";
import React from "react";
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

function WidgetSelector({ widgets }: { widgets: CanvasStructure[] }) {
  function renderWidget(widget: CanvasStructure, level = 0) {
    return (
      <div style={{ marginLeft: level * 8 }}>
        <CheckboxContainer>
          <Checkbox>{widget.widgetName}</Checkbox>
        </CheckboxContainer>
        {widget.children?.map((child) => renderWidget(child, level + 1))}
      </div>
    );
  }

  return (
    <CheckboxWrapper>
      {widgets.map((widget) => renderWidget(widget))}
    </CheckboxWrapper>
  );
}

const CheckboxContainer = styled.div`
  margin-bottom: 8px;
`;
