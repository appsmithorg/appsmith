import React, { useState } from "react";
import { useDrag, DragSourceMonitor, DragPreviewImage } from "react-dnd";
import blankImage from "assets/images/blank.png";
import { WidgetCardProps } from "widgets/BaseWidget";
import styled from "styled-components";
import { WidgetIcons } from "icons/WidgetIcons";
import {
  useWidgetDragResize,
  useShowPropertyPane,
} from "utils/hooks/dragResizeHooks";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { generateReactKey } from "utils/generators";

type CardProps = {
  details: WidgetCardProps;
};

export const Wrapper = styled.div`
  padding: 10px 5px 10px 5px;
  border-radius: ${props => props.theme.radii[1]}px;
  background: ${props => props.theme.colors.paneCard};
  border: 1px solid ${props => props.theme.colors.paneCard};
  color: ${props => props.theme.colors.textOnDarkBG};
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  & > div {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  &:hover {
    background: #fff;
    cursor: grab;
    color: ${props => props.theme.colors.textDefault};
    svg {
      path {
        fill: ${props => props.theme.colors.textDefault};
      }
      rect {
        stroke: ${props => props.theme.colors.textDefault};
      }
    }
  }
  & i {
    font-family: ${props => props.theme.fonts[2]};
    font-size: ${props => props.theme.fontSizes[7]}px;
  }
`;

export const IconLabel = styled.h5`
  text-align: center;
  margin: 0;
  text-transform: uppercase;
  font-weight: ${props => props.theme.fontWeights[1]};
  flex-shrink: 1;
  font-size: ${props => props.theme.fontSizes[1]}px;
  line-height: ${props => props.theme.lineHeights[1]}px;
`;

/* eslint-disable @typescript-eslint/no-unused-vars */
const WidgetCard = (props: CardProps) => {
  const { setIsDragging } = useWidgetDragResize();
  // Generate a new widgetId which can be used in the future for this widget.
  const [widgetId, setWidgetId] = useState(generateReactKey());
  const showPropertyPane = useShowPropertyPane();
  const [, drag, preview] = useDrag({
    item: { ...props.details, widgetId },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    begin: () => {
      AnalyticsUtil.logEvent("WIDGET_CARD_DRAG", {
        widgetType: props.details.type,
        widgetName: props.details.widgetCardName,
      });
      showPropertyPane && showPropertyPane(undefined);
      setIsDragging && setIsDragging(true);
    },
    end: (widget, monitor) => {
      AnalyticsUtil.logEvent("WIDGET_CARD_DROP", {
        widgetType: props.details.type,
        widgetName: props.details.widgetCardName,
        didDrop: monitor.didDrop(),
      });
      // We've finished dragging, generate a new widgetId to be used for next drag.
      setWidgetId(generateReactKey());
      setIsDragging && setIsDragging(false);
    },
  });

  const iconType: string = props.details.type;
  const Icon = WidgetIcons[iconType];
  const className = `t--widget-card-draggable-${props.details.type
    .split("_")
    .join("")
    .toLowerCase()}`;
  return (
    <React.Fragment>
      <DragPreviewImage connect={preview} src={blankImage} />
      <Wrapper ref={drag} className={className}>
        <div>
          <Icon />
          <IconLabel>{props.details.widgetCardName}</IconLabel>
        </div>
      </Wrapper>
    </React.Fragment>
  );
};

export default WidgetCard;
