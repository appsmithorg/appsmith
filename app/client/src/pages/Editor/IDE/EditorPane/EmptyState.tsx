import React from "react";
import { Button, Flex, Text, Icon } from "design-system";

interface EmptyStateProps {
  icon: string;
  description: string;
  buttonText: string;
  onClick?: () => void;
  buttonClassName?: string;
}

const EmptyState = ({
  buttonClassName,
  buttonText,
  description,
  icon,
  onClick,
}: EmptyStateProps) => {
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
        alignItems={"center"}
        backgroundColor={"var(--ads-v2-color-bg-subtle)"}
        borderRadius={"var(--ads-v2-border-radius)"}
        height={"40px"}
        justifyContent={"center"}
        padding={"spaces-3"}
        width={"40px"}
      >
        <Icon name={icon} size={"lg"} />
      </Flex>
      <Text
        className={"text-center"}
        color={"var(--ads-v2-color-fg)"}
        kind={"heading-xs"}
      >
        {description}
      </Text>
      {onClick && (
        <Button
          className={buttonClassName}
          kind={"primary"}
          onClick={onClick}
          size={"sm"}
        >
          {buttonText}
        </Button>
      )}
    </Flex>
  );
};

export { EmptyState };
