import React from "react";
import { Input } from "design-system";
import styled from "styled-components";

const StyledInput = styled(Input)`
  > .ads-v2-input__input-section > div {
    min-width: 0px;
  }

  input {
    width: 100px;
  }
`;

type DimensionsInputProp = {
  onChange?: ((value: string) => void) | undefined;
  value: string;
  prefix: string;
  icon: string;
};

export function cssDimensionValidator(value: string) {
  let isValid = false;
  const regex = /^[1-9][0-9]{0,3}((px)|(em)|(%)|(vw)|(vh))?$/;
  if (value) {
    isValid = regex.test(value);
  }
  return {
    isValid: isValid,
    message: "",
  };
}

function DimensionsInput(props: DimensionsInputProp) {
  return (
    <div className={`t--${props.prefix}-dimension`}>
      <StyledInput
        onChange={props.onChange}
        renderAs="input"
        size="md"
        startIcon={props.icon}
        // validator={cssDimensionValidator}
        value={props.value}
      />
    </div>
  );
}

export default DimensionsInput;
