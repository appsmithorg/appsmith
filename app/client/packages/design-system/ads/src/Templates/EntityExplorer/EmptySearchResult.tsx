import React from "react";
import { Text } from "../..";

interface EmptySearchResultProps {
  text: string;
}

const EmptySearchResult = ({ text }: EmptySearchResultProps) => {
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

export { EmptySearchResult };
