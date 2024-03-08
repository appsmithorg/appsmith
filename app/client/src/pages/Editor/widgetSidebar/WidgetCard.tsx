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

export const Wrapper = styled.div<{ isThumbnail?: boolean }>`
  border-radius: var(--ads-v2-border-radius);
  border: none;
  position: relative;
  color: var(--ads-v2-color-fg);
  min-height: 70px;
  display: flex;
  justify-content: start;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2px;
  text-align: center;

  img {
    cursor: grab;
  }

  &:hover {
    background: var(--ads-v2-color-bg-subtle);
  }

  & i {
    font-family: ${(props) => props.theme.fonts.text};
    font-size: ${(props) => props.theme.fontSizes[7]}px;
  }

  ${(props) =>
    props.isThumbnail &&
    `margin-bottom: 0px;

    & span {
      padding-left: var(--ads-v2-spaces-3);
      padding-right: var(--ads-v2-spaces-3);
      color: var(--ads-v2-color-fg);
      font-weight: 600;
      line-height: 1.2;
      padding-bottom: var(--ads-v2-spaces-3);
    }


    `}
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

// NOTE: Widget Card can have a thumbnail or an icon. The thumbnail and icon has different sizes.
// If there is no thumbnail, the icon is used and the size is ICON_SIZE
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
  const className = `t--widget-card-draggable t--widget-card-draggable-${type} ${
    !Boolean(props.details.thumbnail) ? "pt-2 gap-2 mt-2" : ""
  }`;

  return (
    <Wrapper
      className={className}
      data-guided-tour-id={`widget-card-${type}`}
      draggable
      id={`widget-card-draggable-${type}`}
      // isThumbnail is used to add conditional styles for widget that renders thumbnail on widget card
      isThumbnail={Boolean(props.details.thumbnail)}
      onDragStart={onDragStart}
    >
      <IconWrapper
        // if widget has a thumbnail, use thumbnail dimensions, else use icon dimensions
        height={props.details.thumbnail ? THUMBNAIL_HEIGHT : ICON_SIZE}
        width={props.details.thumbnail ? THUMBNAIL_WIDTH : ICON_SIZE}
      >
        <img src={props.details.thumbnail ?? props.details.icon} />
      </IconWrapper>
      <Text kind="body-s">{props.details.displayName}</Text>
      {props.details.isBeta && <BetaLabel>Beta</BetaLabel>}
    </Wrapper>
  );
}

export default WidgetCard;
