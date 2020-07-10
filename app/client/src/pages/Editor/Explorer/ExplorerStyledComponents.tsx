import React from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
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
