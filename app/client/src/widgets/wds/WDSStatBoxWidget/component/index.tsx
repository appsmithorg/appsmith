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
    >
      {iconName && iconName !== "(none)" && (
        <Icon name={iconName} size="large" />
      )}
      <Flex direction="column" flexGrow={1} gap="spacing-3" isInner>
        {label && (
          <Text color="neutral" lineClamp={1} variant="footnote">
            {label}
          </Text>
        )}
        {value && (
          <Flex
            alignItems="end"
            flexShrink={0}
            gap="spacing-1"
            isInner
            maxWidth="calc(100% - var(--sizing-1))"
          >
            <Text fontWeight={500} lineClamp={1} variant="subtitle">
              {value}
            </Text>
            {valueChange && (
              <Text color={valueImpact} lineClamp={1} variant="footnote">
                {valueChange}
              </Text>
            )}
          </Flex>
        )}
        {sublabel && (
          <Text color="neutral" lineClamp={1} variant="footnote">
            {sublabel}
          </Text>
        )}
      </Flex>
    </Flex>
  );
};
