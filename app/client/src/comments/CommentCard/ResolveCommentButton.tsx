import React from "react";
import styled, { withTheme } from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { Theme } from "constants/DefaultTheme";
import Tooltip from "components/ads/Tooltip";
import {
  createMessage,
  RESOLVE_THREAD,
  RESOLVED_THREAD,
} from "@appsmith/constants/messages";
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
  && svg {
    fill: ${(props) => props.strokeColorCircle};
  }
  ${(props) =>
    !props.resolved &&
    `
  &:hover svg {
    fill: ${Colors.CHARCOAL};
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
        <Tooltip
          content={createMessage(resolved ? RESOLVED_THREAD : RESOLVE_THREAD)}
          hoverOpenDelay={1000}
        >
          <StyledResolveIcon
            fillColor={fillColor}
            keepColors
            name={resolved ? "oval-check-fill" : "oval-check"}
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
