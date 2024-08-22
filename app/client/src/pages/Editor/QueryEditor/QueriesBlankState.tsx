import React from "react";

import { EDITOR_PANE_TEXTS, createMessage } from "ee/constants/messages";

import { Flex, Text } from "@appsmith/ads";
import { importSvg } from "@appsmith/ads-old";

const QueriesBlankState = () => {
  const BlankStateIllustration = importSvg(
    async () => import("assets/images/no-query-min.svg"),
  );

  return (
    <Flex
      alignItems={"center"}
      flexDirection={"column"}
      gap={"spaces-7"}
      height={"100%"}
      justifyContent={"center"}
      width={"100%"}
    >
      <BlankStateIllustration />
      <Text color={"var(--ads-v2-color-fg)"} kind={"heading-xs"}>
        {createMessage(EDITOR_PANE_TEXTS.query_blank_state)}
      </Text>
    </Flex>
  );
};

export { QueriesBlankState };
