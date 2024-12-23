import React from "react";
import {
  Flex,
  Icon,
  Text,
  Button,
  type IconNames,
  type ButtonKind,
} from "../..";

interface EmptyStateProps {
  icon: IconNames;
  description: string;
  button?: {
    text: string;
    onClick?: () => void;
    kind?: ButtonKind;
    className?: string;
    testId?: string;
  };
}

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
      {button ? (
        <Button
          className={button.className}
          data-testid={button.testId}
          disabled={button.onClick === undefined}
          kind={button.kind}
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
