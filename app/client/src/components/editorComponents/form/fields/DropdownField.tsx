/* eslint-disable */
import React, { useEffect, useState } from "react";
import _ from "lodash";
import { change, Field } from "redux-form";
import { replayHighlightClass } from "globalStyles/portals";
import type { SelectOptionProps } from "design-system";
import { Select, Option } from "design-system";
import styled from "styled-components";
import { getAssetUrl } from "../../../../ce/utils/airgapHelpers";
import { useDispatch } from "react-redux";

const Container = styled.div`
  display: flex;
  gap: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const renderDropdown = (props: any) => {
  return (
    <Select defaultValue={props.defaultValue}>
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

// This field doesn't rerender even when it's props rerender, and even when those props are connected to the state of
// the component, because Field doesn't care about react's state. To get this component to rerender when it's prop
// defaultValue changes, I need to either
// 1. change the value in redux (?) via dispatch and change (?)
//   - Can't perform a React state update on an unmounted component
// 2. or use the onChange function on Field
//   - What is the event to pass it as arg1?
// I also don't see any other Field component that is struggling so hard to update state, so I'm probably missing something fundamental.
function DropdownField(props: any) {
  const dispatch = useDispatch();
  const [defaultValue, setDefaultValue] = useState(props.options[0].value);
  // const defaultValue = props.options[0].value;

  useEffect(() => {
    if (
      (props.options && props.options[0] && props.options[0]?.value) !==
      defaultValue
    ) {
      dispatch(change(props.formName, "datasource.id", props.options[0].value)); // Dispatch a change action to update form state
      setDefaultValue(props.options[0].value);
    }
  }, [props.options]);

  return (
    <Field
      className={`${props.className} ${replayHighlightClass}`}
      component={renderDropdown}
      defaultValue={defaultValue}
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
