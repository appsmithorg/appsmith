import styled from "styled-components";
import { Select, MultiSelect } from "@blueprintjs/select";
import { Switch, InputGroup, Button } from "@blueprintjs/core";
import { DropdownOption } from "widgets/DropdownWidget";
import { ContainerOrientation } from "constants/WidgetConstants";
import { DateInput } from "@blueprintjs/datetime";
import { TimezonePicker } from "@blueprintjs/timezone";

type ControlWrapperProps = {
  orientation?: ContainerOrientation;
};

export const ControlWrapper = styled.div<ControlWrapperProps>`
  display: ${props => (props.orientation === "HORIZONTAL" ? "flex" : "block")};
  justify-content: space-between;
  flex-direction: ${props =>
    props.orientation === "VERTICAL" ? "column" : "row"}
  margin: ${props => props.theme.spaces[3]}px 0;
  & > label {
    color: ${props => props.theme.colors.paneText};
    margin-bottom: ${props => props.theme.spaces[1]}px;
    font-size: ${props => props.theme.fontSizes[3]}px;
  }
  &&& > label:first-of-type {
    display: block;
  }
  &&& > label {
    display: inline-block;
  }
`;

const DropDown = Select.ofType<DropdownOption>();
export const StyledDropDown = styled(DropDown)`
  &&& button {
    background: ${props => props.theme.colors.paneInputBG};
    color: ${props => props.theme.colors.textOnDarkBG};
    box-shadow: none;
  }
`;

const MultiSelectDropDown = MultiSelect.ofType<DropdownOption>();
export const StyledMultiSelectDropDown = styled(MultiSelectDropDown)`
  &&& button {
    background: ${props => props.theme.colors.paneInputBG};
    color: ${props => props.theme.colors.textOnDarkBG};
    box-shadow: none;
  }
`;

export const StyledSwitch = styled(Switch)`
  &&&&& input:checked ~ span {
    background: ${props => props.theme.colors.primary};
  }
`;

export const StyledDynamicInput = styled.div`
  &&& {
    input {
      border: none;
      color: ${props => props.theme.colors.textOnDarkBG};
      background: ${props => props.theme.colors.paneInputBG};
      &:focus {
        border: none;
        color: ${props => props.theme.colors.textOnDarkBG};
        background: ${props => props.theme.colors.paneInputBG};
      }
    }
  }
`;

export const StyledInputGroup = styled(InputGroup)`
  & > input {
    placeholder-text: ${props => props.placeholder};
    color: ${props => props.theme.colors.textOnDarkBG};
    background: ${props => props.theme.colors.paneInputBG};
  }
`;

export const StyledDatePicker = styled(DateInput)`
& > input {
  placeholderText: ${props => props.placeholder}
  color: ${props => props.theme.colors.textOnDarkBG};
  background: ${props => props.theme.colors.paneInputBG};
}
`;

export const StyledTimeZonePicker = styled(TimezonePicker)`
  &&& button {
    background: ${props => props.theme.colors.paneInputBG};
    color: ${props => props.theme.colors.textOnDarkBG};
    box-shadow: none;
  }
`;

export const StyledPropertyPaneButton = styled(Button)`
  &&&& {
    background-color: ${props => props.theme.colors.info};
    color: #ffffff;
    .bp3-icon {
      color: #ffffff;
      margin-right: 4px;
    }
    svg {
      width: 14px;
      height: 14px;
    }
  }
`;
