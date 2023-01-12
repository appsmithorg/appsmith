import { Colors } from "constants/Colors";
import React from "react";
import { useSelector } from "react-redux";
import { getCommonWidgets } from "selectors/editorSelectors";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { generateReactKey } from "utils/generators";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { WidgetCardProps } from "widgets/BaseWidget";
import WidgetPaneTrigger from "./WidgetPaneCTA";

const Wrapper = styled.div`
  height: 40px;
  width: 100%;
  background-color: white;
  border-bottom: 1px solid ${Colors.GRAY_200};
`;

const WidgetWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  :hover {
    background-color: #f1f1f1;
    cursor: grab;
  }
  :active {
    background-color: #e7e7e7;
  }
`;

function WidgetTopBar() {
  const widgets = useSelector(getCommonWidgets);
  const { setDraggingNewWidget } = useWidgetDragResize();
  const { deselectAll } = useWidgetSelection();

  const onDragStart = (e: any, widget: WidgetCardProps) => {
    e.preventDefault();
    e.stopPropagation();
    deselectAll();
    AnalyticsUtil.logEvent("WIDGET_CARD_DRAG", {
      widgetType: widget.type,
      widgetName: widget.displayName,
    });
    setDraggingNewWidget &&
      setDraggingNewWidget(true, {
        ...widget,
        widgetId: generateReactKey(),
      });
  };

  return (
    <Wrapper className="flex">
      <WidgetPaneTrigger />
      <div className="flex flex-1 gap-6	justify-center">
        {widgets.map((widget) => {
          return (
            <WidgetWrapper
              key={widget.type}
              onDragStart={(e) => onDragStart(e, widget)}
            >
              <img className="w-4 h-4" src={widget.icon} />
            </WidgetWrapper>
          );
        })}
      </div>
    </Wrapper>
  );
}

export default WidgetTopBar;
