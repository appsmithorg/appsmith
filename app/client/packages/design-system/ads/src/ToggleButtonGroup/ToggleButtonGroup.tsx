import React, { useState } from "react";
import clsx from "classnames";
import { ToggleButton } from "../ToggleButton";

import { Group } from "./ToggleButtonGroup.styles";
import type {
  ToggleGroupOption,
  ToggleGroupProps,
} from "./ToggleButtonGroup.types";
import { ToggleGroupClassName } from "./ToggleButtonGroup.constants";

// eslint-disable-next-line react/display-name
export const ToggleButtonGroup = React.forwardRef<
  HTMLDivElement,
  ToggleGroupProps
>((props, ref) => {
  const toggleRefs: Array<HTMLButtonElement | null> = [];

  const { className, onClick, options, values } = props;

  const valueSet = new Set(values);
  let firstValueIndex = 0;

  for (const [i, x] of options.entries()) {
    if (valueSet.has(x.value)) {
      firstValueIndex = i;
      break;
    }
  }

  const [focusedIndex, setFocusedIndex] = useState<number>(firstValueIndex);

  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    value: string,
  ) => {
    if (!toggleRefs.length) return;

    switch (e.key) {
      case "ArrowRight":
      case "Right":
        const rightIndex = index === options.length - 1 ? 0 : index + 1;

        toggleRefs[rightIndex]?.focus();
        setFocusedIndex(rightIndex);
        break;

      case "ArrowLeft":
      case "Left":
        const leftIndex = index === 0 ? options.length - 1 : index - 1;

        toggleRefs[leftIndex]?.focus();
        setFocusedIndex(leftIndex);
        break;

      case "Enter":
      case " ":
        onClick(value, true);
        e.preventDefault();
        break;

      case "Tab":
        break;
    }
  };

  return (
    <Group
      className={clsx(ToggleGroupClassName, className)}
      onBlur={() => setFocusedIndex(firstValueIndex)}
      ref={ref}
      role="tablist"
    >
      {options.map(({ icon, value }: ToggleGroupOption, index: number) => {
        const isSelected = valueSet.has(value);

        return (
          <div
            aria-selected={isSelected}
            className={`t--button-group-${value} ${
              index === focusedIndex ? "focused" : ""
            }`}
            key={index}
            role="tab"
            tabIndex={-1}
          >
            <ToggleButton
              autoFocus={index === focusedIndex}
              icon={icon}
              isDisabled={false}
              isSelected={isSelected}
              onClick={() => {
                onClick(value, false);
                setFocusedIndex(index);
              }}
              onKeyDown={(event) => handleKeyDown(event, index, value)}
              ref={(input) => toggleRefs.push(input)}
              size="md"
              tabIndex={index === focusedIndex ? 0 : -1}
            />
          </div>
        );
      })}
    </Group>
  );
});
