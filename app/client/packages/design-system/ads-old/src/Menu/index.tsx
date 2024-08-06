import type { ReactNode } from "react";
import React from "react";
import type { CommonComponentProps } from "../types/common";
import styled from "styled-components";
import { Popover } from "@blueprintjs/core/lib/esm/components/popover/popover";
import { Position } from "@blueprintjs/core/lib/esm/common/position";
import type { PopperModifiers } from "@blueprintjs/core";

export type MenuProps = CommonComponentProps & {
  autoFocus?: boolean;
  children?: ReactNode[];
  closeOnItemClick?: boolean;
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

  /**
   * (optional) dontUsePortal {boolean}
   * For Popover usePortal=true by default.
   * All existing Menu usages don't need to change if we signal usePortal=false via dontUsePortal=true.
   */
  dontUsePortal?: boolean;
};

const MenuWrapper = styled.div<{ width?: string }>`
  width: ${(props) => (props.width ? props.width : "234px")};
  background: var(--ads-color-black-0);
  box-shadow: 0px 12px 28px rgba(0, 0, 0, 0.318);
`;

const MenuOption = styled.div``;

function Menu(props: MenuProps) {
  const { onClose, onClosing, onOpening } = props;

  return (
    <Popover
      autoFocus={props.autoFocus}
      canEscapeKeyClose={props.canEscapeKeyClose}
      className={props.className}
      data-cy={props.cypressSelector}
      disabled={props.disabled}
      isOpen={props.isOpen}
      minimal
      modifiers={props.modifiers}
      onClose={onClose}
      onClosing={onClosing}
      onOpening={onOpening}
      portalClassName={props.className}
      position={props.position || Position.BOTTOM}
      usePortal={!props.dontUsePortal}
    >
      {props.target}
      <MenuWrapper width={props.menuItemWrapperWidth}>
        {props.children &&
          props.children.map((el, index) => {
            return (
              <MenuOption
                key={index}
                onClick={() => {
                  if (typeof onClose === "function" && props.closeOnItemClick)
                    onClose();
                }}
              >
                {el}
              </MenuOption>
            );
          })}
      </MenuWrapper>
    </Popover>
  );
}

export default Menu;
