import React from "react";
import styled from "styled-components";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { Checkbox, Classes } from "@blueprintjs/core";
import { BlueprintControlTransform } from "constants/DefaultTheme";

const CheckboxContainer = styled.div`
  && {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    label {
      margin: 0;
    }
  }
  ${BlueprintControlTransform}
`;
class CheckboxComponent extends React.Component<CheckboxComponentProps> {
  render() {
    return (
      <CheckboxContainer>
        <Checkbox
          label={this.props.label}
          className={
            this.props.isLoading ? "bp3-skeleton" : Classes.RUNNING_TEXT
          }
          onChange={this.onCheckChange}
          disabled={this.props.isDisabled}
          checked={this.props.isChecked}
        />
      </CheckboxContainer>
    );
  }

  onCheckChange = () => {
    this.props.onCheckChange(!this.props.isChecked);
  };
}

export interface CheckboxComponentProps extends ComponentProps {
  label: string;
  isChecked: boolean;
  onCheckChange: (isChecked: boolean) => void;
  isLoading: boolean;
}

export default CheckboxComponent;
