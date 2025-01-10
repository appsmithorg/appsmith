import React from "react";
import { Text } from "../../..";
import type { NoSearchResultsProps } from "./NoSearchResults.types";

const NoSearchResults = ({ text }: NoSearchResultsProps) => {
  return (
    <Text
      className="font-normal text-center"
      color="var(--ads-v2-color-fg-muted)"
      kind="body-s"
    >
      {text}
    </Text>
  );
};

export { NoSearchResults };
