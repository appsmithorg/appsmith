import { Text } from "@appsmith/ads";
import { createMessage, MERGED_SUCCESSFULLY } from "ee/constants/messages";
import React from "react";

// internal dependencies
import SuccessTick from "pages/common/SuccessTick";

export default function MergeSuccessIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <SuccessTick height="36px" style={{ marginBottom: 0 }} width="30px" />
      <Text
        color={"var(--ads-v2-color-fg)"}
        kind="heading-s"
        style={{ marginLeft: 12 }}
      >
        {createMessage(MERGED_SUCCESSFULLY)}
      </Text>
    </div>
  );
}
