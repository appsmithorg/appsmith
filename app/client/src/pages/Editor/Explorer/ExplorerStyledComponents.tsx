import React from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import {
  HTTP_METHODS,
  HTTP_METHOD_COLOR_MAP,
} from "constants/ApiEditorConstants";

export const EntityTogglesWrapper = styled.div`
  width: ${props => props.theme.fontSizes[5]}px;
  height: ${props => props.theme.fontSizes[5]}px;
  font-size: ${props => props.theme.fontSizes[5]}px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${Colors.SLATE_GRAY};
  svg,
  svg path {
    fill: ${Colors.SLATE_GRAY};
  }
  &:hover {
    background: ${Colors.SHARK};
    svg,
    svg path {
      fill: ${Colors.WHITE};
    }
    color: ${Colors.WHITE};
  }
`;

export const CreateIcon = (props: {
  className: string;
  onClick: (e: any) => void;
}) => {
  return (
    <EntityTogglesWrapper className={props.className} onClick={props.onClick}>
      <span>+</span>
    </EntityTogglesWrapper>
  );
};

const StyledTag = styled.div<{ color: string }>`
  font-size: 8px;
  width: 40px;
  font-weight: 700;
  color: #fff;
  background: ${props => props.color};
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const MethodTag = (props: { type: typeof HTTP_METHODS[number] }) => {
  return (
    <StyledTag color={HTTP_METHOD_COLOR_MAP[props.type]}>
      {props.type}
    </StyledTag>
  );
};
