import React from "react";
import styled from "styled-components";
import { getTypographyByKey } from "@appsmith/ads-old";
import type { Theme } from "constants/DefaultTheme";

interface WrapperProps {
  selected: boolean;
  vertical: boolean;
  theme: Theme;
}

const getFocusedStyles = (props: WrapperProps) => `
  background-color: ${props.theme.colors.tabItemBackgroundFill.highlightBackground};
  color: ${props.theme.colors.tabItemBackgroundFill.highlightTextColor};
  font-weight: 500;
`;

const Wrapper = styled.div<WrapperProps>`
  display: flex;
  ${getTypographyByKey("p1")}

  ${(props) =>
    props.selected
      ? getFocusedStyles(props)
      : `
      color: ${props.theme.colors.tabItemBackgroundFill.textColor};
    `};

  &:hover,
  &:focus {
    color: ${(props) =>
      props.theme.colors.tabItemBackgroundFill.highlightTextColor};}
  }

  padding: ${(props) =>
    `${props.theme.spaces[5] - 1}px ${props.theme.spaces[11]}px`};

  width: 100%;
`;

export default function TabItemBackgroundFill(props: {
  tab: {
    title: string;
  };
  selected: boolean;
  vertical: boolean;
}) {
  const { selected, tab, vertical } = props;

  return (
    <Wrapper selected={selected} vertical={vertical}>
      {tab.title}
    </Wrapper>
  );
}
