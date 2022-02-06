import React, { useEffect } from "react";
import styled from "styled-components";
import {
  Popover,
  InputGroup,
  PopoverInteractionKind,
  Position,
  Classes,
} from "@blueprintjs/core";
import { ReactComponent as CheckedIcon } from "assets/icons/control/checkmark.svg";
import { ReactComponent as ColorPickerIcon } from "assets/icons/control/color-picker.svg";
import { debounce } from "lodash";
import { Colors } from "constants/Colors";
import { replayHighlightClass } from "globalStyles/portals";

const ColorIcon = styled.div<{ color: string }>`
  width: 24px;
  height: 24px;
  border: 3px solid ${(props) => props.theme.colors.propertyPane.bg};
  position: absolute;
  z-index: 1;
  top: 6px;
  left: 6px;
  background: ${(props) => (props.color ? props.color : "transparent")};
`;

const ColorPickerIconContainer = styled.div`
  position: absolute;
  top: 6px;
  left: 6px;
  height: 24px;
  width: 24px;
  z-index: 1;
`;

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
      border: 1px solid var(--appsmith-input-focus-border-color);
    }
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
  border: 3px solid ${(props) => props.theme.colors.propertyPane.bg};
  background: ${(props) => (props.color ? props.color : "transparent")};
  margin-top: 12px;
  margin-left: 12px;
  box-shadow: 0px 1px 1px rgba(54, 62, 68, 0.16);
  cursor: pointer;
`;

const defaultColors: string[] = [
  "#03b365",
  "#FFC13D",
  "#38AFF4",
  "#DD4B34",
  "#3366FF",
  "#2E3D49",
  "#F6F7F8",
  "#FFFFFF",
  "#231F20",
  "#F86A2B",
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
    left: 12px;
    top: -6px;
    height: 38px;
    border-radius: 100px;
  }
`;

function ColorBoard(props: ColorBoardProps) {
  return (
    <ColorsWrapper>
      {defaultColors.map((color: string, index: number) => (
        <ColorTab
          className={Classes.POPOVER_DISMISS}
          color={color}
          key={index}
          onClick={() => props.selectColor(color)}
        >
          {props.selectedColor === color && <CheckedIcon />}
        </ColorTab>
      ))}
      <EmptyColorIconWrapper onClick={() => props.selectColor("")}>
        <NoColorIcon>
          <div className="line" />
        </NoColorIcon>
      </EmptyColorIconWrapper>
    </ColorsWrapper>
  );
}

const NoColorIcon = styled.div`
  width: 100%;
  height: 100%;
  border: 3px solid ${(props) => props.theme.colors.propertyPane.bg};
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

function ColorPickerComponent(props: ColorPickerProps) {
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

  // if props.color changes and state color is different,
  // sets the state color to props color
  useEffect(() => {
    if (props.color !== color) {
      setColor(props.color);
    }
  }, [props.color]);

  return (
    <Popover
      enforceFocus={false}
      interactionKind={PopoverInteractionKind.CLICK}
      minimal
      modifiers={{
        offset: {
          offset: "0, 24px",
        },
      }}
      position={Position.BOTTOM}
      usePortal
    >
      <StyledInputGroup
        className={replayHighlightClass}
        leftIcon={
          color ? (
            <ColorIcon color={color} />
          ) : (
            <ColorPickerIconContainer>
              <ColorPickerIcon />
            </ColorPickerIconContainer>
          )
        }
        onChange={handleChangeColor}
        placeholder="enter color name or hex"
        value={color || ""}
      />
      <ColorBoard
        selectColor={(color) => {
          setColor(color);
          props.changeColor(color);
        }}
        selectedColor={color}
      />
    </Popover>
  );
}

export default ColorPickerComponent;
