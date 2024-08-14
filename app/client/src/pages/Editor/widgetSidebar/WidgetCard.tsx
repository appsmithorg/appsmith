import React from "react";
import type { WidgetCardProps } from "widgets/BaseWidget";
import styled from "styled-components";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { generateReactKey } from "utils/generators";
import { Text } from "@appsmith/ads";
import { BUILDING_BLOCK_EXPLORER_TYPE } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import { noop } from "utils/AppsmithUtils";

export interface CardProps {
  details: WidgetCardProps;
}

export const Wrapper = styled.div`
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
  margin-bottom: 0px;
  text-align: center;

  & span {
    padding-left: var(--ads-v2-spaces-3);
    padding-right: var(--ads-v2-spaces-3);
    color: var(--ads-v2-color-fg);
    font-weight: 400;
    line-height: 1.2;
    padding-bottom: var(--ads-v2-spaces-3);
  }

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
`;

const ThumbnailWrapper = styled.div<{ height: number; width: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
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

const THUMBNAIL_HEIGHT = 76;
const THUMBNAIL_WIDTH = 72;

function WidgetCardComponent({
  details,
  onDragStart = noop,
}: {
  details: WidgetCardProps;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDragStart?: (e: any) => void;
}) {
  const type = `${details.type.split("_").join("").toLowerCase()}`;
  const className = `t--widget-card-draggable t--widget-card-draggable-${type}`;
  const { ThumbnailCmp } = details;

  return (
    <Wrapper
      className={className}
      data-guided-tour-id={`widget-card-${type}`}
      draggable
      id={`widget-card-draggable-${type}`}
      onDragStart={onDragStart}
    >
      <ThumbnailWrapper height={THUMBNAIL_HEIGHT} width={THUMBNAIL_WIDTH}>
        {details.thumbnail && <img src={details.thumbnail} />}
        {ThumbnailCmp && <ThumbnailCmp />}
      </ThumbnailWrapper>
      <Text kind="body-s">{details.displayName}</Text>
      {details.isBeta && <BetaLabel>Beta</BetaLabel>}
    </Wrapper>
  );
}

function WidgetCard(props: CardProps) {
  const applicationId = useSelector(getCurrentApplicationId);
  const workspaceId = useSelector(getCurrentWorkspaceId);
  const { setDraggingNewWidget } = useWidgetDragResize();

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDragStart = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (props.details.type === BUILDING_BLOCK_EXPLORER_TYPE) {
      AnalyticsUtil.logEvent("DRAG_BUILDING_BLOCK_INITIATED", {
        applicationId,
        workspaceId,
        source: "explorer",
        eventData: {
          buildingBlockName: props.details.displayName,
        },
      });
    } else {
      AnalyticsUtil.logEvent("WIDGET_CARD_DRAG", {
        widgetType: props.details.type,
        widgetName: props.details.displayName,
      });
    }
    setDraggingNewWidget &&
      setDraggingNewWidget(true, {
        ...props.details,
        widgetId: generateReactKey(),
      });
  };

  return (
    <WidgetCardComponent details={props.details} onDragStart={onDragStart} />
  );
}

export default WidgetCard;
