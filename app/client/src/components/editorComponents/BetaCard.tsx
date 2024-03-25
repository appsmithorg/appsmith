import React from "react";
import { Tag } from "design-system";

function BetaCard({ className = "" }: { className?: string }) {
  return (
    <Tag className={className} isClosable={false} size="md">
      Beta
    </Tag>
  );
}

export default BetaCard;
