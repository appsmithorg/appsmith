import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import {
  Popover,
  InputGroup,
  PopoverInteractionKind,
  Classes,
} from "@blueprintjs/core";
import { ReactComponent as ColorPickerIcon } from "assets/icons/control/color-picker.svg";
import { debounce, get } from "lodash";
import { Colors } from "constants/Colors";
import { useSelector } from "store";
import { getSelectedAppThemeProperties } from "selectors/appThemingSelectors";
import {
  colorsPropertyName,
  getThemePropertyBinding,
} from "constants/ThemeContants";
import { getWidgets } from "sagas/selectors";
import { extractColorsFromString } from "utils/helpers";
import { TAILWIND_COLORS } from "constants/ThemeConstants";

/**
 * ----------------------------------------------------------------------------
 * TYPES
 *-----------------------------------------------------------------------------
 */
interface ColorPickerProps {
  color: string;
  changeColor: (color: string) => void;
  showThemeColors?: boolean;
  showApplicationColors?: boolean;
  evaluatedColorValue?: string;
}

/**
 * ----------------------------------------------------------------------------
 * STYLED
 *-----------------------------------------------------------------------------
 */
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
      border: 1px solid ${Colors.GREY_9};
    }
  }
`;

/**
 * ----------------------------------------------------------------------------
 * COMPONENT
 *-----------------------------------------------------------------------------
 */
function ColorPickerComponent(props: ColorPickerProps) {
  const inputRef = useRef<any>();
  const [color, setColor] = React.useState(props.color);
  const widgets = useSelector(getWidgets);
  const themeColors = useSelector(getSelectedAppThemeProperties).colors;
  const applicationColors = extractColorsFromString(JSON.stringify(widgets));

  /**
   * debounced onChange
   *
   */
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
      key={`color-picker-v2-popover-${color}`}
      minimal
      openOnTargetFocus
      usePortal
    >
      <StyledInputGroup
        autoFocus
        leftIcon={
          color ? (
            <ColorIcon color={props.evaluatedColorValue || color || ""} />
          ) : (
            <ColorPickerIconContainer>
              <ColorPickerIcon />
            </ColorPickerIconContainer>
          )
        }
        onChange={handleChangeColor}
        placeholder="enter color name or hex"
        ref={inputRef}
        value={props.evaluatedColorValue || color || ""}
      />
      <div className="p-3 space-y-2 w-72">
        {props.showThemeColors && (
          <div className="space-y-2">
            <h2 className="pb-2 font-semibold border-b">Color Styles</h2>
            <section className="space-y-2">
              <h3 className="text-xs">Theme Colors</h3>
              <div className="flex space-x-1">
                {Object.keys(themeColors).map((colorKey) => (
                  <div
                    className="w-6 h-6 transform border rounded-full cursor-pointer"
                    key={`color-picker-v2-${colorKey}`}
                    onClick={() => {
                      setColor(themeColors[colorKey]);
                      props.changeColor(
                        getThemePropertyBinding(
                          `${colorsPropertyName}.${colorKey}`,
                        ),
                      );
                    }}
                    style={{ backgroundColor: themeColors[colorKey] }}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
        {props.showApplicationColors && (
          <div className="space-y-2">
            <h2 className="pb-2 font-semibold border-b">Color Styles</h2>
            <section className="space-y-2">
              <h3 className="text-xs">Application Colors</h3>
              <div className="flex space-x-1">
                {Object.values(applicationColors).map((colorCode: string) => (
                  <div
                    className="w-6 h-6 transform border rounded-full cursor-pointer"
                    key={colorCode}
                    onClick={() => {
                      setColor(colorCode);
                      props.changeColor(colorCode);
                    }}
                    style={{ backgroundColor: colorCode }}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
        <div className="space-y-2">
          <h2 className="pb-2 font-semibold border-b">Color Styles</h2>
          <section className="space-y-2">
            <h3 className="text-xs">All Colors</h3>
            {Object.keys(TAILWIND_COLORS).map((colorKey) => (
              <div className="flex space-x-1" key={colorKey}>
                {Object.keys(get(TAILWIND_COLORS, `${colorKey}`)).map(
                  (singleColorKey) => (
                    <div
                      className="items-center w-6 h-6 transform rounded-full cursor-pointer"
                      key={`a-${colorKey}`}
                      onClick={() => {
                        setColor(TAILWIND_COLORS[colorKey][singleColorKey]);
                        props.changeColor(
                          TAILWIND_COLORS[colorKey][singleColorKey],
                        );
                      }}
                      style={{
                        backgroundColor:
                          TAILWIND_COLORS[colorKey][singleColorKey],
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
