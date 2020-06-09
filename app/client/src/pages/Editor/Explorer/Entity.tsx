import React, { ReactNode, useState } from "react";
import { Icon, Collapse, Classes } from "@blueprintjs/core";
import styled from "styled-components";
import { Colors } from "constants/Colors";

const EntityItem = styled.div`
  height: 30px;
  font-size: ${props => props.theme.fontSizes[3]}px;
  line-height: ${props => props.theme.lineHeights[2]}px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: ${props => props.theme.spaces[3]}px;
  border-radius: 2px;
  &:hover {
    background: ${Colors.MAKO};
  }
  & {
    .${Classes.ICON} {
      margin-right: ${props => props.theme.spaces[2]}px;
    }
  }
  cursor: pointer;
  & > div {
    margin-right: ${props => props.theme.spaces[3]}px;
  }
`;
const StyledCollapse = styled(Collapse)<{ step: number }>`
  & {
    .${Classes.COLLAPSE_BODY} {
      margin-left: ${props => props.theme.spaces[4] * props.step}px;
    }
  }
`;

export type EntityProps = {
  name: string;
  children?: ReactNode;
  icon: ReactNode;
  step: number;
  disabled?: boolean;
  action: () => void;
};

export const Entity = (props: EntityProps) => {
  const [isOpen, open] = useState(false);
  const handleClick = () => {
    props.action();
    (props.disabled === undefined || !props.disabled) && open(!isOpen);
  };
  const collapseIcon = isOpen ? (
    <Icon icon="chevron-down" />
  ) : (
    <Icon icon="chevron-right" />
  );
  return (
    <React.Fragment>
      <EntityItem onClick={handleClick}>
        {props.children && collapseIcon}
        {props.icon} {props.name}
      </EntityItem>
      {props.children && (
        <StyledCollapse step={props.step + 1} isOpen={isOpen}>
          {props.children}
        </StyledCollapse>
      )}
    </React.Fragment>
  );
};

export default Entity;
