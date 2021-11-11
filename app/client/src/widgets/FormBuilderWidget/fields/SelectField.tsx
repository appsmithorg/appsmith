import React from "react";
import styled from "styled-components";
import { noop, pick } from "lodash";

import Field from "widgets/FormBuilderWidget/component/Field";
import DropDownComponent from "widgets/DropdownWidget/component";
import { DropdownOption } from "widgets/DropdownWidget/constants";
import { BaseFieldComponentProps, FieldComponentBaseProps } from "../constants";

type SelectComponentProps = FieldComponentBaseProps & {
  placeholderText?: string;
  options: DropdownOption[];
  onOptionChange?: string;
  serverSideFiltering: boolean;
  onFilterUpdate?: string;
  isFilterable: boolean;
};

const COMPONENT_DEFAULT_VALUES: SelectComponentProps = {
  isDisabled: false,
  isVisible: true,
  label: "",
  serverSideFiltering: false,
  isFilterable: false,
  options: [
    { label: "Blue", value: "BLUE" },
    { label: "Green", value: "GREEN" },
    { label: "Red", value: "RED" },
  ],
};

export type SelectFieldProps = BaseFieldComponentProps<SelectComponentProps>;

const StyledSelectWrapper = styled.div`
  width: 100%;
`;

function SelectField({ name, schemaItem, ...rest }: SelectFieldProps) {
  const labelStyles = pick(schemaItem, [
    "labelStyle",
    "labelTextColor",
    "labelTextSize",
  ]);

  return (
    <Field
      {...rest}
      label={schemaItem.label}
      labelStyles={labelStyles}
      name={name}
      render={({ field: { onBlur, onChange, ref, value } }) => {
        const selectedOptionIndex = schemaItem.options.findIndex(
          (option) => option.value === value,
        );
        const selectedIndex =
          selectedOptionIndex > -1 ? selectedOptionIndex : undefined;

        const onOptionSelected = (option: DropdownOption) => {
          onChange(option.value);
        };

        return (
          <StyledSelectWrapper>
            <DropDownComponent
              disabled={schemaItem.isDisabled}
              height={10}
              inputRef={ref}
              isFilterable={schemaItem.isFilterable}
              isLoading={false}
              label=""
              onBlurHandler={onBlur}
              onFilterChange={noop}
              onOptionSelected={onOptionSelected}
              options={schemaItem.options}
              placeholder=""
              selectedIndex={selectedIndex}
              serverSideFiltering={schemaItem.serverSideFiltering}
              widgetId=""
              width={10}
            />
          </StyledSelectWrapper>
        );
      }}
    />
  );
}

SelectField.componentDefaultValues = {
  ...COMPONENT_DEFAULT_VALUES,
  options: [
    { label: "Blue", value: "BLUE" },
    { label: "Green", value: "GREEN" },
    { label: "Red", value: "RED" },
  ],
};

export default SelectField;
