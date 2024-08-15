import React from "react";
import { Tag } from "@appsmith/ads";

export default function DefaultTag() {
  return (
    <Tag data-testid="t--default-tag" isClosable={false} size="sm">
      Default
    </Tag>
  );
}
