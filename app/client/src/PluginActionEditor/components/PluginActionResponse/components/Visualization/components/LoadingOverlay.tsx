import { Flex, Text } from "@appsmith/ads";
import React from "react";

export const LoadingOverlay = () => {
  return (
    <Flex
      alignItems="center"
      backgroundColor="color-mix(in srgb, var(--ads-v2-color-gray-800) 80%, transparent);"
      bottom="0"
      flexDirection="column"
      justifyContent="center"
      left="0"
      position="absolute"
      right="0"
      top="0"
    >
      <Text color="var(--ads-v2-color-white)" kind="heading-m">
        Generating visualization...
      </Text>
    </Flex>
  );
};
