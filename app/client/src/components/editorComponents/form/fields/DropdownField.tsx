import React from "react";
import _ from "lodash";
import { Field } from "redux-form";
import { replayHighlightClass } from "globalStyles/portals";
import type { SelectOptionProps } from "design-system";
import { Select, Option } from "design-system";
import styled from "styled-components";
import { getAssetUrl } from "../../../../ce/utils/airgapHelpers";

const Container = styled.div`
  display: flex;
  gap: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const renderDropdown = (props: any) => {
  return (
    <Select
      onSelect={(value) => {
        // take the string value that rc-select gives us and use it to find the object that the string value contains,
        // which is what our backend wants.
        const obj = _.find(props.options, (o) => {
          return o.value === value;
        });
        props.input.onChange(obj);
      }}
      value={props.input.value}
    >
      {props.options.map((option: SelectOptionProps) => (
        <Option key={option.value} value={option.value}>
          <Container>
            {option.image && (
              <img
                alt="Datasource"
                className="plugin-image"
                src={getAssetUrl(option.image)}
              />
            )}
            {option.label}
          </Container>
        </Option>
      ))}
      {props.children}
    </Select>
  );
};

function DropdownField(props: any) {
  return (
    <Field
      className={`${props.className} ${replayHighlightClass}`}
      component={renderDropdown}
      format={(value: string) => _.find(props.options, { value }) || ""}
      normalize={(option: { value: string }) => option.value}
      {...props}
      isDisabled={props.isDisabled}
      isSearchable={props.isSearchable}
      placeholder={props.placeholder}
    />
  );
}

export default DropdownField;
