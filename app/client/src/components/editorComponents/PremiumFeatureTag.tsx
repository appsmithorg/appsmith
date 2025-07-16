import React from "react";
import { Icon, Tag } from "@appsmith/ads";
import { VisuallyHidden } from "@react-aria/visually-hidden";

function PremiumFeatureTag() {
  return (
    <Tag isClosable={false} size="md">
      <Icon name="star-line" size="sm" />
      <VisuallyHidden>Premium feature</VisuallyHidden>
    </Tag>
  );
}

export default PremiumFeatureTag;
