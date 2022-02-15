import Icon from "components/ads/Icon";
import { Theme } from "constants/DefaultTheme";
import React from "react";
import styled, { withTheme } from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import { VIEW_LATEST, createMessage } from "@appsmith/constants/messages";

const Container = styled.div`
  position: absolute;
  right: 10px;
  bottom: 10px;
  cursor: pointer;
  color: ${(props) => props.theme.colors.comments.viewLatest};
  text-transform: uppercase;
  display: flex;
  ${(props) => getTypographyByKey(props, "btnMedium")}
  & .view-latest {
    margin-right: ${(props) => props.theme.spaces[1]}px;
  }
`;

const ScrollToLatest = withTheme(
  ({ scrollToBottom, theme }: { scrollToBottom: () => void; theme: Theme }) => {
    return (
      <Container onClick={scrollToBottom}>
        <span className="view-latest">{createMessage(VIEW_LATEST)}</span>
        <Icon
          fillColor={theme.colors.comments.viewLatest}
          hoverFillColor={theme.colors.comments.viewLatest}
          name="down-arrow-2"
        />
      </Container>
    );
  },
);

export default ScrollToLatest;
