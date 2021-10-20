import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import styled from "styled-components";
import { MenuItem } from "@blueprintjs/core";
import { IItemRendererProps } from "@blueprintjs/select";
import Dropdown, {
  DropdownProps,
  DropdownOption,
} from "components/ads/Dropdown";
import FormLabel from "components/editorComponents/FormLabel";
import { ControlType } from "constants/PropertyControlConstants";
import { theme } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import _ from "lodash";
import {
  Field,
  WrappedFieldMetaProps,
  WrappedFieldProps,
  WrappedFieldInputProps,
} from "redux-form";
const DropdownSelect = styled.div`
  font-size: 14px;
  width: 50vh;
`;

const StyledInfo = styled.span`
  font-weight: normal;
  line-height: normal;
  color: ${Colors.DOVE_GRAY};
  font-size: 12px;
  margin-left: 1px;
`;

const StyledDropdown = styled(Dropdown)`
  .dropdown-control {
  }
`;
class DropDownControl extends BaseControl<DropDownControlProps> {
  render() {
    const {
      configProperty,
      initialValue,
      isRequired,
      label,
      options,
      placeholderText,
      subtitle,
    } = this.props;

    return (
      <div>
        <FormLabel>
          {label} {isRequired && "*"}
          {subtitle && (
            <>
              <br />
              <StyledInfo>{subtitle}</StyledInfo>
            </>
          )}
        </FormLabel>
        <DropdownSelect data-cy={configProperty}>
          <Field
            component={renderDropdown}
            name={configProperty}
            props={{
              options: options,
              isRequired: isRequired,
              initialValue: initialValue,
              placeholder: placeholderText,
            }}
            {...this.props}
          />
        </DropdownSelect>
      </div>
    );
  }

  renderItem = (option: DropdownOption, itemProps: IItemRendererProps) => {
    if (!itemProps.modifiers.matchesPredicate) {
      return null;
    }
    const isSelected: boolean = this.isOptionSelected(option);
    return (
      <MenuItem
        active={isSelected}
        className="single-select"
        key={option.value}
        onClick={itemProps.handleClick}
        text={option.label}
      />
    );
  };

  isOptionSelected = (selectedOption: DropdownOption) => {
    return selectedOption.value === this.props.propertyValue;
  };

  getControlType(): ControlType {
    return "DROP_DOWN";
  }
}

function renderDropdown(props: any): JSX.Element {
  const selectedValue = props.input.value || props.initialValue;
  const selectedOption = props.options.find(
    (option: DropdownOption) => option.value === selectedValue,
  );
  /* eslint-disable no-console */
  console.log("dropdown", props);

  return (
    <Dropdown
      className="dropdown-control"
      dontUsePortal={false}
      errorMsg={props.errorMsg}
      fillOptions
      helperText={props.helperText}
      onSelect={props.input.onChange}
      options={props.options}
      {...props}
      {...props.input}
      boundary={"window"}
      selected={selectedOption}
      showLabelOnly
      width="100%"
    />
  );
}

export interface DropDownControlProps extends ControlProps {
  options: DropdownOption[];
  placeholderText: string;
  propertyValue: string;
  subtitle?: string;
}

export default DropDownControl;
