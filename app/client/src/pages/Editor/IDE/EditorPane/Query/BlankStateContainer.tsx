import React from "react";
import { Flex } from "design-system";

import { BlankState } from "./BlankState";

const BlankStateContainer: React.FC = () => {
  return (
    <Flex
      flex="1"
      flexDirection="column"
      gap="spaces-3"
      overflow="hidden"
      py="spaces-3"
    >
      <BlankState />
    </Flex>
  );
};

export { BlankStateContainer };
