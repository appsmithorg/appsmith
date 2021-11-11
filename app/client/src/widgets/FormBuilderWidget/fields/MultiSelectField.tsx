import React from "react";
import styled from "styled-components";
import { noop } from "lodash";
import { SelectProps } from "rc-select";

import Field from "widgets/FormBuilderWidget/component/Field";
import MultiSelect, {
  MultiSelectProps,
} from "widgets/MultiSelectWidget/component";
import { CONFIG } from "widgets/MultiSelectWidget";
import { Layers } from "constants/Layers";
import { BaseFieldComponentProps } from "../constants";

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
  return (
    // eslint-disable-next-line
    // @ts-ignore
    <Field
      {...rest}
      label={schemaItem.label}
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
            options={schemaItem.options || []}
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
