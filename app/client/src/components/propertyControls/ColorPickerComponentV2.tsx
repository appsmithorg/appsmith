import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
} from "react";
import styled from "styled-components";
import { Switch } from "@appsmith/ads";
import {
  Popover,
  InputGroup,
  PopoverInteractionKind,
  Classes,
} from "@blueprintjs/core";
import { debounce, get } from "lodash";
import { useSelector } from "react-redux";
import { getSelectedAppThemeProperties } from "selectors/appThemingSelectors";
import {
  colorsPropertyName,
  getThemePropertyBinding,
} from "constants/ThemeConstants";
import { getWidgets } from "sagas/selectors";
import {
  extractColorsFromString,
  isEmptyOrNill,
  isValidColor,
} from "utils/helpers";
import { TAILWIND_COLORS } from "constants/ThemeConstants";
import useDSEvent from "utils/hooks/useDSEvent";
import { DSEventTypes } from "utils/AppsmithUtils";
import { getBrandColors } from "ee/selectors/tenantSelectors";
import FocusTrap from "focus-trap-react";
import { createMessage, FULL_COLOR_PICKER_LABEL } from "ee/constants/messages";

const MAX_COLS = 10;

/**
 * ----------------------------------------------------------------------------
 * TYPES
 *-----------------------------------------------------------------------------
 */
interface ColorPickerProps {
  color: string;
  changeColor: (color: string, isUpdatedViaKeyboard: boolean) => void;
  showThemeColors?: boolean;
  showApplicationColors?: boolean;
  evaluatedColorValue?: string;
  autoFocus?: boolean;
  isOpen?: boolean;
  placeholderText?: string;
  portalContainer?: HTMLElement;
  onPopupClosed?: () => void;
  isFullColorPicker?: boolean;
  setFullColorPicker?: (value: boolean) => void;
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

export const StyledInputGroup = styled(InputGroup)<{
  $isValid?: boolean;
  $isFullColorPicker?: boolean;
}>`
  .${Classes.INPUT} {
    box-shadow: none;
    border: 1px solid var(--ads-v2-color-border);
    border-radius: var(--ads-v2-border-radius);
    &:focus {
      box-shadow: none;
    }
  }
  &&& input {
    padding: ${({ $isFullColorPicker }) =>
      $isFullColorPicker ? "0px 2px" : "0 10px 0 36px"};
    height: 36px;
    border: ${({ $isValid }) =>
      $isValid
        ? "1px solid var(--ads-v2-color-border)"
        : "1px solid var(--ads-v2-color-border-error)"};
    background: ${(props) =>
      props.theme.colors.propertyPane.multiDropdownBoxHoverBg};
    color: ${(props) => props.theme.colors.propertyPane.label};

    &:focus-visible {
      outline: var(--ads-v2-border-width-outline) solid
        var(--ads-v2-color-outline);
      outline-offset: var(--ads-v2-offset-outline);
    }

    &:hover {
      border-color: ${({ $isValid }) =>
        $isValid
          ? "var(--ads-v2-color-border-emphasis)"
          : "var(--ads-v2-color-border-error)"};
    }
  }
`;

const COLOR_BOX_CLASSES = `w-6 h-6 transform border rounded-full cursor-pointer hover:ring-1 ring-gray-500 t--colorpicker-v2-color focus:ring-2`;

interface ColorPickerPopupProps {
  color: string;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  setColor: (color: string) => unknown;
  setIsOpen: (isOpen: boolean) => unknown;
  changeColor: (color: string, isUpdatedViaKeyboard: boolean) => unknown;
  showThemeColors?: boolean;
  showApplicationColors?: boolean;
}

const PopupContainer = styled.div`
  padding: 0.75rem;
  border-radius: var(--ads-v2-border-radius);
  border: 1px solid var(--ads-v2-color-border);
`;

function ColorPickerPopup(props: ColorPickerPopupProps) {
  const themeColors = useSelector(getSelectedAppThemeProperties).colors;
  const brandColors = useSelector(getBrandColors);
  const widgets = useSelector(getWidgets);
  const applicationColors = useMemo(() => {
    return extractColorsFromString(widgets);
  }, []);
  const {
    changeColor,
    color,
    containerRef,
    setColor,
    setIsOpen,
    showApplicationColors,
    showThemeColors,
  } = props;

  const isClick = useRef(false);
  const [isFocusTrapped, setIsFocusTrapped] = useState(false);

  function handleFocus() {
    if (!isClick.current) setIsFocusTrapped(true);
  }

  function handleClick() {
    isClick.current = true;
  }

  function handleKeyDown() {
    isClick.current = false;
  }

  const popup = (
    <PopupContainer
      className="space-y-2"
      data-testid="color-picker"
      onClick={handleClick}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      ref={containerRef}
    >
      {showThemeColors && (
        <div className="space-y-2">
          <h2 className="pb-2 font-semibold border-b">Color Styles</h2>
          <section className="space-y-2">
            <h3 className="text-xs">Theme Colors</h3>
            <div className="grid grid-cols-5 gap-2">
              {Object.keys(themeColors).map((colorKey, colorIndex) => (
                <div
                  className={`${COLOR_BOX_CLASSES} ${
                    props.color === themeColors[colorKey] ? "ring-1" : ""
                  }`}
                  key={`color-picker-v2-${colorKey}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setColor(themeColors[colorKey]);
                    setIsOpen(false);
                    changeColor(
                      getThemePropertyBinding(
                        `${colorsPropertyName}.${colorKey}`,
                      ),
                      !e.isTrusted,
                    );
                  }}
                  style={{ backgroundColor: themeColors[colorKey] }}
                  tabIndex={colorIndex === 0 ? 0 : -1}
                />
              ))}
            </div>
          </section>
        </div>
      )}
      {brandColors && Object.keys(brandColors).length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs">Brand Colors</h3>
          <div className="grid grid-cols-5 gap-2">
            {Object.keys(brandColors).map(
              (colorKey: string, colorIndex: number) => (
                <div
                  className={`${COLOR_BOX_CLASSES} ring-gray-500 ${
                    color === brandColors[colorKey] ? "ring-1" : ""
                  }`}
                  key={`${colorKey}-${colorIndex}`}
                  onClick={(e) => {
                    setColor(brandColors[colorKey]);
                    setIsOpen(false);
                    changeColor(brandColors[colorKey], !e.isTrusted);
                  }}
                  style={{ backgroundColor: brandColors[colorKey] }}
                  tabIndex={colorIndex === 0 ? 0 : -1}
                />
              ),
            )}
          </div>
        </section>
      )}
      {showApplicationColors && applicationColors.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs">Application Colors</h3>
          <div className="grid grid-cols-5 gap-2">
            {Object.values(applicationColors).map(
              (colorCode: string, colorIndex) => (
                <div
                  className={`${COLOR_BOX_CLASSES} ring-gray-500 ${
                    color === colorCode ? "ring-1" : ""
                  }`}
                  key={colorCode}
                  onClick={(e) => {
                    setColor(colorCode);
                    setIsOpen(false);
                    changeColor(colorCode, !e.isTrusted);
                  }}
                  style={{ backgroundColor: colorCode }}
                  tabIndex={colorIndex === 0 ? 0 : -1}
                />
              ),
            )}
          </div>
        </section>
      )}

      <section className="space-y-2">
        {(showThemeColors ||
          (brandColors && Object.keys(brandColors).length > 0) ||
          (showApplicationColors && applicationColors.length > 0)) && (
          <h3 className="text-xs">All Colors</h3>
        )}
        <div
          className="grid grid-cols-5 gap-2 t--tailwind-colors"
          data-testid="t--all-colors"
        >
          {Object.keys(TAILWIND_COLORS).map((colorKey, rowIndex) =>
            Object.keys(get(TAILWIND_COLORS, `${colorKey}`)).map(
              (singleColorKey, colIndex) => (
                <div
                  className={`${COLOR_BOX_CLASSES}  ${
                    color === TAILWIND_COLORS[colorKey][singleColorKey]
                      ? "ring-1"
                      : ""
                  }`}
                  key={`all-colors-${colorKey}-${singleColorKey}`}
                  onClick={(e) => {
                    setIsOpen(false);
                    e.stopPropagation();
                    setColor(TAILWIND_COLORS[colorKey][singleColorKey]);
                    changeColor(
                      TAILWIND_COLORS[colorKey][singleColorKey],
                      !e.isTrusted,
                    );
                  }}
                  style={{
                    backgroundColor: TAILWIND_COLORS[colorKey][singleColorKey],
                  }}
                  tabIndex={rowIndex === 0 && colIndex === 0 ? 0 : -1}
                />
              ),
            ),
          )}
        </div>
      </section>
    </PopupContainer>
  );

  return (
    <FocusTrap
      active={isFocusTrapped}
      focusTrapOptions={{
        onDeactivate: () => {
          setIsFocusTrapped(false);
        },
        clickOutsideDeactivates: true,
        returnFocusOnDeactivate: true,
      }}
    >
      {popup}
    </FocusTrap>
  );
}

/**
 * ----------------------------------------------------------------------------
 * COMPONENT
 *-----------------------------------------------------------------------------
 */

interface LeftIconProps {
  color: string;
  handleInputClick?: () => void;
}

export function LeftIcon(props: LeftIconProps) {
  return isValidColor(props.color) && !isEmptyOrNill(props.color) ? (
    <ColorIcon
      className="rounded-full cursor-pointer"
      color={props.color}
      onClick={props.handleInputClick}
    />
  ) : (
    <ColorIcon
      className="rounded-full cursor-pointer"
      color="white"
      onClick={props.handleInputClick}
    />
  );
}

const DEBOUNCE_TIMER = 250;
const POPOVER_MODFIER = {
  offset: {
    offset: "0, 10px",
  },
};

const ColorPickerComponent = React.forwardRef(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (props: ColorPickerProps, containerRef: any) => {
    const {
      isFullColorPicker: defaultFullColorPickerValue = false,
      isOpen: isOpenProp = false,
      placeholderText,
      setFullColorPicker: setDefaultFullColorPickerValue,
    } = props;
    const popupRef = useRef<HTMLDivElement>(null);
    const inputGroupRef = useRef<HTMLInputElement>(null);
    // isClick is used to track whether the input field is in focus by mouse click or by keyboard
    // This is used since we open the popup only on mouse click not on keyboard focus
    const isClick = useRef(false);
    const [isOpen, setIsOpen] = React.useState(isOpenProp);
    const [color, setColor] = React.useState(
      props.evaluatedColorValue || props.color,
    );

    const [isFullColorPicker, setFullColorPicker] = React.useState(
      defaultFullColorPickerValue,
    );

    const debouncedOnChange = useMemo(() => {
      return debounce((color: string, isUpdatedViaKeyboard: boolean) => {
        props.changeColor(color, isUpdatedViaKeyboard);
      }, DEBOUNCE_TIMER);
    }, [props]);

    useEffect(() => {
      setIsOpen(isOpenProp);
    }, [isOpenProp, setIsOpen]);

    const currentFocus = useRef(0);

    const { emitDSEvent } = useDSEvent<HTMLDivElement>(false, containerRef);

    const emitKeyPressEvent = useCallback(
      (key: string) => {
        emitDSEvent({
          component: "ColorPicker",
          event: DSEventTypes.KEYPRESS,
          meta: {
            key,
          },
        });
      },
      [emitDSEvent],
    );

    const handleKeydown = (e: KeyboardEvent) => {
      if (isFullColorPicker) return;

      if (isOpen) {
        switch (e.key) {
          case "Escape":
            emitKeyPressEvent(e.key);
            setIsOpen(false);
            setTimeout(() => {
              inputGroupRef.current?.focus();
            }, 300);
            e.stopPropagation();
            break;
          case "Tab":
            emitKeyPressEvent(`${e.shiftKey ? "Shift+" : ""}${e.key}`);
            currentFocus.current = 0;

            if (document.activeElement === inputGroupRef.current) {
              setTimeout(() => {
                const firstElement = popupRef.current?.querySelectorAll(
                  "[tabindex='0']",
                  // TODO: Fix this the next time the file is edited
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                )?.[0] as any;

                firstElement?.focus();
              });
            }

            break;
          case "Enter":
            emitKeyPressEvent(e.key);
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (document.activeElement as any)?.click();
            setTimeout(() => {
              inputGroupRef.current?.focus();
            }, 300);
            e.preventDefault();
            break;
          case "ArrowRight": {
            emitKeyPressEvent(e.key);
            const totalColors =
              document.activeElement?.parentElement?.childElementCount ?? 0;

            currentFocus.current = currentFocus.current + 1;

            if (
              currentFocus.current % MAX_COLS === 0 ||
              currentFocus.current >= totalColors
            )
              currentFocus.current =
                currentFocus.current % MAX_COLS === 0
                  ? currentFocus.current - MAX_COLS
                  : totalColors - (totalColors % MAX_COLS);

            (
              document.activeElement?.parentElement?.childNodes[
                currentFocus.current
                // TODO: Fix this the next time the file is edited
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ] as any
            ).focus();
            break;
          }
          case "ArrowLeft": {
            emitKeyPressEvent(e.key);
            const totalColors =
              document.activeElement?.parentElement?.childElementCount ?? 0;

            currentFocus.current = currentFocus.current - 1;

            if (
              currentFocus.current < 0 ||
              currentFocus.current % MAX_COLS === MAX_COLS - 1
            ) {
              currentFocus.current = currentFocus.current + MAX_COLS;

              if (currentFocus.current > totalColors)
                currentFocus.current = totalColors - 1;
            }

            (
              document.activeElement?.parentElement?.childNodes[
                currentFocus.current
                // TODO: Fix this the next time the file is edited
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ] as any
            ).focus();
            break;
          }
          case "ArrowDown": {
            emitKeyPressEvent(e.key);
            const totalColors =
              document.activeElement?.parentElement?.childElementCount ?? 0;

            if (totalColors < MAX_COLS) break;

            currentFocus.current = currentFocus.current + MAX_COLS;

            if (currentFocus.current >= totalColors)
              currentFocus.current = currentFocus.current % MAX_COLS;

            (
              document.activeElement?.parentElement?.childNodes[
                currentFocus.current
                // TODO: Fix this the next time the file is edited
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ] as any
            ).focus();
            break;
          }
          case "ArrowUp": {
            emitKeyPressEvent(e.key);
            const totalColors =
              document.activeElement?.parentElement?.childElementCount ?? 0;

            if (totalColors < MAX_COLS) break;

            currentFocus.current = currentFocus.current - MAX_COLS;

            if (currentFocus.current < 0) {
              const factor = Math.floor(totalColors / MAX_COLS) * MAX_COLS;
              const nextIndex = factor + currentFocus.current + MAX_COLS;

              if (nextIndex >= totalColors)
                currentFocus.current = nextIndex - MAX_COLS;
              else currentFocus.current = nextIndex;
            }

            (
              document.activeElement?.parentElement?.childNodes[
                currentFocus.current
                // TODO: Fix this the next time the file is edited
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ] as any
            ).focus();
            break;
          }
        }
      } else if (document.activeElement === inputGroupRef.current) {
        switch (e.key) {
          case "Enter":
            emitKeyPressEvent(e.key);
            setIsOpen(true);
            const firstElement = popupRef.current?.querySelectorAll(
              "[tabindex='0']",
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            )?.[0] as any;

            firstElement?.focus();
            break;
          case "Escape":
            emitKeyPressEvent(e.key);
            inputGroupRef.current?.blur();
            break;
          case "Tab":
            emitKeyPressEvent(`${e.shiftKey ? "Shift+" : ""}${e.key}`);
        }
      }
    };

    useEffect(() => {
      document.body.addEventListener("keydown", handleKeydown);

      return () => {
        document.body.removeEventListener("keydown", handleKeydown);
      };
    }, [handleKeydown]);

    const handleChangeColor = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value || "";

        if (isValidColor(value)) {
          debouncedOnChange(value, true);
        }

        setColor(value);
      },
      [debouncedOnChange],
    );

    // if props.color changes and state color is different,
    // sets the state color to props color
    useEffect(() => {
      if (props.color !== color) {
        setColor(props.color);
      }
    }, [props.color]);

    const handleInputClick = () => {
      if (isFullColorPicker && isOpen) {
        setIsOpen(false);
      } else {
        isClick.current = true;
      }
    };

    const handleFullColorPickerClick = (value: boolean) => {
      setFullColorPicker(value);
      setDefaultFullColorPickerValue && setDefaultFullColorPickerValue(value);
      setIsOpen(false);
    };

    const handleOnInteraction = (nextOpenState: boolean) => {
      if (isFullColorPicker && !isOpen) return;

      if (isOpen !== nextOpenState) {
        if (isClick.current) setIsOpen(true);
        else setIsOpen(nextOpenState);

        isClick.current = false;
      }
    };

    return (
      <div
        className="popover-target-colorpicker t--colorpicker-v2-popover"
        ref={containerRef}
      >
        <Popover
          autoFocus={false}
          boundary="viewport"
          enforceFocus={false}
          interactionKind={PopoverInteractionKind.CLICK}
          isOpen={isOpen}
          minimal
          modifiers={POPOVER_MODFIER}
          onClosed={props.onPopupClosed}
          onInteraction={handleOnInteraction}
          popoverClassName="color-picker-input"
          portalContainer={props.portalContainer}
        >
          <StyledInputGroup
            $isFullColorPicker={isFullColorPicker}
            $isValid={isValidColor(color)}
            autoFocus={props.autoFocus}
            data-testid="t--color-picker-input"
            inputRef={inputGroupRef}
            leftIcon={
              !isFullColorPicker ? (
                <LeftIcon color={color} handleInputClick={handleInputClick} />
              ) : null
            }
            onChange={handleChangeColor}
            onClick={handleInputClick}
            placeholder={placeholderText || "enter color name or hex"}
            type={isFullColorPicker ? "color" : "text"}
            value={color}
          />

          <ColorPickerPopup
            changeColor={props.changeColor}
            color={color}
            containerRef={popupRef}
            setColor={setColor}
            setIsOpen={setIsOpen}
            showApplicationColors={props.showApplicationColors}
            showThemeColors={props.showThemeColors}
          />
        </Popover>
        <div className="mt-2">
          <Switch
            isSelected={isFullColorPicker}
            onChange={handleFullColorPickerClick}
          >
            {createMessage(FULL_COLOR_PICKER_LABEL)}
          </Switch>
        </div>
      </div>
    );
  },
);

export default ColorPickerComponent;
