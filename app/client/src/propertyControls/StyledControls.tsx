import styled from "styled-components";
import { Select } from "@blueprintjs/select";
import { Switch, InputGroup } from "@blueprintjs/core";
import { ContainerOrientation } from "../constants/WidgetConstants";

type ControlWrapperProps = {
  orientation?: ContainerOrientation;
};

export const ControlWrapper = styled.div<ControlWrapperProps>`
  display: ${props => (props.orientation === "HORIZONTAL" ? "flex" : "block")};
  flexDirection: ${props =>
    props.orientation === "VERTICAL" ? "row" : "column"}
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

const DropDown = Select.ofType<{ label: string; value: string }>();
export const StyledDropDown = styled(DropDown)`
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

export const StyledInputGroup = styled(InputGroup)`
  & > input {
    placeholderText: ${props => props.placeholder}
    color: ${props => props.theme.colors.textOnDarkBG};
    background: ${props => props.theme.colors.paneInputBG};
  }
`;
