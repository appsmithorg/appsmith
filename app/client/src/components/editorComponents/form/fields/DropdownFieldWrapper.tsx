import Dropdown from "components/ads/Dropdown";
import React, { useEffect, useState } from "react";
import { WrappedFieldInputProps } from "redux-form";
import styled from "styled-components";

type DropdownWrapperProps = {
  placeholder: string;
  input: WrappedFieldInputProps;
  options: Array<{ id?: string; value: string; label?: string }>;
  className?: string;
};

const StyledDropdown = styled(Dropdown)`
  height: 35px !important;
  display: flex;
  align-items: center;
`;

const DropdownFieldWrapper = (props: DropdownWrapperProps) => {
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
  const [selectedOption, setSelectedOption] = useState<any>({
    value: selectedValueHandler(),
  });
  const onSelectHandler = (value?: string) => {
    props.input.onChange({ value: value });
  };

  useEffect(() => {
    setSelectedOption({ value: selectedValueHandler() });
  }, [props.input.value, props.placeholder]);

  return (
    <StyledDropdown
      className={props.className}
      options={props.options}
      selected={selectedOption}
      onSelect={onSelectHandler}
      width={120}
    />
  );
};

export default DropdownFieldWrapper;
