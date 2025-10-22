import React from "react";
import styled from "styled-components";

const UrlPreviewWrapper = styled.div`
  height: 36px;
  color: var(--ads-v2-color-fg);
  border-radius: var(--ads-v2-border-radius);
  background-color: var(--ads-v2-color-bg-subtle);
  line-height: 1.17;
`;

const UrlPreviewScroll = styled.div`
  height: 32px;
  overflow-y: auto;
`;

interface UrlPreviewProps {
  children: React.ReactNode;
  className?: string;
  onCopy?: () => void;
}

function UrlPreview({ children, className, onCopy }: UrlPreviewProps) {
  return (
    <UrlPreviewWrapper className={className}>
      <UrlPreviewScroll
        className="py-1 pl-2 mr-0.5 text-xs break-all select-text"
        onClick={onCopy}
        style={{ lineHeight: "1.17" }}
      >
        {children}
      </UrlPreviewScroll>
    </UrlPreviewWrapper>
  );
}

export default UrlPreview;
