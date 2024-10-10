import styled from "styled-components";

import { Text as ADSText } from "@appsmith/ads";

export const Tab = styled.div`
  display: flex;
  height: 100%;
  position: relative;
  font-size: 12px;
  color: var(--ads-v2-colors-text-default);
  cursor: pointer;
  gap: var(--ads-v2-spaces-2);
  border-top: 1px solid transparent;
  border-top-left-radius: var(--ads-v2-border-radius);
  border-top-right-radius: var(--ads-v2-border-radius);
  align-items: center;
  justify-content: center;
  padding: var(--ads-v2-spaces-3);
  padding-top: 6px; // to accommodate border and make icons align correctly
  border-left: 1px solid transparent;
  border-right: 1px solid transparent;
  border-top: 2px solid transparent;

  &.active {
    background: var(--ads-v2-colors-control-field-default-bg);
    border-top-color: var(--ads-v2-color-bg-brand);
    border-left-color: var(--ads-v2-color-border-muted);
    border-right-color: var(--ads-v2-color-border-muted);
  }

  & > .tab-close {
    position: relative;
    right: -2px;
    visibility: hidden;
  }

  &:hover > .tab-close,
  &.active > .tab-close {
    visibility: visible;
  }
`;

export const IconContainer = styled.div`
  height: 12px;
  width: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  img {
    width: 12px;
  }
`;

export const Text = styled(ADSText)`
  min-width: 3ch;
  padding: 0 var(--ads-v2-spaces-1);
`;

export const CloseButton = styled.button`
  border-radius: var(--ads-v2-border-radius);
  cursor: pointer;
  padding: var(--ads-v2-spaces-1);

  &:hover {
    background: var(--ads-v2-colors-action-tertiary-surface-hover-bg);
  }
`;
