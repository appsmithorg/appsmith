import clsx from "clsx";
import React from "react";
import { Text, ContextualHelp } from "@appsmith/wds";
import { Label as HeadlessLabel } from "react-aria-components";
import styles from "./styles.module.css";
import type { LabelProps } from "./types";

export const Label = (props: LabelProps) => {
  const { className, contextualHelp, isDisabled, isRequired, text, ...rest } =
    props;

  if (!Boolean(text) && !Boolean(contextualHelp)) return null;

  return (
    <HeadlessLabel
      aria-label={text}
      className={clsx(className, styles.label)}
      data-disabled={isDisabled}
      data-field-label-wrapper
      elementType="label"
      {...rest}
    >
      <Text fontWeight={600} lineClamp={1} size="caption">
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
