import React, { useState, useEffect } from "react";
import clsx from "classnames";

import type { SegmentedControlProps } from "./SegmentedControl.types";
import {
  StyledSegmentedControl,
  StyledSegment,
  StyledControlContainer,
} from "./SegmentedControl.styles";
import { Icon } from "../Icon";
import { Text } from "../Text";
import {
  SegmentedControlClassName,
  SegmentedControlSegmentClassName,
  SegmentedControlSegmentEndIconClassName,
  SegmentedControlSegmentStartIconClassName,
  SegmentedControlSegmentTextClassName,
  SegmentedControlSegmentValueClassName,
  SegmentedControlSegmentsContainerClassName,
} from "./SegmentedControl.constants";

/**
 * TODO: Rewrite segmented control to stop using the options={[],[]} api and start using a nested components API, to keep it in line with all the other components and how they work.
 */
const SegmentedControl = React.forwardRef(
  (props: SegmentedControlProps, ref: React.Ref<HTMLDivElement>) => {
    const {
      className,
      defaultValue,
      isFullWidth = true,
      onChange,
      options,
      value: controlledValue,
      ...rest
    } = props;
    const segmentRefs: Array<HTMLSpanElement | null> = [];
    const [selectedValue, setSelectedValue] = useState(
      controlledValue ?? defaultValue,
    );
    const [focusedIndex, setFocusedIndex] = useState<number>(0);

    useEffect(() => {
      if (controlledValue !== undefined) {
        setSelectedValue(controlledValue);
      }
    }, [controlledValue]);

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
      if (!segmentRefs.length) return;

      switch (e.key) {
        case "ArrowRight":
        case "Right":
          const rightIndex = index === options.length - 1 ? 0 : index + 1;
          segmentRefs[rightIndex]?.focus();
          setFocusedIndex(rightIndex);
          break;

        case "ArrowLeft":
        case "Left":
          const leftIndex = index === 0 ? options.length - 1 : index - 1;
          segmentRefs[leftIndex]?.focus();
          setFocusedIndex(leftIndex);
          break;

        case "Enter":
        case " ":
          handleOnChange(options[index].value, true);
          break;
      }
    };

    const handleOnChange = (value: string, isUpdatedViaKeyboard = false) => {
      if (controlledValue === undefined) {
        setSelectedValue(value);
      }
      onChange && onChange(value, isUpdatedViaKeyboard);
    };

    return (
      <StyledSegmentedControl
        className={clsx(SegmentedControlClassName, className)}
        isFullWidth={isFullWidth}
        onBlur={() => setFocusedIndex(0)}
        ref={ref}
        {...rest}
      >
        {options.map((option, index) => {
          const {
            endIcon,
            isDisabled: isSegmentDisabled,
            label,
            startIcon,
            value,
          } = option;

          return (
            <StyledControlContainer
              className={SegmentedControlSegmentsContainerClassName}
              data-disabled={isSegmentDisabled}
              data-selected={selectedValue === value}
              key={value}
              onClick={() => !isSegmentDisabled && handleOnChange(value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              ref={(input) => segmentRefs.push(input)}
              tabIndex={index === focusedIndex ? 0 : -1}
            >
              <StyledSegment
                className={clsx(SegmentedControlSegmentClassName)}
                data-selected={selectedValue === value}
                data-value={value}
              >
                {/* if icon name is passed */}
                {startIcon && typeof startIcon === "string" && (
                  <Icon
                    className={SegmentedControlSegmentStartIconClassName}
                    name={startIcon}
                    size="md"
                  />
                )}

                {/* Label */}
                {label && (
                  <Text
                    className={clsx(
                      SegmentedControlSegmentTextClassName,
                      SegmentedControlSegmentValueClassName + value,
                    )}
                    kind="body-m"
                  >
                    {label}
                  </Text>
                )}

                {/* if icon name is passed */}
                {endIcon && typeof endIcon === "string" && (
                  <Icon
                    className={SegmentedControlSegmentEndIconClassName}
                    name={endIcon}
                    size="md"
                  />
                )}
              </StyledSegment>
            </StyledControlContainer>
          );
        })}
      </StyledSegmentedControl>
    );
  },
);

SegmentedControl.displayName = "SegmentedControl";

SegmentedControl.defaultProps = {};

export { SegmentedControl };
