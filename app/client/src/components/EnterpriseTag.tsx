import React from "react";

import { ENTERPRISE_TAG, createMessage } from "ee/constants/messages";

import type { TagSizes } from "@appsmith/ads";
import { Tag } from "@appsmith/ads";

const EnterpriseTag = ({
  classes = "",
  size,
}: {
  classes?: string;
  size?: TagSizes;
}) => {
  return (
    <Tag
      className={`enterprise-tag ${classes}`}
      data-testid="t--enterprise-tag"
      isClosable={false}
      kind="special"
      {...(size && { size })}
    >
      {createMessage(ENTERPRISE_TAG)}
    </Tag>
  );
};

export default EnterpriseTag;
