import React from "react";
import { Icon } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import styled from "styled-components";
import Rating from "react-rating";
import _ from "lodash";

import { RateSize, RATE_SIZES } from "../constants";
import { TooltipComponent } from "design-system";
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
}

export const RateContainer = styled.div<RateContainerProps>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  align-content: flex-start;
  overflow: auto;

  > span {
    display: flex !important;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    height: auto;

    & > span {
      height: 100%;

      & > span {
        height: 100%;
        padding: 0;
        display: flex !important;
        align-items: center;
      }
    }
  }

  ${({ isDisabled }) => isDisabled && disable}
`;

export const Star = styled(Icon)``;

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
    <TooltipComponent content={tooltip} key={tooltip} position="top">
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
    inactiveColor,
    isAllowHalf,
    isDisabled,
    maxCount,
    onValueChanged,
    readonly,
    size,
    value,
  } = props;

  return (
    <RateContainer isDisabled={Boolean(isDisabled)} ref={rateContainerRef}>
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
