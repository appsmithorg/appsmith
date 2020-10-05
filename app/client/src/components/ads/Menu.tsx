import React, { ReactNode } from "react";
import { CommonComponentProps } from "./common";
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
  background: ${props => props.theme.colors.menu.background};
  box-shadow: 0px 12px 28px ${props => props.theme.colors.menu.shadow};
`;

const MenuOption = styled.div`
  font-family: ${props => props.theme.fonts[3]};
`;

const Menu = (props: MenuProps) => {
  return (
    <Popover
      minimal
      position={props.position || Position.BOTTOM}
      onOpening={props.onOpening}
      onClosing={props.onClosing}
      className={props.className}
      portalClassName={props.className}
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
