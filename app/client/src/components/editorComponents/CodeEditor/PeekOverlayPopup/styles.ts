import styled from "styled-components";
import { Divider, Flex } from "@appsmith/ads";

export const PeekOverlayContainer = styled.div<{
  $left: string;
  $top?: string;
  $bottom?: string;
}>`
  min-height: 46px;
  max-height: 252px;
  width: 300px;
  background-color: var(--ads-v2-color-bg);
  box-shadow: 0 0 10px #0000001a; // color used from designs
  border-radius: var(--ads-v2-border-radius);
  left: ${({ $left }) => $left};
  top: ${({ $top }) => $top};
  bottom: ${({ $bottom }) => $bottom};
`;

export const Header = styled(Flex)`
  padding: var(--ads-v2-spaces-2) var(--ads-v2-spaces-2) var(--ads-v2-spaces-2)
    var(--ads-v2-spaces-4);
  justify-content: space-between;
  align-items: center;
  gap: var(--ads-v2-spaces-3);
  height: 32px;
`;

export const DataType = styled.div`
  color: var(--appsmith-color-black-700);
  font-size: 12px;
`;

export const BlockDivider = styled(Divider)`
  display: block;
`;

export const PeekOverlayData = styled.div`
  min-height: 20px;
  padding: var(--ads-v2-spaces-1) 0 var(--ads-v2-spaces-1)
    var(--ads-v2-spaces-4);
  font-size: 10px;
`;

export const JsonWrapper = styled.div`
  min-height: 20px;
  max-height: 225px;
  overflow-y: auto;
`;
