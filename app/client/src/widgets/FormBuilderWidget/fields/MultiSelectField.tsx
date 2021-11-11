import React from "react";
import styled from "styled-components";
import { noop, pick } from "lodash";

import Field from "widgets/FormBuilderWidget/component/Field";
import MultiSelect from "widgets/MultiSelectWidget/component";
import { Layers } from "constants/Layers";
import { BaseFieldComponentProps, FieldComponentBaseProps } from "../constants";
import { DropdownOption } from "widgets/MultiSelectTreeWidget/widget";

type MultiSelectComponentProps = FieldComponentBaseProps & {
  defaultValue?: string[];
  onFilterChange?: string;
  onFilterUpdate?: string;
  onOptionChange?: string;
  options: DropdownOption[];
  placeholderText?: string;
  serverSideFiltering: boolean;
};

export type MultiSelectFieldProps = BaseFieldComponentProps<
  MultiSelectComponentProps
>;

const COMPONENT_DEFAULT_VALUES: MultiSelectComponentProps = {
  isDisabled: false,
  label: "",
  isVisible: true,
  serverSideFiltering: false,
  options: [
    { label: "Blue", value: "BLUE" },
    { label: "Green", value: "GREEN" },
    { label: "Red", value: "RED" },
  ],
};

const StyledMultiSelectWrapper = styled.div`
  width: 100%;
`;
function MultiSelectField({
  name,
  schemaItem,
  ...rest
}: MultiSelectFieldProps) {
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
      render={({ field: { onChange, value = [] } }) => (
        <StyledMultiSelectWrapper>
          <MultiSelect
            disabled={schemaItem.isDisabled}
            dropdownStyle={{
              zIndex: Layers.dropdownModalWidget,
            }}
            loading={false}
            onChange={onChange}
            onFilterChange={noop}
            options={schemaItem.options}
            placeholder="Multi Select"
            serverSideFiltering={false}
            value={value}
          />
        </StyledMultiSelectWrapper>
      )}
    />
  );
}

MultiSelectField.componentDefaultValues = {
  ...COMPONENT_DEFAULT_VALUES,
  isDisabled: false,
};

export default MultiSelectField;
