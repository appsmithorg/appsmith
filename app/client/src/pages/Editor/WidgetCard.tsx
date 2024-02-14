import React from "react";
import type { WidgetCardProps } from "widgets/BaseWidget";
import styled from "styled-components";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { generateReactKey } from "utils/generators";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { IconWrapper } from "constants/IconConstants";
import { Text } from "design-system";
import { useIsEditorPaneSegmentsEnabled } from "./IDE/hooks";

interface CardProps {
  details: WidgetCardProps;
}

export const Wrapper = styled.div<{ isThumbnail?: boolean }>`
  border-radius: var(--ads-v2-border-radius);
  border: none;
  position: relative;
  color: var(--ads-v2-color-fg);
  min-height: 70px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;

  ${(props) =>
    props.isThumbnail &&
    `background-color: var(--ads-v2-color-gray-50);
    padding: var(--ads-v2-spaces-3);
    
    &  span {
      padding-left: var(--ads-v2-spaces-3);
      padding-right: var(--ads-v2-spaces-3);
      color: var(--ads-v2-color-fg);
      font-weight: 600;
    }`}

  img {
    cursor: grab;
  }

  & > div {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: 2px;
    text-align: center;
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

const ICON_SIZE = 24;
const THUMBNAIL_HEIGHT = 76;
const THUMBNAIL_WIDTH = 72;

function WidgetCard(props: CardProps) {
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
  const className = `t--widget-card-draggable t--widget-card-draggable-${type}`;

  return (
    <Wrapper
      className={className}
      data-guided-tour-id={`widget-card-${type}`}
      draggable
      id={`widget-card-draggable-${type}`}
      isThumbnail={Boolean(props.details.thumbnail)}
      onDragStart={onDragStart}
    >
      <div className="">
        <IconWrapper
          height={props.details.thumbnail ? THUMBNAIL_HEIGHT : ICON_SIZE}
          width={props.details.thumbnail ? THUMBNAIL_WIDTH : ICON_SIZE}
        >
          <img src={props.details.thumbnail ?? props.details.icon} />
        </IconWrapper>
        <Text kind="body-s">{props.details.displayName}</Text>
        {props.details.isBeta && <BetaLabel>Beta</BetaLabel>}
      </div>
    </Wrapper>
  );
}

export default WidgetCard;
