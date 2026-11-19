import React from "react";
import { Tag } from "@appsmith/ads";
import { createMessage, BETA_TAG } from "ee/constants/messages";

function BetaCard() {
  return (
    <Tag isClosable={false} size="md">
      {createMessage(BETA_TAG)}
    </Tag>
  );
}

export default BetaCard;
