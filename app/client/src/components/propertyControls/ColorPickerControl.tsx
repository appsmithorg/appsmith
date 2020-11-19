import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import styled from "styled-components";
import {
  Popover,
  InputGroup,
  PopoverInteractionKind,
  Position,
  Classes,
} from "@blueprintjs/core";
import { ReactComponent as CheckedIcon } from "assets/icons/control/checkmark.svg";
import { debounce } from "lodash";

const ColorIcon = styled.div<{ color: string }>`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  position: absolute;
  z-index: 1;
  top: 3px;
  left: 3px;
  background: ${props => (props.color ? props.color : "transparent")};
`;

const StyledInputGroup = styled(InputGroup)`
  &&& input {
    padding-left: 36px;
    background: ${props => props.theme.colors.paneCard};
    color: ${props => props.theme.colors.paneSectionLabel};
  }
`;

const ColorsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding: 0 12px 12px 0;
  background: #ffffff;
  width: 232px;
  height: auto;
  box-shadow: 0px 2px 4px rgba(67, 70, 74, 0.14);
  border-radius: 4px;
`;

const ColorTab = styled.div<{ color: string }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: ${props => (props.color ? props.color : "transparent")};
  margin-top: 12px;
  margin-left: 12px;
  box-shadow: 0px 1px 1px rgba(54, 62, 68, 0.16);
  cursor: pointer;
`;

const defaultColors: string[] = [
  "#29CCA3",
  "#FFC13D",
  "#38AFF4",
  "#DD4B34",
  "#3366FF",
  "#2E3D49",
  "#F6F7F8",
  "#231F20",
];

interface ColorBoardProps {
  selectColor: (color: string) => void;
  selectedColor: string;
}

const ColorBoard = (props: ColorBoardProps) => {
  return (
    <ColorsWrapper>
      {defaultColors.map((color: string, index: number) => (
        <ColorTab
          key={index}
          color={color}
          className={Classes.POPOVER_DISMISS}
          onClick={() => props.selectColor(color)}
        >
          {props.selectedColor === color && <CheckedIcon />}
        </ColorTab>
      ))}
    </ColorsWrapper>
  );
};

const NoColorIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: #ffffff;
  position: absolute;
  z-index: 1;
  top: 3px;
  left: 3px;
  &:after {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    content: "\2F";
    transform: rotate(30deg);
    text-align: center;
    color: red;
    font-size: 24px;
    line-height: 24px;
  }
`;

interface ColorPickerProps {
  color: string;
  changeColor: (color: string) => void;
}

const ColorPicker = (props: ColorPickerProps) => {
  const [color, setColor] = React.useState(props.color);
  const debouncedOnChange = React.useCallback(
    debounce(props.changeColor, 1000),
    [],
  );
  const handleChangeColor = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value === "" || (/^#[0-9A-F]*$/i.test(value) && value.length <= 7)) {
      setColor(value);
      debouncedOnChange(value);
    }
  };
  return (
    <Popover
      minimal
      usePortal
      enforceFocus={false}
      interactionKind={PopoverInteractionKind.CLICK}
      position={Position.BOTTOM}
      modifiers={{
        offset: {
          offset: "0, 24px",
        },
      }}
    >
      <StyledInputGroup
        leftIcon={
          props.color ? <ColorIcon color={props.color} /> : <NoColorIcon />
        }
        onChange={handleChangeColor}
        placeholder="enter color name or hex"
        value={color}
      />
      <ColorBoard
        selectedColor={color}
        selectColor={color => {
          setColor(color);
          props.changeColor(color);
        }}
      />
    </Popover>
  );
};

class ColorPickerControl extends BaseControl<ControlProps> {
  handleChangeColor = (color: string) => {
    this.updateProperty(this.props.propertyName, color);
  };
  render() {
    return (
      <ColorPicker
        color={this.props.propertyValue}
        changeColor={this.handleChangeColor}
      />
    );
  }

  static getControlType() {
    return "COLOR_PICKER";
  }
}

export default ColorPickerControl;
