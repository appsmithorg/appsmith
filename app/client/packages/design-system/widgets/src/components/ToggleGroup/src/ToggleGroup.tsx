import { useGroupOrientation } from "@design-system/headless/src/hooks";
import React, { forwardRef, useRef } from "react";
import { CheckboxGroup as HeadlessToggleGroup } from "react-aria-components";
import { Text, Label, Flex } from "@design-system/widgets";
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
      ref={ref}
      {...rest}
    >
      {(Boolean(label) || Boolean(contextualHelp)) && (
        <Label
          className={styles.label}
          contextualHelp={contextualHelp}
          isRequired={isRequired}
          text={label}
        />
      )}
      <Flex
        direction={orientation === "vertical" ? "column" : "row"}
        gap={orientation === "vertical" ? "spacing-2" : "spacing-4"}
        isInner
        ref={containerRef}
      >
        {items.map((item, index) => children({ ...item, index }))}
      </Flex>
      {Boolean(errorMessage) && (
        <Text
          className={styles.error}
          color="negative"
          lineClamp={2}
          size="footnote"
        >
          {errorMessage}
        </Text>
      )}
    </HeadlessToggleGroup>
  );
};

export const ToggleGroup = forwardRef(_ToggleGroup);
