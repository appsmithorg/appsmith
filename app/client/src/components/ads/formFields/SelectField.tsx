import React, { useEffect, useState } from "react";
import {
  Field,
  WrappedFieldMetaProps,
  WrappedFieldInputProps,
} from "redux-form";
import Dropdown from "components/ads/Dropdown";

type DropdownWrapperProps = {
  placeholder: string;
  input?: {
    value?: string;
    onChange?: (value?: string) => void;
  };
  options: Array<{ id: string; value: string; label?: string }>;
  fillOptions?: boolean;
};

function DropdownWrapper(props: DropdownWrapperProps) {
  const [selectedOption, setSelectedOption] = useState({
    value: props.placeholder,
  });
  const onSelectHandler = (value?: string) => {
    props.input && props.input.onChange && props.input.onChange(value);
  };

  useEffect(() => {
    if (props.input && props.input.value) {
      setSelectedOption({ value: props.input.value });
    } else if (props.placeholder) {
      setSelectedOption({ value: props.placeholder });
    }
  }, [props.input, props.placeholder]);

  return (
    <Dropdown
      fillOptions={props.fillOptions}
      onSelect={onSelectHandler}
      options={props.options}
      selected={selectedOption}
    />
  );
}

const renderComponent = (
  componentProps: SelectFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  return <DropdownWrapper {...componentProps} />;
};

type SelectFieldProps = {
  name: string;
  placeholder: string;
  options: Array<{ id: string; value: string; label?: string }>;
  size?: "large" | "small";
  outline?: boolean;
  fillOptions?: boolean;
};

export function SelectField(props: SelectFieldProps) {
  return (
    <Field
      component={renderComponent}
      fillOptions={props.fillOptions}
      name={props.name}
      options={props.options}
      outline={props.outline}
      placeholder={props.placeholder}
      size={props.size}
    />
  );
}

export default SelectField;
