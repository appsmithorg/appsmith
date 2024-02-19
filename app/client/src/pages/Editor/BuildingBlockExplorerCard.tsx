import { Text } from "design-system";
import React from "react";
import styled from "styled-components";
import type { WidgetCardProps } from "widgets/BaseWidget";
import { BetaLabel } from "./WidgetCard";

interface CardProps {
  details: WidgetCardProps;
}

const Wrapper = styled.div`
  border-radius: var(--ads-v2-border-radius);
  border: none;
  position: relative;
  min-height: 70px;
  background-color: #f8fafc;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
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
    padding: 2px 1px;
  }

  &:hover {
    background: var(--ads-v2-color-bg-subtle);
  }

  & i {
    font-family: ${(props) => props.theme.fonts.text};
    font-size: ${(props) => props.theme.fontSizes[7]}px;
  }
`;

const StyledIconImg = styled.img`
  width: 56px;
  height: 52px;
  margin: 12px 6px 0;
`;

const BuildingBlockExplorerCard = (props: CardProps) => {
  const type = `${props.details.type.split("_").join("").toLowerCase()}`;
  const className = `t--widget-card-draggable t--widget-card-draggable-${type}`;

  const onDragStart = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };
  return (
    <Wrapper
      className={className}
      data-guided-tour-id={`widget-card-${type}`}
      draggable
      id={`widget-card-draggable-${type}`}
      onDragStart={onDragStart}
    >
      <div className="gap-2">
        <StyledIconImg className="w-6 h-6" src={props.details.icon} />

        <Text kind="body-s" style={{ fontWeight: 500 }}>
          {props.details.displayName}
        </Text>
        {props.details.isBeta && <BetaLabel>Beta</BetaLabel>}
      </div>
    </Wrapper>
  );
};

export default BuildingBlockExplorerCard;
