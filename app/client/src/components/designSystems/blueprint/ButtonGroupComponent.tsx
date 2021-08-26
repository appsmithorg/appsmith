import React from "react";
import { ButtonBorderRadius } from "components/propertyControls/ButtonBorderRadiusControl";
import { ButtonBoxShadow } from "components/propertyControls/BoxShadowOptionsControl";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import styled from "styled-components";

const ButtonGroupWrapper = styled.div<{
  isHorizontal: boolean;
}>`
  height: 100%;
  width: 100%;
  position: relative;
  display: flex;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  ${(props) =>
    props.isHorizontal ? "flex-direction: row" : "flex-direction: column"};
`;

class ButtonGroupComponent extends React.Component<ButtonGroupComponentProps> {
  render() {
    const { orientation } = this.props;
    const isHorizontal = orientation === "horizontal";

    return (
      <ButtonGroupWrapper isHorizontal={isHorizontal}>
        <div>This Is Button Group</div>
      </ButtonGroupWrapper>
    );
  }
}

export interface ButtonGroupComponentProps extends ComponentProps {
  orientation: string;
  isDisabled: boolean;
  buttonVariant: string;
  borderRadius?: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
}

export default ButtonGroupComponent;
