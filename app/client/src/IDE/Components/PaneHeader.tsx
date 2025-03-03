import React from "react";
import { Flex, Text } from "@appsmith/ads";

interface PaneHeaderProps {
  title: string;
  desc?: string;
  rightIcon?: React.ReactNode;
  className?: string;
}

function PaneHeader({ className, desc, rightIcon, title }: PaneHeaderProps) {
  return (
    <Flex alignItems="center" className={className} padding="spaces-4">
      <Flex flex={1} flexDirection="column" gap="spaces-2">
        <Text kind="heading-xs">{title}</Text>
        {desc && <Text kind="body-s">{desc}</Text>}
      </Flex>
      {rightIcon ? rightIcon : null}
    </Flex>
  );
}

export default PaneHeader;
