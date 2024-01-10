import React from "react";
import { Flex, Text } from "design-system";
import { createMessage, EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";

const MinimalSegment = () => {
  return (
    <Flex
      alignItems={"center"}
      borderTop={"1px solid var(--ads-v2-color-border)"}
      height={"36px"}
      justifyContent={"space-between"}
      p={"spaces-2"}
      px={"spaces-3"}
      width={"100%"}
    >
      <Text kind={"body-m"}>
        {createMessage(EDITOR_PANE_TEXTS.queries_tab)}
      </Text>
      <Text kind={"body-m"}>{createMessage(EDITOR_PANE_TEXTS.js_tab)}</Text>
      <Text kind={"body-m"}>{createMessage(EDITOR_PANE_TEXTS.ui_tab)}</Text>
    </Flex>
  );
};

export { MinimalSegment };
