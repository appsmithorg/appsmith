import React from "react";
import { WidgetCardProps } from "widgets/BaseWidget";
import styled from "styled-components";
import { WidgetIcons } from "icons/WidgetIcons";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { generateReactKey } from "utils/generators";
import { Colors } from "constants/Colors";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";

type CardProps = {
  details: WidgetCardProps;
};

export const Wrapper = styled.div`
  padding: 10px 5px 10px 5px;
  border-radius: 0px;
  border: none;
  position: relative;
  color: ${Colors.ALTO};
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
    color: ${Colors.WHITE};
    background: ${Colors.TUNDORA};
    cursor: grab;
    color: ${Colors.WHITE};
    svg {
      path {
        fill: ${Colors.WHITE};
      }
    }
  }
  & i {
    font-family: ${(props) => props.theme.fonts.text};
    font-size: ${(props) => props.theme.fontSizes[7]}px;
  }
`;

export const BetaLabel = styled.div`
  font-size: 10px;
  background: ${Colors.TUNDORA};
  margin-top: 3px;
  padding: 2px 4px;
  border-radius: 3px;
  position: absolute;
  top: 0;
  right: -2%;
`;

export const IconLabel = styled.h5`
  text-align: center;
  margin: 0;
  text-transform: uppercase;
  font-weight: ${(props) => props.theme.fontWeights[1]};
  flex-shrink: 1;
  font-size: ${(props) => props.theme.fontSizes[1]}px;
  line-height: ${(props) => props.theme.lineHeights[2]}px;
  &::selection {
    background: none;
  }
`;

function WidgetCard(props: CardProps) {
  const { setDraggingNewWidget } = useWidgetDragResize();
  const { deselectAll } = useWidgetSelection();

  const onDragStart = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    deselectAll();
    AnalyticsUtil.logEvent("WIDGET_CARD_DRAG", {
      widgetType: props.details.type,
      widgetName: props.details.widgetCardName,
    });
    setDraggingNewWidget &&
      setDraggingNewWidget(true, {
        ...props.details,
        widgetId: generateReactKey(),
      });
  };
  const iconType: string = props.details.type;
  const Icon = WidgetIcons[iconType];
  const className = `t--widget-card-draggable-${props.details.type
    .split("_")
    .join("")
    .toLowerCase()}`;
  return (
    <Wrapper className={className} draggable onDragStart={onDragStart}>
      <div>
        <Icon />
        <IconLabel>{props.details.widgetCardName}</IconLabel>
        {props.details.isBeta && <BetaLabel>Beta</BetaLabel>}
      </div>
    </Wrapper>
  );
}

export default WidgetCard;
