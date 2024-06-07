import React from "react";
import type { StatsComponentProps } from "./types";

import { Flex, Icon, Text } from "@design-system/widgets";

export const StatsComponent = (props: StatsComponentProps) => {
  const {
    caption,
    iconAlign,
    iconName,
    label,
    onClick,
    value,
    valueChange,
    valueChangeColor,
    valueColor,
  } = props;

  return (
    <Flex
      alignItems="center"
      direction={iconAlign === "end" ? "row-reverse" : "row"}
      gap="spacing-2"
      isInner
      onClick={onClick}
    >
      {iconName && iconName !== "(none)" && (
        <Icon name={iconName} size="large" />
      )}
      <Flex direction="column" flexGrow={1} gap="spacing-3" isInner>
        {label && (
          <Text color="neutral" lineClamp={1} size="footnote">
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
            <Text
              color={valueColor}
              fontWeight={500}
              lineClamp={1}
              size="subtitle"
            >
              {value}
            </Text>
            {valueChange && (
              <Text color={valueChangeColor} lineClamp={1} size="footnote">
                {valueChange}
              </Text>
            )}
          </Flex>
        )}
        {caption && (
          <Text color="neutral" lineClamp={1} size="footnote">
            {caption}
          </Text>
        )}
      </Flex>
    </Flex>
  );
};
