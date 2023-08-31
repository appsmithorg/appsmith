import React from "react";
import type { TagSizes } from "design-system";
import { Tag } from "design-system";
import { BUSINESS_TAG, createMessage } from "@appsmith/constants/messages";

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
