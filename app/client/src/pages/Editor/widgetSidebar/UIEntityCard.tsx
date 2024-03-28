import React from "react";
import type { WidgetCardProps } from "widgets/BaseWidget";
import styled from "styled-components";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { generateReactKey } from "utils/generators";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { IconWrapper } from "constants/IconConstants";
import { Text } from "design-system";
import { useIsEditorPaneSegmentsEnabled } from "../IDE/hooks";

interface CardProps {
  details: WidgetCardProps;
}

export const Wrapper = styled.div`
  border-radius: var(--ads-v2-border-radius);
  border: none;
  position: relative;
  background-color: #f8fafc;
  color: var(--ads-v2-color-fg);
  min-height: 70px;
  display: flex;
  justify-content: start;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  flex-direction: column;
  align-items: center;
  margin-bottom: 0px;
  text-align: center;

  img {
    cursor: grab;
  }

  & span {
    padding-left: var(--ads-v2-spaces-3);
    padding-right: var(--ads-v2-spaces-3);
    color: var(--ads-v2-color-fg);
    font-weight: 600;
    line-height: 1.2;
    padding-bottom: var(--ads-v2-spaces-3);
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

const EntityIconWrapper = styled(IconWrapper)<{
  height: number;
  width: number;
}>`
  padding: 8px;
  justify-content: center;
`;

const THUMBNAIL_HEIGHT = 76;
const THUMBNAIL_WIDTH = 72;

function UIEntityCard(props: CardProps) {
  const { setDraggingNewWidget } = useWidgetDragResize();
  const { deselectAll } = useWidgetSelection();
  const isEditorPaneEnabled = useIsEditorPaneSegmentsEnabled();

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
    if (!isEditorPaneEnabled) {
      deselectAll();
    }
  };

  const type = `${props.details.type.split("_").join("").toLowerCase()}`;
  const className = `t--widget-card-draggable t--widget-card-draggable-${type} pt-2 gap-2 mt-2`;

  return (
    <Wrapper
      className={className}
      data-guided-tour-id={`widget-card-${type}`}
      draggable
      id={`widget-card-draggable-${type}`}
      onDragStart={onDragStart}
    >
      <EntityIconWrapper height={THUMBNAIL_HEIGHT} width={THUMBNAIL_WIDTH}>
        <img src={props.details.thumbnail ?? props.details.icon} />
      </EntityIconWrapper>
      <Text kind="body-s">{props.details.displayName}</Text>
      {props.details.isBeta && <BetaLabel>Beta</BetaLabel>}
    </Wrapper>
  );
}

export default UIEntityCard;
