import React from "react";
import type { StatBoxComponentProps } from "./types";

import styles from "./styles.module.css";
import { Flex, Icon, Text } from "@design-system/widgets";

export const StatBoxComponent = (props: StatBoxComponentProps) => {
  const {
    iconAlign,
    iconName,
    label,
    sublabel,
    value,
    valueChange,
    valueImpact,
  } = props;

  return (
    <Flex
      alignItems="center"
      className={styles.statbox}
      direction={iconAlign === "end" ? "row-reverse" : "row"}
      gap="spacing-2"
      isInner
      padding="spacing-3 "
    >
      {iconName && iconName !== "(none)" && (
        <Icon name={iconName} size="large" />
      )}
      <Flex direction="column" flexGrow={1} gap="spacing-3" isInner>
        {label && (
          <Text color="neutral" variant="footnote">
            {label}
          </Text>
        )}
        {value && (
          <Flex alignItems="end" gap="spacing-1" isInner>
            <Text variant="subtitle">{value}</Text>
            {valueChange && (
              <Text color={valueImpact} variant="footnote">
                {valueChange}
              </Text>
            )}
          </Flex>
        )}
        {sublabel && (
          <Text color="neutral" variant="footnote">
            {sublabel}
          </Text>
        )}
      </Flex>
    </Flex>
  );
};
