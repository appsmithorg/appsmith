import React from "react";
import { ButtonBorderRadiusTypes } from "components/constants";
import Dropdown from "components/ads/Dropdown";
import {
  Popover,
  InputGroup,
  Position,
  PopoverInteractionKind,
  Classes,
} from "@blueprintjs/core";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import ColorPickerComponent from "components/ads/ColorPickerComponent";

const StyledInputGroup = styled(InputGroup)`
  .${Classes.INPUT} {
    box-shadow: none;
    border-radius: 0;
    &:focus {
      box-shadow: none;
    }
  }
  &&& input {
    padding-left: 36px;
    height: 36px;
    border: 1px solid ${Colors.GREY_5};
    background: ${(props) =>
      props.theme.colors.propertyPane.multiDropdownBoxHoverBg};
    color: ${(props) => props.theme.colors.propertyPane.label};

    &:focus {
      border: 1px solid ${Colors.PRIMARY_ORANGE};
    }
  }
`;

function ThemeColorControl() {
  return (
    <ColorPickerComponent
      changeColor={() => {
        //
      }}
      color="red"
    />
  );
}

export default ThemeColorControl;
