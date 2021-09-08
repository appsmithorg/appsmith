import React from "react";
import styled, { withTheme } from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { Theme } from "constants/DefaultTheme";
import Tooltip from "components/ads/Tooltip";
import { createMessage, RESOLVE_THREAD } from "constants/messages";
import { Colors } from "constants/Colors";

const Container = styled.div`
  display: flex;
  cursor: pointer;
`;

type Props = {
  handleClick: () => void;
  resolved: boolean;
  theme: Theme;
};

const StyledResolveIcon = styled(Icon)<{
  resolved: boolean;
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
  ${(props) =>
    !props.resolved &&
    `
  &:hover circle,
  &:hover path {
    stroke: ${Colors.CHARCOAL};
  }
  `}
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

    const _handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleClick();
    };

    return (
      <Container onClick={_handleClick}>
        <Tooltip content={createMessage(RESOLVE_THREAD)}>
          <StyledResolveIcon
            fillColor={fillColor}
            keepColors
            name="oval-check"
            resolved={resolved}
            size={IconSize.XXL}
            strokeColorCircle={strokeColorCircle}
            strokeColorPath={strokeColorPath}
          />
        </Tooltip>
      </Container>
    );
  },
);

export default ResolveCommentButton;
