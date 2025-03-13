import { Flex, Text } from "@appsmith/ads";
import NoVisualizationSVG from "assets/images/no-visualization.svg";
import React from "react";

export const EmptyVisualization = () => {
  return (
    <Flex
      alignItems="center"
      flexDirection="column"
      gap="spaces-7"
      height="100%"
      justifyContent="center"
    >
      <img alt="No visualization" src={NoVisualizationSVG} />
      <Text>The response visualization will be shown here</Text>
    </Flex>
  );
};
