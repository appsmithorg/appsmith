import React from "react";
import { Text } from "@appsmith/ads";
import { EDITOR_PANE_TEXTS, createMessage } from "ee/constants/messages";

const EmptySearchResult = ({ type }: { type: string }) => {
  return (
    <Text
      className="font-normal text-center"
      color="var(--ads-v2-color-fg-muted)"
      kind="body-s"
    >
      {createMessage(EDITOR_PANE_TEXTS.empty_search_result, type)}
    </Text>
  );
};

export { EmptySearchResult };
