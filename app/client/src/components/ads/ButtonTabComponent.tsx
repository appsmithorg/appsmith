import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { ControlIcons } from "icons/ControlIcons";
import _ from "lodash";
import { DSEventTypes } from "utils/AppsmithUtils";
import useDSEvent from "utils/hooks/useDSEvent";

const ItemWrapper = styled.div<{ selected: boolean }>`
  min-width: 32px;
  height: 32px;
  padding: 0 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid
    ${(props) => (props.selected ? Colors.GREY_10 : Colors.GREY_5)};

  &.focused {
    background: ${Colors.GREY_3};
  }

  cursor: pointer;
  & {
    margin-right: 4px;
  }
  & > div {
    cursor: pointer;
  }
  &:hover {
    background: ${Colors.GREY_3};
  }
  &&& svg {
    path {
      fill: ${Colors.GREY_7} !important;
    }
  }
`;

const FlexWrapper = styled.div`
  display: inline-flex;
`;

export interface ButtonTabOption {
  icon: string | JSX.Element;
  value: string;
  width?: number;
}

interface ButtonTabComponentProps {
  options: ButtonTabOption[];
  values: Array<string>;
  selectButton: (value: string, isUpdatedViaKeyboard: boolean) => void;
}

const ButtonTabComponent = React.forwardRef(
  (props: ButtonTabComponentProps, ref: any) => {
    const valueSet = new Set(props.values);
    let firstValueIndex = 0;
    for (const [i, x] of props.options.entries()) {
      if (valueSet.has(x.value)) {
        firstValueIndex = i;
        break;
      }
    }

    const { emitDSEvent, eventEmitterRef } = useDSEvent<HTMLDivElement>(
      false,
      ref,
    );

    const emitKeyPressEvent = useCallback(
      (key: string) => {
        emitDSEvent({
          component: "ButtonTab",
          event: DSEventTypes.KEYPRESS,
          meta: {
            key,
          },
        });
      },
      [emitDSEvent],
    );

    const [focusedIndex, setFocusedIndex] = useState<number>(-1);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "Right":
          emitKeyPressEvent(e.key);
          setFocusedIndex((prev) =>
            prev === props.options.length - 1 ? 0 : prev + 1,
          );
          break;
        case "ArrowLeft":
        case "Left":
          emitKeyPressEvent(e.key);
          setFocusedIndex((prev) =>
            prev === 0 ? props.options.length - 1 : prev - 1,
          );
          break;
        case "Enter":
        case " ":
          emitKeyPressEvent(e.key);
          props.selectButton(props.options[focusedIndex].value, true);
          e.preventDefault();
          break;
        case "Tab":
          emitKeyPressEvent(`${e.shiftKey ? "Shift+" : ""}${e.key}`);
          break;
      }
    };

    return (
      <FlexWrapper
        onBlur={() => setFocusedIndex(-1)}
        onFocus={() => setFocusedIndex(firstValueIndex)}
        onKeyDown={handleKeyDown}
        ref={eventEmitterRef}
        role="tablist"
        tabIndex={0}
      >
        {props.options.map(
          ({ icon, value, width = 24 }: ButtonTabOption, index: number) => {
            let ControlIcon;
            if (_.isString(icon)) {
              const Icon = ControlIcons[icon];
              ControlIcon = <Icon height={24} width={width} />;
            } else {
              ControlIcon = icon;
            }
            const isSelected = valueSet.has(value);
            return (
              <ItemWrapper
                aria-selected={isSelected}
                className={`t--button-tab-${value} ${
                  index === focusedIndex ? "focused" : ""
                }`}
                key={index}
                onClick={() => {
                  props.selectButton(value, false);
                  setFocusedIndex(index);
                }}
                role="tab"
                selected={isSelected}
              >
                {ControlIcon}
              </ItemWrapper>
            );
          },
        )}
      </FlexWrapper>
    );
  },
);

export default ButtonTabComponent;
