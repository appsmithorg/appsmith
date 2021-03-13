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
  background: ${(props) => (props.color ? props.color : "transparent")};
`;

const StyledInputGroup = styled(InputGroup)`
  &&& input {
    padding-left: 36px;
    background: ${(props) => props.theme.colors.paneCard};
    color: ${(props) => props.theme.colors.paneSectionLabel};
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
  background: ${(props) => (props.color ? props.color : "transparent")};
  margin-top: 12px;
  margin-left: 12px;
  box-shadow: 0px 1px 1px rgba(54, 62, 68, 0.16);
  cursor: pointer;
`;

const defaultColors: string[] = [
  "rgb(3, 179, 101)",
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
const EmptyColorIconWrapper = styled.div`
  width: 32px;
  height: 32px;
  margin-top: 12px;
  margin-left: 12px;
  box-shadow: 0px 2px 4px rgba(67, 70, 74, 0.14);
  cursor: pointer;
  .line {
    left: 15px;
    top: -5px;
    height: 43px;
    border-radius: 100px;
  }
`;

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
      <EmptyColorIconWrapper onClick={() => props.selectColor("")}>
        <NoColorIcon>
          <div className="line"></div>
        </NoColorIcon>
      </EmptyColorIconWrapper>
    </ColorsWrapper>
  );
};

const NoColorIconWrapper = styled.div`
  position: absolute;
  z-index: 1;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  .line {
    left: 11px;
    top: -3px;
    height: 30px;
  }
`;

const NoColorIcon = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 4px;
  background: #ffffff;
  position: relative;
  .line {
    width: 2px;
    background: red;
    position: absolute;
    transform: rotate(45deg);
  }
`;

interface ColorPickerProps {
  color: string;
  changeColor: (color: string) => void;
}

const ColorPicker = (props: ColorPickerProps) => {
  const [color, setColor] = React.useState(props.color);
  const debouncedOnChange = React.useCallback(
    debounce(props.changeColor, 500),
    [props.changeColor],
  );
  const handleChangeColor = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    debouncedOnChange(value);
    setColor(value);
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
          color ? (
            <ColorIcon color={color} />
          ) : (
            <NoColorIconWrapper>
              <NoColorIcon>
                <div className="line"></div>
              </NoColorIcon>
            </NoColorIconWrapper>
          )
        }
        onChange={handleChangeColor}
        placeholder="enter color name or hex"
        value={color}
      />
      <ColorBoard
        selectedColor={color}
        selectColor={(color) => {
          console.log({ color });
          setColor(color);
          props.changeColor(color);
        }}
      />
    </Popover>
  );
};

class ColorPickerControl extends BaseControl<ColorPickerControlProps> {
  handleChangeColor = (color: string) => {
    this.updateProperty(this.props.propertyName, color);
  };
  render() {
    return (
      <ColorPicker
        color={
          this.props.propertyValue
            ? this.props.propertyValue
            : this.props.defaultColor
        }
        changeColor={this.handleChangeColor}
      />
    );
  }

  static getControlType() {
    return "COLOR_PICKER";
  }
}

export interface ColorPickerControlProps extends ControlProps {
  defaultColor?: string;
}

export default ColorPickerControl;
