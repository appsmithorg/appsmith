import React from "react";
import { Flex } from "design-system";
import PropertySelector from "./PropertySelector";

const Toolbar = () => {
  return (
    <Flex flexDirection="column">
      <PropertySelector />
    </Flex>
  );
};

export default Toolbar;
