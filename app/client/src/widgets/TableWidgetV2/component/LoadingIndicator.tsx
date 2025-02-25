import { Flex, Spinner, Text } from "@appsmith/ads";
import { createMessage, TABLE_LOADING_RECORDS } from "ee/constants/messages";
import React from "react";

export const LoadingIndicator = () => (
  <Flex
    alignItems="center"
    background="var(--ads-v2-color-white)"
    borderTop="1px solid var(--wds-color-border-onaccent)"
    bottom="0"
    gap="spaces-3"
    left="0"
    padding="spaces-3"
    position="sticky"
    right="0"
  >
    <Spinner iconProps={{ color: "var(--ads-v2-color-gray-400)" }} size="md" />
    <Text color="var(--ads-v2-color-gray-400)" kind="body-s">
      {createMessage(TABLE_LOADING_RECORDS)}
    </Text>
  </Flex>
);
