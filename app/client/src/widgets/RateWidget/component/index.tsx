import React, { useState, useEffect } from "react";
import { Icon, Position } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import styled from "styled-components";
import Rating from "react-rating";
import _ from "lodash";

import { RateSize, RATE_SIZES } from "../constants";
import TooltipComponent from "components/ads/Tooltip";
import { disable } from "constants/DefaultTheme";
import { ComponentProps } from "widgets/BaseComponent";
import { Colors } from "constants/Colors";

/*
  Note:
  -webkit-line-clamp may seem like a wierd way to doing this
  however, it is getting more and more useful with more browser support.
  It suffices for our target browsers
  More info: https://css-tricks.com/line-clampin/
*/

interface RateContainerProps {
  isDisabled: boolean;
  scrollable: boolean;
}

export const RateContainer = styled.div<RateContainerProps>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  align-content: flex-start;
  overflow: auto;

  > span {
    align-self: ${(props) => (props.scrollable ? "flex-start" : "center")};
  }

  ${({ isDisabled }) => isDisabled && disable}
`;

export const Star = styled(Icon)`
  padding: ${(props) =>
    props.iconSize === 12 ? 2.92 : props.iconSize === 16 ? 4.37 : 4.93}px;
`;

export interface RateComponentProps extends ComponentProps {
  value: number;
  isLoading: boolean;
  maxCount: number;
  size: RateSize;
  onValueChanged: (value: number) => void;
  tooltips?: Array<string>;
  activeColor?: string;
  inactiveColor?: string;
  isAllowHalf?: boolean;
  readonly?: boolean;
  leftColumn?: number;
  rightColumn?: number;
  topRow?: number;
  bottomRow?: number;
}

function renderStarsWithTooltip(props: RateComponentProps) {
  const rateTooltips = props.tooltips || [];
  const rateTooltipsCount = rateTooltips.length;
  const deltaCount = props.maxCount - rateTooltipsCount;
  if (rateTooltipsCount === 0) {
    return (
      <Star
        color={props.activeColor}
        icon={IconNames.STAR}
        iconSize={RATE_SIZES[props.size]}
      />
    );
  }
  const starWithTooltip = rateTooltips.map((tooltip) => (
    <TooltipComponent content={tooltip} key={tooltip} position={Position.TOP}>
      <Star
        color={props.activeColor}
        icon={IconNames.STAR}
        iconSize={RATE_SIZES[props.size]}
      />
    </TooltipComponent>
  ));
  const starWithoutTooltip = _.times(deltaCount, (num: number) => (
    <Star
      color={props.activeColor}
      icon={IconNames.STAR}
      iconSize={RATE_SIZES[props.size]}
      key={num}
    />
  ));

  return _.concat(starWithTooltip, starWithoutTooltip);
}

function RateComponent(props: RateComponentProps) {
  const rateContainerRef = React.createRef<HTMLDivElement>();

  const {
    bottomRow,
    inactiveColor,
    isAllowHalf,
    isDisabled,
    leftColumn,
    maxCount,
    onValueChanged,
    readonly,
    rightColumn,
    size,
    topRow,
    value,
  } = props;

  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    const rateContainerElement = rateContainerRef.current;
    if (
      rateContainerElement &&
      rateContainerElement.scrollHeight > rateContainerElement.clientHeight
    ) {
      setScrollable(true);
    } else {
      setScrollable(false);
    }
  }, [leftColumn, rightColumn, topRow, bottomRow, maxCount, size]);

  return (
    <RateContainer
      isDisabled={Boolean(isDisabled)}
      ref={rateContainerRef}
      scrollable={scrollable}
    >
      <Rating
        emptySymbol={
          <Star
            color={inactiveColor || Colors.ALTO_3}
            icon={IconNames.STAR}
            iconSize={RATE_SIZES[size]}
          />
        }
        fractions={isAllowHalf ? 2 : 1}
        fullSymbol={renderStarsWithTooltip(props)}
        initialRating={value}
        onChange={onValueChanged}
        readonly={readonly}
        stop={maxCount}
      />
    </RateContainer>
  );
}

export default RateComponent;
