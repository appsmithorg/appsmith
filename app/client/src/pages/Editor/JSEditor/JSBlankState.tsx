import React from "react";
import { Flex, Text } from "@appsmith/ads";
import { importSvg } from "@appsmith/ads-old";

import { createMessage, EDITOR_PANE_TEXTS } from "ee/constants/messages";

const JSBlankState = () => {
  const BlankStateIllustration = importSvg(
    async () => import("assets/images/no-js-min.svg"),
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
        {createMessage(EDITOR_PANE_TEXTS.js_blank_state)}
      </Text>
    </Flex>
  );
};

export default JSBlankState;
