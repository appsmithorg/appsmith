import React from "react";

import { BUSINESS_TAG, createMessage } from "ee/constants/messages";

import type { TagSizes } from "@appsmith/ads";
import { Tag } from "@appsmith/ads";

const BusinessTag = ({
  classes = "",
  size,
}: {
  classes?: string;
  size?: TagSizes;
}) => {
  return (
    <Tag
      className={`business-tag ${classes}`}
      data-testid="t--business-tag"
      isClosable={false}
      kind="premium"
      {...(size && { size })}
    >
      {createMessage(BUSINESS_TAG)}
    </Tag>
  );
};

export default BusinessTag;
