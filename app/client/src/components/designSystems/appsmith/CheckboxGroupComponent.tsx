import * as React from "react";
import styled from "styled-components";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";

const CheckboxGroupContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

export interface CheckboxGroupComponentProps extends ComponentProps {
  isDisabled: boolean;
  isVisible: boolean;
}

function CheckboxGroupComponent(props: CheckboxGroupComponentProps) {
  return (
    <CheckboxGroupContainer>
      <div>Checkbox Group Component</div>
    </CheckboxGroupContainer>
  );
}

export default CheckboxGroupComponent;
