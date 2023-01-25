import { Colors } from "constants/Colors";
import classNames from "classnames";
import React from "react";
import { useSelector } from "react-redux";
import {
  getCommonWidgets,
  previewModeSelector,
} from "selectors/editorSelectors";
import styled from "styled-components";
import { generateReactKey } from "utils/generators";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { WidgetCardProps } from "widgets/BaseWidget";
import WidgetPaneTrigger from "./WidgetPaneCTA";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { TooltipComponent } from "design-system-old";

const Wrapper = styled.div`
  height: ${(props) => props.theme.widgetTopBar};
  width: 100%;
  background-color: white;
  border-bottom: 1px solid ${Colors.GRAY_200};
`;

const WidgetWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: ${(props) => props.theme.widgetTopBar};
  :hover {
    background-color: ${Colors.GRAY_100};
    cursor: grab;
  }
  :active {
    background-color: ${Colors.GREY_200};
  }
`;

// To make the icons dimensions look the same
const WIDGET_ICON_SIZE: Record<string, number> = {
  TEXT_WIDGET: 5,
  TABLE_WIDGET_V2: 4,
  BUTTON_WIDGET: 7,
  INPUT_WIDGET_V2: 5,
  CONTAINER_WIDGET: 4,
};

function WidgetTopBar() {
  const widgets = useSelector(getCommonWidgets);
  const { setDraggingNewWidget } = useWidgetDragResize();
  const { deselectAll } = useWidgetSelection();
  const isPreviewMode = useSelector(previewModeSelector);
  const guidedTour = useSelector(inGuidedTour);
  const showPopularWidgets = !guidedTour;

  const onDragStart = (e: any, widget: WidgetCardProps) => {
    e.preventDefault();
    e.stopPropagation();
    deselectAll();
    setDraggingNewWidget &&
      setDraggingNewWidget(true, {
        ...widget,
        widgetId: generateReactKey(),
      });
  };

  return (
    <Wrapper
      className={classNames({
        hidden: isPreviewMode,
        flex: true,
      })}
    >
      <WidgetPaneTrigger />
      {showPopularWidgets && (
        <div className="flex flex-1	justify-center">
          {widgets.map((widget) => {
            return (
              <TooltipComponent content={widget.displayName} key={widget.type}>
                <WidgetWrapper
                  data-cy={`popular-widget-${widget.type}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, widget)}
                >
                  <img
                    className={`w-${WIDGET_ICON_SIZE[widget.type]} h-${
                      WIDGET_ICON_SIZE[widget.type]
                    }`}
                    src={widget.icon}
                  />
                </WidgetWrapper>
              </TooltipComponent>
            );
          })}
        </div>
      )}
    </Wrapper>
  );
}

export default WidgetTopBar;
