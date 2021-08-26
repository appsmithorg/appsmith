import React from "react";
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
    const { isHorizontal } = this.props;

    return (
      <ButtonGroupWrapper isHorizontal={isHorizontal}>
        <div>This Is Button Group</div>
      </ButtonGroupWrapper>
    );
  }
}

export interface ButtonGroupComponentProps extends ComponentProps {
  isHorizontal: boolean;
}

export default ButtonGroupComponent;
