import React from "react";
import styled from "styled-components";
import { noop, pick } from "lodash";

import Field from "widgets/FormBuilderWidget/component/Field";
import DropDownComponent, {
  DropDownComponentProps,
} from "widgets/DropdownWidget/component";
import { BaseFieldComponentProps } from "./types";
import { CONFIG } from "widgets/DropdownWidget";
import { DropdownOption } from "widgets/DropdownWidget/constants";

const COMPONENT_DEFAULT_VALUES = pick(CONFIG.defaults, [
  "serverSideFiltering",
  "isFilterable",
]);

type PICKED_DEFAULT_PROPS = keyof typeof COMPONENT_DEFAULT_VALUES;

type SelectComponentOwnProps = Pick<
  DropDownComponentProps,
  PICKED_DEFAULT_PROPS
> & {
  isDisabled: boolean;
  options: DropdownOption[];
};

type SelectFieldProps = BaseFieldComponentProps<SelectComponentOwnProps>;

const StyledSelectWrapper = styled.div`
  width: 100%;
`;

function SelectField({ name, schemaItem, ...rest }: SelectFieldProps) {
  const { options = [] } = schemaItem;

  return (
    // eslint-disable-next-line
    // @ts-ignore
    <Field
      {...rest}
      label={schemaItem.label}
      name={name}
      render={({ field: { onBlur, onChange, ref, value } }) => {
        const selectedOptionIndex = (options || []).findIndex(
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
