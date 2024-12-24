import React from "react";
import { Button, Flex, Icon, Text } from "../../..";
import type { EmptyStateProps } from "./EmptyState.types";

const EmptyState = ({ button, description, icon }: EmptyStateProps) => {
  return (
    <Flex
      alignItems={"center"}
      flexDirection="column"
      gap="spaces-4"
      justifyContent={"center"}
      px="spaces-3"
      py="spaces-7"
    >
      <Flex
        alignItems="center"
        backgroundColor="var(--ads-v2-color-bg-subtle)"
        borderRadius="var(--ads-v2-border-radius)"
        height="var(--ads-v2-spaces-11)"
        justifyContent="center"
        padding="spaces-3"
        width="var(--ads-v2-spaces-11)"
      >
        <Icon name={icon} size="lg" />
      </Flex>
      <Text
        className="text-center"
        color="var(--ads-v2-color-fg)"
        kind="heading-xs"
      >
        {description}
      </Text>
      {button && button.onClick ? (
        <Button
          className={button.className}
          data-testid={button.testId}
          kind={button.kind || "secondary"}
          onClick={button.onClick}
          size="sm"
        >
          {button.text}
        </Button>
      ) : null}
    </Flex>
  );
};

export { EmptyState };
