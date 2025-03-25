import React from "react";
import { Callout, Flex, Text } from "@appsmith/ads";

export const SchemaIsDirtyCallout = () => {
  return (
    <Callout kind="warning">
      <Flex flexDirection={"column"} gap="spaces-2">
        <Text kind="heading-s">Unsaved changes</Text>
        <Text kind="body-m">
          You&apos;ve made changes to this JS, but haven&apos;t saved the new
          schema. The agent will still use the last saved version, which may
          cause issues.
        </Text>
      </Flex>
    </Callout>
  );
};
