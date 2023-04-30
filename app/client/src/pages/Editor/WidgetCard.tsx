import React from "react";
import type { WidgetCardProps } from "widgets/BaseWidget";
import styled from "styled-components";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { generateReactKey } from "utils/generators";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { IconWrapper } from "constants/IconConstants";

type CardProps = {
  details: WidgetCardProps;
};

export const Wrapper = styled.div`
  padding: 10px 5px 10px 5px;
  border-radius: var(--ads-v2-border-radius);
  border: none;
  position: relative;
  color: var(--ads-v2-color-fg);
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  img {
    cursor: grab;
  }

  & > div {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  &:hover {
    background: var(--ads-v2-color-bg-subtle);
  }

  & i {
    font-family: ${(props) => props.theme.fonts.text};
    font-size: ${(props) => props.theme.fontSizes[7]}px;
  }
`;

export const BetaLabel = styled.div`
  font-size: 10px;
  background: var(--ads-v2-color-bg-emphasis);
  margin-top: 3px;
  padding: 2px 4px;
  border-radius: 3px;
  position: absolute;
  top: 0;
  right: -2%;
`;

export const IconLabel = styled.h5`
  min-height: 32px;
  text-align: center;
  margin: 0;
  /* text-transform: uppercase; */
  font-weight: ${(props) => props.theme.fontWeights[1]};
  flex-shrink: 1;
  font-size: 11px;
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
    AnalyticsUtil.logEvent("WIDGET_CARD_DRAG", {
      widgetType: props.details.type,
      widgetName: props.details.displayName,
    });
    setDraggingNewWidget &&
      setDraggingNewWidget(true, {
        ...props.details,
        widgetId: generateReactKey(),
      });
    deselectAll();
  };

  const type = `${props.details.type.split("_").join("").toLowerCase()}`;
  const className = `t--widget-card-draggable-${type}`;
  return (
    <Wrapper
      className={className}
      data-guided-tour-id={`widget-card-${type}`}
      draggable
      onDragStart={onDragStart}
    >
      <div>
        <IconWrapper>
          <img className="w-6 h-6" src={props.details.icon} />
        </IconWrapper>
        <IconLabel>{props.details.displayName}</IconLabel>
        {props.details.isBeta && <BetaLabel>Beta</BetaLabel>}
      </div>
    </Wrapper>
  );
}

export default WidgetCard;
