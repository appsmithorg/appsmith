import React from "react";
import styled from "styled-components";
import { TabProp } from "./Tabs";
import { getTypographyByKey, Theme } from "constants/DefaultTheme";
import { Colors } from "../../constants/Colors";

type WrapperProps = {
  selected: boolean;
  vertical: boolean;
  theme: Theme;
};

const getSelectedStyles = (props: WrapperProps) =>
  props.selected
    ? `color: ${props.theme.colors.tabItemBackgroundFill.highlightTextColor};
      font-weight: 500;
      border-bottom: 2px solid ${props.theme.colors.info.light};
     `
    : `color: ${props.theme.colors.tabItemBackgroundFill.textColor};
      `;

const Wrapper = styled.div<WrapperProps>`
  display: flex;
  ${(props) => getTypographyByKey(props, "p1")};
  ${(props) => getSelectedStyles(props)};

  &:hover,
  &:focus {
    color: ${(props) =>
      props.theme.colors.tabItemBackgroundFill.highlightTextColor};
  }

  padding: ${(props) => `${props.theme.spaces[5]}px 0px`};

  width: 100%;
`;

export default function TabItemBackgroundFill(props: {
  tab: TabProp;
  selected: boolean;
  vertical: boolean;
}) {
  const { selected, tab, vertical } = props;
  return (
    <Wrapper key={tab.title} selected={selected} vertical={vertical}>
      {tab.title}
    </Wrapper>
  );
}
