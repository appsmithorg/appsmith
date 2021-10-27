import React from "react";
import styled from "styled-components";
import { noop } from "lodash";
import { SelectProps } from "rc-select";

import Field from "widgets/FormBuilderWidget/component/Field";
import MultiSelect, {
  MultiSelectProps,
} from "widgets/MultiSelectWidget/component";
import { BaseFieldComponentProps } from "./types";
import { CONFIG } from "widgets/MultiSelectWidget";
import { Layers } from "constants/Layers";

const COMPONENT_DEFAULT_VALUES = {
  placeholder: CONFIG.defaults.placeholderText,
  serverSideFiltering: CONFIG.defaults.serverSideFiltering,
};

type PICKED_DEFAULT_PROPS = keyof typeof COMPONENT_DEFAULT_VALUES;

type DateComponentOwnProps = Pick<MultiSelectProps, PICKED_DEFAULT_PROPS> & {
  isDisabled: boolean;
  options: SelectProps["options"];
};

type MultiSelectFieldProps = BaseFieldComponentProps<DateComponentOwnProps>;

const StyledMultiSelectWrapper = styled.div`
  width: 100%;
`;
function MultiSelectField({
  name,
  schemaItem,
  ...rest
}: MultiSelectFieldProps) {
  const { label, props } = schemaItem;
  const { isDisabled, options = [], ...restSchemaItemProps } = props;

  return (
    <Field
      {...rest}
      label={label}
      name={name}
      render={({ field: { onChange, value = [] } }) => (
        <StyledMultiSelectWrapper>
          <MultiSelect
            {...restSchemaItemProps}
            disabled={isDisabled}
            dropdownStyle={{
              zIndex: Layers.dropdownModalWidget,
            }}
            loading={false}
            onChange={onChange}
            onFilterChange={noop}
            options={options}
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
