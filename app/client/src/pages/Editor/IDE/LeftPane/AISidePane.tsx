import React from "react";
import PaneHeader from "./PaneHeader";
import { Flex } from "@appsmith/ads";

const AISidePane = () => {
  return (
    <Flex
      borderRight="1px solid var(--ads-v2-color-border)"
      flexDirection="column"
      height="100%"
      width={"100%"}
    >
      <PaneHeader title="Ask AI" />
      <Flex flexDirection={"column"} height="100%" justifyContent={"flex-end"}>
        Albin
      </Flex>
    </Flex>
  );
};

export default AISidePane;
