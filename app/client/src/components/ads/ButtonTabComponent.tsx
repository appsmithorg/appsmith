import React, { useState } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { ControlIcons, ControlIconName } from "icons/ControlIcons";

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
  icon: string;
  value: string;
  width?: number;
}

interface ButtonTabComponentProps {
  options: ButtonTabOption[];
  values: Array<string>;
  selectButton: (value: string) => void;
}

function ButtonTabComponent(props: ButtonTabComponentProps) {
  const valueSet = new Set(props.values);
  let firstValueIndex = 0;
  for (const [i, x] of props.options.entries()) {
    if (valueSet.has(x.value)) {
      firstValueIndex = i;
      break;
    }
  }

  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowRight":
      case "Right":
        setFocusedIndex((prev) =>
          prev === props.options.length - 1 ? 0 : prev + 1,
        );
        break;
      case "ArrowLeft":
      case "Left":
        setFocusedIndex((prev) =>
          prev === 0 ? props.options.length - 1 : prev - 1,
        );
        break;
      case "Enter":
      case " ":
        props.selectButton(props.options[focusedIndex].value);
        e.preventDefault();
        break;
    }
  };

  return (
    <FlexWrapper
      onBlur={() => setFocusedIndex(-1)}
      onFocus={() => setFocusedIndex(firstValueIndex)}
      onKeyDown={handleKeyDown}
      role="tablist"
      tabIndex={0}
    >
      {props.options.map(
        ({ icon, value, width = 24 }: ButtonTabOption, index: number) => {
          const controlIconName: ControlIconName = icon;
          const ControlIcon = ControlIcons[controlIconName];
          const isSelected = valueSet.has(value);
          return (
            <ItemWrapper
              aria-selected={isSelected}
              className={`t--button-tab-${value} ${
                index === focusedIndex ? "focused" : ""
              }`}
              key={index}
              onClick={() => {
                props.selectButton(value);
                setFocusedIndex(index);
              }}
              role="tab"
              selected={isSelected}
            >
              <ControlIcon height={24} width={width} />
            </ItemWrapper>
          );
        },
      )}
    </FlexWrapper>
  );
}

export default ButtonTabComponent;
