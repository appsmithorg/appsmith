import * as React from "react";
import { Icon, Position } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import styled from "styled-components";
import Rating from "react-rating";
import _ from "lodash";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { RateSize, RATE_SIZES } from "constants/WidgetConstants";
import TooltipComponent from "components/ads/Tooltip";

/*
  Note:
  -webkit-line-clamp may seem like a wierd way to doing this
  however, it is getting more and more useful with more browser support.
  It suffices for our target browsers
  More info: https://css-tricks.com/line-clampin/
*/

// export const RateContainer = styled.div`
//   && {
//     height: 100%;
//     width: 100%;
//   }
// `;
export const RateContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: center;
  overflow: auto;
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

class RateComponent extends React.Component<RateComponentProps> {
  render() {
    const {
      inactiveColor,
      isAllowHalf,
      maxCount,
      onValueChanged,
      readonly,
      size,
      value,
    } = this.props;

    return (
      <RateContainer>
        <Rating
          emptySymbol={
            <Star
              color={inactiveColor}
              icon={IconNames.STAR}
              iconSize={RATE_SIZES[size]}
            />
          }
          fractions={isAllowHalf ? 2 : 1}
          fullSymbol={renderStarsWithTooltip(this.props)}
          initialRating={value}
          onChange={onValueChanged}
          readonly={readonly}
          stop={maxCount}
        />
      </RateContainer>
    );
  }
}

export default RateComponent;
