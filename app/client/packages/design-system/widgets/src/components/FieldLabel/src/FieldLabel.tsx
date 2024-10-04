import clsx from "clsx";
import React from "react";
import { ContextualHelp, Text } from "@appsmith/wds";
import { Label as HeadlessLabel, Group } from "react-aria-components";

import styles from "./styles.module.css";
import type { LabelProps } from "./types";

export function FieldLabel(props: LabelProps) {
  const { children, contextualHelp, isDisabled, isRequired, ...rest } = props;

  if (!Boolean(children)) return null;

  return (
    <Group
      className={styles.labelGroup}
      data-field-label-wrapper=""
      isDisabled={isDisabled}
    >
      <HeadlessLabel
        {...rest}
        className={clsx(styles.label)}
        elementType="label"
      >
        <Text fontWeight={600} size="caption">
          {children}
        </Text>
        {Boolean(isRequired) && (
          <span aria-label="(required)" className={styles.necessityIndicator}>
            *
          </span>
        )}
      </HeadlessLabel>
      {Boolean(contextualHelp) && (
        <ContextualHelp contextualHelp={contextualHelp} />
      )}
    </Group>
  );
}
