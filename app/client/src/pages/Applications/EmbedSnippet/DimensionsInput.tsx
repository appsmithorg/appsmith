import { TextInput } from "design-system-old";
import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  .prefix {
    top: 0.4px;
    position: relative;
  }
  input {
    text-align: right;
    padding-left: 2px;
  }
`;

type DimensionsInputProp = {
  onChange?: ((value: string) => void) | undefined;
  value: string;
  prefix: string;
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
    <Wrapper className={`t--${props.prefix}-dimension`}>
      <TextInput
        height={"28px"}
        onChange={props.onChange}
        prefix={props.prefix}
        validator={cssDimensionValidator}
        value={props.value}
        width={"90px"}
      />
    </Wrapper>
  );
}

export default DimensionsInput;
