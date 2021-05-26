import React from "react";
import styled, { withTheme } from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { Theme } from "constants/DefaultTheme";
import { TourType } from "entities/Tour";
import useProceedToNextTourStep from "utils/hooks/useProceedToNextTourStep";

const Container = styled.div`
  display: flex;
  cursor: pointer;
  margin-left: ${(props) => props.theme.spaces[2]}px;
`;

type Props = {
  handleClick: () => void;
  resolved: boolean;
  theme: Theme;
};

const StyledResolveIcon = styled(Icon)<{
  strokeColorCircle: string;
  strokeColorPath: string;
  fillColor: string;
}>`
  & circle {
    stroke: ${(props) => props.strokeColorCircle};
  }
  && path {
    stroke: ${(props) => props.strokeColorPath};
    fill: transparent;
  }
  && svg {
    fill: ${(props) => props.fillColor};
  }
`;

const ResolveCommentButton = withTheme(
  ({ handleClick, resolved, theme }: Props) => {
    const {
      resolved: resolvedColor,
      resolvedFill: resolvedFillColor,
      resolvedPath: resolvedPathColor,
      unresolved: unresolvedColor,
      unresolvedFill: unresolvedFillColor,
    } = theme.colors.comments;

    const strokeColorCircle = resolved ? resolvedColor : unresolvedColor;
    const strokeColorPath = resolved ? resolvedPathColor : unresolvedColor;
    const fillColor = resolved ? resolvedFillColor : unresolvedFillColor;

    const proceedToNextTourStep = useProceedToNextTourStep(
      TourType.COMMENTS_TOUR,
      2,
    );

    const _handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleClick();
      proceedToNextTourStep();
    };

    return (
      <Container onClick={_handleClick}>
        <StyledResolveIcon
          fillColor={fillColor}
          keepColors
          name="oval-check"
          size={IconSize.XXL}
          strokeColorCircle={strokeColorCircle}
          strokeColorPath={strokeColorPath}
        />
      </Container>
    );
  },
);

export default ResolveCommentButton;
