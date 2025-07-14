import React from "react";
import { Icon, Tag } from "@appsmith/ads";

function PremiumFeatureTag() {
  return (
    <Tag isClosable={false} size="md">
      <Icon name="star-line" size="sm" />
    </Tag>
  );
}

export default PremiumFeatureTag;
