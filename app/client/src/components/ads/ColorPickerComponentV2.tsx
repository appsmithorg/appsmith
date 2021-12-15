import React, { useEffect, useRef, useMemo } from "react";
import styled from "styled-components";
import {
  Popover,
  InputGroup,
  PopoverInteractionKind,
  Position,
  Classes,
} from "@blueprintjs/core";
import { ReactComponent as ColorPickerIcon } from "assets/icons/control/color-picker.svg";
import { debounce, get } from "lodash";
import { Colors } from "constants/Colors";
import * as colors from "twind/colors";
import { tw } from "twind";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { useSelector } from "react-redux";

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
      border: 1px solid ${Colors.PRIMARY_ORANGE};
    }
  }
`;

interface ColorPickerProps {
  color: string;
  changeColor: (color: string) => void;
}

function ColorPickerComponent(props: ColorPickerProps) {
  const inputRef = useRef<any>();
  const theme = useSelector(getSelectedAppTheme);
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
  const userDefinedColors = theme.properties.colors;

  // if props.color changes and state color is different,
  // sets the state color to props color
  useEffect(() => {
    if (props.color !== color) {
      setColor(props.color);
    }
  }, [props.color]);

  const tailwindColors: {
    [key: string]: {
      [key: string]: string;
    };
  } = useMemo(() => {
    const filteredColors: {
      [key: string]: {
        [key: string]: string;
      };
    } = {};

    Object.keys(colors)
      .filter((colorKey) =>
        [
          "gray",
          "red",
          "yellow",
          "green",
          "blue",
          "indigo",
          "purple",
          "green",
          "pink",
        ].includes(colorKey),
      )
      .map((colorKey) => {
        filteredColors[colorKey] = get(colors, `${colorKey}`);
      });

    return filteredColors;
  }, []);

  return (
    <Popover
      enforceFocus={false}
      interactionKind={PopoverInteractionKind.CLICK}
      minimal
      position={Position.BOTTOM}
      usePortal
    >
      <StyledInputGroup
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
        ref={inputRef}
        value={color || ""}
      />
      <div
        className="p-3 space-y-2 w-72"
        key={`color-picker-v2-${props.color}`}
      >
        <div className="space-y-2">
          <h2 className="pb-2 font-semibold border-b">Color Styles</h2>
          <section className="space-y-2">
            <h3 className="text-xs">Application Colors</h3>
            <div className="flex space-x-1">
              {Object.keys(userDefinedColors).map((colorKey, index) => (
                <div
                  className={`${tw`bg-[${userDefinedColors[colorKey] ||
                    userDefinedColors[
                      colorKey
                    ]}]`} border rounded-full h-6 w-6`}
                  key={index}
                />
              ))}
            </div>
          </section>
        </div>
        <div className="space-y-2">
          <h2 className="pb-2 font-semibold border-b">Color Styles</h2>
          <section className="space-y-2">
            <h3 className="text-xs">All Colors</h3>
            {Object.keys(tailwindColors).map((colorKey) => (
              <div className="flex space-x-1" key={colorKey}>
                {Object.keys(get(tailwindColors, `${colorKey}`)).map(
                  (singleColorKey) => (
                    <div
                      className={`h-6 w-6 rounded-full transform ${tw` bg-${colorKey}-${singleColorKey}`} }`}
                      key={`a-${colorKey}`}
                      onClick={() => {
                        setColor(tailwindColors[colorKey][singleColorKey]);
                        props.changeColor(
                          tailwindColors[colorKey][singleColorKey],
                        );
                      }}
                    />
                  ),
                )}
              </div>
            ))}
            <div className="flex space-x-1">
              <div
                className="w-6 h-6 transform border rounded-full white"
                onClick={() => {
                  setColor("#fff");
                  props.changeColor("#fff");
                }}
              />
              <div
                className="w-6 h-6 transform border rounded-full white diag"
                onClick={() => {
                  setColor("transparent");
                  props.changeColor("transparent");
                }}
              />
            </div>
          </section>
        </div>
      </div>
    </Popover>
  );
}

export default ColorPickerComponent;
