import { Radio, RadioGroup } from "@appsmith/ads";
import React, { useEffect, useState } from "react";
import type { WrappedFieldInputProps } from "redux-form";
import styled from "styled-components";

export interface RadioGroupWrapperProps {
  placeholder: string;
  input: WrappedFieldInputProps;
  options: Array<{ value: string; label: string }>;
  selectedOptionElements?: Array<JSX.Element | null>;
  className?: string;
  columns?: number;
  rows?: number;
}

const RadioContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

function RadioGroupWrapper(props: RadioGroupWrapperProps) {
  const selectedValueHandler = () => {
    if (
      props.input &&
      props.input.value &&
      Object.keys(props.input.value).length > 0
    ) {
      return props.input.value.value;
    } else if (props.input && typeof props.input.value === "string") {
      return props.input.value;
    } else if (props.placeholder) {
      return props.placeholder;
    }
  };
  const [selectedOption, setSelectedOption] = useState<string>(
    selectedValueHandler(),
  );
  const onSelectHandler = (value: string) => {
    props.input.onChange({ value: value });
  };

  useEffect(() => {
    setSelectedOption(selectedValueHandler());
  }, [props.input.value, props.placeholder]);

  return (
    <RadioGroup
      className={props.className}
      // columns={props.columns}
      defaultValue={selectedOption}
      onChange={(value: string) => onSelectHandler(value)}
      value={selectedOption}
      // rows={props.rows}
    >
      {props.options.map((option, index) => (
        <RadioContainer key={option.value}>
          <Radio key={option.value} value={option.value}>
            {option.label}
          </Radio>
          {selectedOption == option.value &&
            props.selectedOptionElements?.[index]}
        </RadioContainer>
      ))}
    </RadioGroup>
  );
}

export default RadioGroupWrapper;
