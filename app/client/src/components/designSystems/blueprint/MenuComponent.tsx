import React from "react";
import styled from "styled-components";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";

export const MenuContainer = styled.div`
  width: 100%;
  height: 100%;
`;

export interface MenuComponentProps extends ComponentProps {
  label: string;
}

function MenuComponent(props: MenuComponentProps) {
  const { label } = props;

  return (
    <MenuContainer>
      <div>{label}</div>
    </MenuContainer>
  );
}

export default MenuComponent;
