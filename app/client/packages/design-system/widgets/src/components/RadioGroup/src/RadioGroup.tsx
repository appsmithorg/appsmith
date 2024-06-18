import React, { forwardRef, useRef } from "react";
import { RadioGroup as HeadlessRadioGroup, Radio } from "react-aria-components";
import type { ORIENTATION } from "@design-system/widgets";
import {
  Label,
  Flex,
  Text,
  ErrorMessage,
  useGroupOrientation,
} from "@design-system/widgets";
import styles from "./styles.module.css";
import type { ForwardedRef } from "react";
import type { RadioGroupProps as HeadlessRadioGroupProps } from "react-aria-components";

interface RadioGroupItemProps {
  value: string;
  label?: string;
  isSelected?: boolean;
  isDisabled?: boolean;
  index?: number;
}

export interface RadioGroupProps extends HeadlessRadioGroupProps {
  /**
   * A ContextualHelp element to place next to the label.
   */
  contextualHelp?: string;
  /**
   * The content to display as the label.
   */
  label?: string;
  /**
   * Radio that belong to this group.
   */
  items: RadioGroupItemProps[];
  /**
   * The axis the checkboxes should align with.
   * @default 'horizontal'
   */
  orientation?: keyof typeof ORIENTATION;
  /**
   * An error message for the field.
   */
  errorMessage?: string;
}

const _RadioGroup = (
  props: RadioGroupProps,
  ref: ForwardedRef<HTMLDivElement>,
) => {
  const {
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
    <HeadlessRadioGroup
      className={styles.radioGroup}
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
        {items.map(({ label, value, ...rest }, index) => (
          <Radio className={styles.radio} key={index} value={value} {...rest}>
            <Text lineClamp={1}>{label}</Text>
          </Radio>
        ))}
      </Flex>
      <ErrorMessage text={errorMessage} />
    </HeadlessRadioGroup>
  );
};

export const RadioGroup = forwardRef(_RadioGroup);
