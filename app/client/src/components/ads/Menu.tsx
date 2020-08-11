import React, { ReactNode } from "react";
import { CommonComponentProps } from "./common";
import styled from "styled-components";

type MenuProps = CommonComponentProps & {
  children: ReactNode[];
  onSelect: (el: ReactNode) => void;
};

const MenuWrapper = styled("div")`
  background: ${props => props.theme.colors.blackShades[3]};
  box-shadow: 0px 12px 28px rgba(0, 0, 0, 0.75);
`;

const MenuOption = styled("div")`
  padding: ${props => props.theme.spaces[4]}px
    ${props => props.theme.spaces[6]}px;
  color: ${props => props.theme.colors.blackShades[6]};
  font-family: ${props => props.theme.fonts[3]};
  .ads-icon {
    path {
      fill: ${props => props.theme.colors.blackShades[6]};
    }
  }

  &:hover {
    background-color: ${props => props.theme.colors.blackShades[4]};
    color: ${props => props.theme.colors.blackShades[9]};
    cursor: pointer;

    .ads-icon {
      path {
        fill: ${props => props.theme.colors.blackShades[9]};
      }
    }
  }
`;

function Menu(props: MenuProps) {
  return (
    <MenuWrapper>
      {props.children.map((el, index) => {
        return (
          <MenuOption key={index} onClick={el => props.onSelect(el.target)}>
            {el}
          </MenuOption>
        );
      })}
    </MenuWrapper>
  );
}

export default Menu;
