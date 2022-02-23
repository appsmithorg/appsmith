import React, { useEffect, useRef, useMemo } from "react";
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
} from "constants/ThemeConstants";
import { getWidgets } from "sagas/selectors";
import { extractColorsFromString } from "utils/helpers";
import { TAILWIND_COLORS } from "constants/ThemeConstants";
import { useOnClickOutside } from "utils/hooks/useOnClickOutside";

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
  autoFocus?: boolean;
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

const COLOR_BOX_CLASSES = `w-6 h-6 transform border rounded-full cursor-pointer hover:ring-1 ring-gray-500 t--colorpicker-v2-color`;

/**
 * ----------------------------------------------------------------------------
 * COMPONENT
 *-----------------------------------------------------------------------------
 */
function ColorPickerComponent(props: ColorPickerProps) {
  const inputRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<any>();
  const [focussed, setFocussed] = React.useState(false);
  const [color, setColor] = React.useState(
    props.evaluatedColorValue || props.color,
  );
  const widgets = useSelector(getWidgets);
  const themeColors = useSelector(getSelectedAppThemeProperties).colors;
  const DSLStringfied = JSON.stringify(widgets);
  const applicationColors = useMemo(() => {
    return extractColorsFromString(DSLStringfied);
  }, [DSLStringfied]);

  useOnClickOutside([inputRef, popoverRef], () => {
    setFocussed(false);
  });

  /**
   * debounced onChange
   *
   */
  const debouncedOnChange = React.useCallback(
    debounce((color: string) => {
      props.changeColor(color);
    }, 250),
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

  const evaluatedValue = color || "";

  return (
    <div
      className="popover-target-colorpicker t--colorpicker-v2-popover"
      ref={inputRef}
    >
      <Popover
        boundary="viewport"
        interactionKind={PopoverInteractionKind.CLICK}
        isOpen={focussed}
        minimal
        modifiers={{
          offset: {
            offset: "0, 10px",
          },
        }}
        openOnTargetFocus
        usePortal
      >
        <div>
          <StyledInputGroup
            autoFocus={props.autoFocus}
            leftIcon={
              color ? (
                <ColorIcon className="rounded-full" color={evaluatedValue} />
              ) : (
                <ColorPickerIconContainer>
                  <ColorPickerIcon />
                </ColorPickerIconContainer>
              )
            }
            onChange={handleChangeColor}
            onFocus={() => {
              setFocussed(true);
            }}
            placeholder="enter color name or hex"
            value={evaluatedValue}
          />
        </div>
        <div className="p-3 space-y-2 w-72" ref={popoverRef}>
          {props.showThemeColors && (
            <div className="space-y-2">
              <h2 className="pb-2 font-semibold border-b">Color Styles</h2>
              <section className="space-y-2">
                <h3 className="text-xs">Theme Colors</h3>
                <div className="grid grid-cols-10 gap-2">
                  {Object.keys(themeColors).map((colorKey) => (
                    <div
                      className={`${COLOR_BOX_CLASSES} ${
                        props.color ===
                        getThemePropertyBinding(
                          `${colorsPropertyName}.${colorKey}`,
                        )
                          ? "ring-1"
                          : ""
                      }`}
                      key={`color-picker-v2-${colorKey}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setColor(themeColors[colorKey]);
                        setFocussed(false);
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
          {props.showApplicationColors && applicationColors.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs">Application Colors</h3>
              <div className="grid grid-cols-10 gap-2">
                {Object.values(applicationColors).map((colorCode: string) => (
                  <div
                    className={`${COLOR_BOX_CLASSES} ring-gray-500 ${
                      props.color === colorCode ? "ring-1" : ""
                    }`}
                    key={colorCode}
                    onClick={() => {
                      setColor(colorCode);
                      setFocussed(false);
                      props.changeColor(colorCode);
                    }}
                    style={{ backgroundColor: colorCode }}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-2">
            <h3 className="text-xs">All Colors</h3>
            <div className="grid grid-cols-10 gap-2">
              {Object.keys(TAILWIND_COLORS).map((colorKey) =>
                Object.keys(get(TAILWIND_COLORS, `${colorKey}`)).map(
                  (singleColorKey) => (
                    <div
                      className={`${COLOR_BOX_CLASSES}  ${
                        props.color ===
                        TAILWIND_COLORS[colorKey][singleColorKey]
                          ? "ring-1"
                          : ""
                      }`}
                      key={`all-colors-${colorKey}-${singleColorKey}`}
                      onClick={(e) => {
                        setFocussed(false);
                        e.stopPropagation();
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
                ),
              )}

              <div
                className={`${COLOR_BOX_CLASSES}  ${
                  props.color === "#fff" ? "ring-1" : ""
                }`}
                onClick={() => {
                  setColor("#fff");
                  props.changeColor("#fff");
                }}
              />
              <div
                className={`${COLOR_BOX_CLASSES}  diagnol-cross ${
                  props.color === "transparent" ? "ring-1" : ""
                }`}
                onClick={() => {
                  setColor("transparent");
                  props.changeColor("transparent");
                }}
              />
            </div>
          </section>
        </div>
      </Popover>
    </div>
  );
}

export default ColorPickerComponent;
