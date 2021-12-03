import React, { ReactNode } from "react";
import { CommonComponentProps } from "./common";
import styled from "styled-components";
import { Popover } from "@blueprintjs/core/lib/esm/components/popover/popover";
import { Position } from "@blueprintjs/core/lib/esm/common/position";
import { PopperModifiers } from "@blueprintjs/core";

export type MenuProps = CommonComponentProps & {
  children?: ReactNode[];
  target: JSX.Element;
  position?: Position;
  onOpening?: (node: HTMLElement) => void;
  onClosing?: (node: HTMLElement) => void;
  modifiers?: PopperModifiers;
  isOpen?: boolean;
  onClose?: () => void;
  canEscapeKeyClose?: boolean;
  canOutsideClickClose?: boolean;
  menuItemWrapperWidth?: string;
};

const MenuWrapper = styled.div<{ width?: string }>`
  width: ${(props) => (props.width ? props.width : "234px")};
  background: ${(props) => props.theme.colors.menu.background};
  box-shadow: 0px 12px 28px ${(props) => props.theme.colors.menu.shadow};
`;

const MenuOption = styled.div`
  font-family: ${(props) => props.theme.fonts[3]};
`;

function Menu(props: MenuProps) {
  return (
    <Popover
      canEscapeKeyClose={props.canEscapeKeyClose}
      className={props.className}
      data-cy={props.cypressSelector}
      disabled={props.disabled}
      isOpen={props.isOpen}
      minimal
      modifiers={props.modifiers}
      onClose={props.onClose}
      onClosing={props.onClosing}
      onOpening={props.onOpening}
      portalClassName={props.className}
      position={props.position || Position.BOTTOM}
    >
      {props.target}
      <MenuWrapper width={props.menuItemWrapperWidth}>
        {props.children &&
          props.children.map((el, index) => {
            return <MenuOption key={index}>{el}</MenuOption>;
          })}
      </MenuWrapper>
    </Popover>
  );
}

export default Menu;
