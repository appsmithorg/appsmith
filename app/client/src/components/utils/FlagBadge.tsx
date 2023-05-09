import React from "react";
import { Tag } from "design-system";

function FlagBadge(props: { name: string }) {
  return <Tag isClosable={false}>{props.name}</Tag>;
}

export default FlagBadge;
