import React from "react";
import styled, { withTheme } from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { Theme } from "constants/DefaultTheme";

const Container = styled.div`
  display: flex;
  cursor: pointer;
  margin-right: ${(props) => props.theme.spaces[4]}px;
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
      unresolved: unresolvedColor,
      resolvedFill: resolvedFillColor,
      unresolvedFill: unresolvedFillColor,
      resolvedPath: resolvedPathColor,
    } = theme.colors.comments;

    const strokeColorCircle = resolved ? resolvedColor : unresolvedColor;
    const strokeColorPath = resolved ? resolvedPathColor : unresolvedColor;
    const fillColor = resolved ? resolvedFillColor : unresolvedFillColor;

    const _handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleClick();
    };

    return (
      <Container onClick={_handleClick}>
        <StyledResolveIcon
          fillColor={fillColor}
          strokeColorCircle={strokeColorCircle}
          strokeColorPath={strokeColorPath}
          name="oval-check"
          size={IconSize.XXL}
        />
      </Container>
    );
  },
);

export default ResolveCommentButton;
