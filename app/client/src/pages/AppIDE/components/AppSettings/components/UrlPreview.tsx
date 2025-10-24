import React from "react";
import styled from "styled-components";
import { Flex } from "@appsmith/ads";

const UrlPreviewWrapper = styled(Flex)`
  color: var(--ads-v2-color-fg);
  border-radius: var(--ads-v2-border-radius);
  background-color: var(--ads-v2-color-bg-subtle);
  padding: 8px 12px;
  min-height: 36px;
  align-items: center;
`;

const UrlPreviewScroll = styled.div`
  overflow-y: auto;
  word-break: break-all;
  line-height: 1.17;
  font-size: 12px;
`;

interface UrlPreviewProps {
  children: React.ReactNode;
  className?: string;
  onCopy?: () => void;
}

function UrlPreview({ children, className, onCopy }: UrlPreviewProps) {
  return (
    <UrlPreviewWrapper className={className}>
      <UrlPreviewScroll className="select-text" onClick={onCopy}>
        {children}
      </UrlPreviewScroll>
    </UrlPreviewWrapper>
  );
}

export default UrlPreview;
