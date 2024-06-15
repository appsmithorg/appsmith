import clsx from "clsx";
import React from "react";
import { Text, ContextualHelp } from "@design-system/widgets";
import { Label as HeadlessLabel } from "react-aria-components";
import styles from "./styles.module.css";
import type { LabelProps } from "./types";

export const Label = (props: LabelProps) => {
  const { className, contextualHelp, isRequired, text, ...rest } = props;

  return (
    <HeadlessLabel
      className={clsx(className, styles.label)}
      data-field-label-wrapper
      elementType="label"
      {...rest}
    >
      <Text fontWeight={600} size="caption">
        {text}
        {Boolean(isRequired) && (
          <span aria-label="(required)" className={styles.necessityIndicator}>
            *
          </span>
        )}
      </Text>
      {Boolean(contextualHelp) && (
        <ContextualHelp contextualHelp={contextualHelp} />
      )}
    </HeadlessLabel>
  );
};
