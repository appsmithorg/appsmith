import clsx from "clsx";
import React from "react";
import { Label as AriaLabel, Group } from "react-aria-components";
import { ContextualHelp, Text } from "@appsmith/wds";

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
      <AriaLabel {...rest} className={clsx(styles.label)}>
        <Text fontWeight={600} size="caption">
          {children}
        </Text>
        {Boolean(isRequired) && (
          <span aria-label="(required)" className={styles.necessityIndicator}>
            *
          </span>
        )}
      </AriaLabel>
      {Boolean(contextualHelp) && (
        <ContextualHelp contextualHelp={contextualHelp} />
      )}
    </Group>
  );
}
