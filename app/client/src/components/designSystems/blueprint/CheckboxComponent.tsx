import React from "react";
import styled from "styled-components";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { Checkbox, Classes } from "@blueprintjs/core";

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
          defaultIndeterminate={this.props.defaultCheckedState}
          onChange={this.onCheckChange}
          disabled={this.props.isDisabled}
        />
      </CheckboxContainer>
    );
  }

  onCheckChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.props.onCheckChange(event.target.value === "true");
  };
}

export interface CheckboxComponentProps extends ComponentProps {
  label: string;
  defaultCheckedState: boolean;
  onCheckChange: (isChecked: boolean) => void;
  isLoading: boolean;
}

export default CheckboxComponent;
