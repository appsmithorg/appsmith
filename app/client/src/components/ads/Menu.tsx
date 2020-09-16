import React, { ReactNode } from "react";
import { CommonComponentProps, Classes } from "./common";
import styled from "styled-components";
import { Popover } from "@blueprintjs/core/lib/esm/components/popover/popover";
import { Position } from "@blueprintjs/core/lib/esm/common/position";

type MenuProps = CommonComponentProps & {
  children?: ReactNode[];
  target: JSX.Element;
  position?: Position;
  onOpening?: (node: HTMLElement) => void;
  onClosing?: (node: HTMLElement) => void;
};

const MenuWrapper = styled.div`
  width: 234px;
  background: ${props => props.theme.colors.blackShades[3]};
  box-shadow: 0px 12px 28px rgba(0, 0, 0, 0.75);
  padding: ${props => props.theme.spaces[5]}px 0px;
`;

const MenuOption = styled.div`
  color: ${props => props.theme.colors.blackShades[6]};
  font-family: ${props => props.theme.fonts[3]};
  .${Classes.ICON} {
    path {
      fill: ${props => props.theme.colors.blackShades[6]};
    }
  }
`;

const Menu = (props: MenuProps) => {
  return (
    <Popover
      minimal
      position={props.position || Position.BOTTOM}
      onOpening={props.onOpening}
      onClosing={props.onClosing}
      className={props.className}
      data-cy={props.cypressSelector}
    >
      {props.target}
      <MenuWrapper>
        {props.children &&
          props.children.map((el, index) => {
            return <MenuOption key={index}>{el}</MenuOption>;
          })}
      </MenuWrapper>
    </Popover>
  );
};

export default Menu;
