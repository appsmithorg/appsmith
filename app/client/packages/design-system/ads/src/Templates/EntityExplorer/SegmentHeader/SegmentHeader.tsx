import React from "react";

import * as Styled from "./SegmentHeader.styles";

interface SegmentHeaderProps {
  children: React.ReactNode;
}
export function SegmentHeader({ children }: SegmentHeaderProps) {
  return <Styled.Root>{children}</Styled.Root>;
}
