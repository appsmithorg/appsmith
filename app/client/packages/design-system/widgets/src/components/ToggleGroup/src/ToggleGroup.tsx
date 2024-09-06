import React, { forwardRef, useRef } from "react";
import { CheckboxGroup as HeadlessToggleGroup } from "react-aria-components";
import { ErrorMessage, Label, Flex, useGroupOrientation } from "@appsmith/wds";
import styles from "./styles.module.css";
import type { ForwardedRef } from "react";
import type { ToggleGroupProps } from "./types";

const _ToggleGroup = (
  props: ToggleGroupProps,
  ref: ForwardedRef<HTMLDivElement>,
) => {
  const {
    children,
    contextualHelp,
    errorMessage,
    isDisabled,
    isRequired,
    items,
    label,
    ...rest
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const { orientation } = useGroupOrientation(
    { orientation: props.orientation },
    containerRef,
  );

  return (
    <HeadlessToggleGroup
      className={styles.toggleGroup}
      data-orientation={orientation}
      isDisabled={isDisabled}
      ref={ref}
      {...rest}
    >
      <Label
        contextualHelp={contextualHelp}
        isDisabled={isDisabled}
        isRequired={isRequired}
        text={label}
      />
      <Flex
        direction={orientation === "vertical" ? "column" : "row"}
        gap={orientation === "vertical" ? "spacing-2" : "spacing-4"}
        isInner
        ref={containerRef}
        wrap="wrap"
      >
        {items.map((item, index) => children({ ...item, index }))}
      </Flex>
      <ErrorMessage text={errorMessage} />
    </HeadlessToggleGroup>
  );
};

export const ToggleGroup = forwardRef(_ToggleGroup);
