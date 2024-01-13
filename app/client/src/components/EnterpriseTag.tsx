import React from "react";
import type { TagSizes } from "design-system";
import { Tag } from "design-system";
import { ENTERPRISE_TAG, createMessage } from "@appsmith/constants/messages";

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
