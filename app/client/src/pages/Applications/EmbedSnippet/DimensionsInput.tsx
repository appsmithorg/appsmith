import React from "react";
import styled from "styled-components";
import { Input } from "@appsmith/ads";

const StyledInput = styled(Input)`
  > .ads-v2-input__input-section > div {
    min-width: 0px;
  }

  input {
    width: 100px;
  }
`;

interface DimensionsInputProp {
  onChange?: ((value: string) => void) | undefined;
  value: string;
  prefix: string;
  icon: string;
}

const regex = /^[1-9][0-9]{0,3}((px)|(em)|(%)|(vw)|(vh))?$/;

function DimensionsInput(props: DimensionsInputProp) {
  const [isValid, setIsValid] = React.useState(true);

  const onChange = (value: string) => {
    if (!regex.test(value)) {
      setIsValid(false);
    } else {
      setIsValid(true);
    }

    if (props.onChange) {
      props.onChange(value);
    }
  };

  return (
    <div className={`t--${props.prefix}-dimension`}>
      <StyledInput
        isValid={isValid}
        onChange={onChange}
        renderAs="input"
        size="md"
        startIcon={props.icon}
        value={props.value}
      />
    </div>
  );
}

export default DimensionsInput;
