import React from "react";
import { Flex } from "design-system";

import { Empty } from "./Empty";

const SplitScreenEmpty: React.FC = () => {
  return (
    <Flex
      flex="1"
      flexDirection="column"
      gap="spaces-3"
      overflow="hidden"
      py="spaces-3"
    >
      <Empty />
    </Flex>
  );
};

export { SplitScreenEmpty };
