import React from "react";
import { Flex, Text } from "@appsmith/ads";
import { importSvg } from "@appsmith/ads-old";

import { createMessage, EDITOR_PANE_TEXTS } from "ee/constants/messages";

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
