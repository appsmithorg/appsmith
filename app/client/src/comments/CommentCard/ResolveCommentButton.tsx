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

const StyledResolveIcon = styled(Icon)<{ strokeColor: string }>`
  & circle,
  & path {
    stroke: ${(props) => props.strokeColor};
  }
  && path {
    fill: transparent;
  }
`;

const ResolveCommentButton = withTheme(
  ({ handleClick, resolved, theme }: Props) => {
    const {
      resolved: resolvedColor,
      unresolved: unresolvedColor,
    } = theme.colors.comments;
    const strokeColor = resolved ? resolvedColor : unresolvedColor;
    return (
      <Container onClick={handleClick}>
        <StyledResolveIcon
          fillColor={"transparent"}
          name="oval-check"
          size={IconSize.XXL}
          strokeColor={strokeColor}
        />
      </Container>
    );
  },
);

export default ResolveCommentButton;
