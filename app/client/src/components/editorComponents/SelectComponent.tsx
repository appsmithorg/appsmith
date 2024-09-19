import type { ReactNode } from "react";
import React from "react";
import type { CustomizedDropdownProps } from "pages/common/CustomizedDropdown/index";
import CustomizedDropdown from "pages/common/CustomizedDropdown/index";

interface SelectComponentProps {
  input: {
    value?: string;
    onChange?: (value: string) => void;
  };
  options?: Array<{ id: string; name: string; content?: ReactNode }>;
  placeholder?: string;
  size?: "large" | "small";
  outline?: boolean;
}

export function SelectComponent(props: SelectComponentProps) {
  const dropdownProps: CustomizedDropdownProps = {
    sections: [
      {
        isSticky: false,
        options:
          props.options &&
          props.options.map((option) => ({
            content: option.content ? option.content : option.name,
            onSelect: () => {
              props.input.onChange && props.input.onChange(option.id);
            },
            shouldCloseDropdown: true,
          })),
      },
    ],
    trigger: {
      text: props.input.value
        ? props.options &&
          props.options.filter((option) => props.input.value === option.id)[0]
            .name
        : props.placeholder,
      outline: props?.outline ?? true,
      size: props.size,
    },
    openDirection: "down",
  };

  return <CustomizedDropdown {...dropdownProps} />;
}

export default SelectComponent;
