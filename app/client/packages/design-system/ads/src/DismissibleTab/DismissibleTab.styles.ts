import styled from "styled-components";

import { Button as ADSButton } from "../Button";

export const Tab = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  gap: var(--ads-v2-spaces-2);
  min-height: 32px;
  max-height: 32px;
  font-size: 12px;
  color: var(--ads-v2-color-fg);
  cursor: pointer;

  border-top-left-radius: var(--ads-v2-border-radius);
  border-top-right-radius: var(--ads-v2-border-radius);
  border-left: 1px solid transparent;
  border-right: 1px solid transparent;
  border-top: 3px solid transparent;

  padding: 0 var(--ads-v2-spaces-3) 2px var(--ads-v2-spaces-3);

  &.active {
    background: var(--ads-v2-colors-control-field-default-bg);
    border-top-color: var(--ads-v2-color-bg-brand);
    border-left-color: var(--ads-v2-color-border-muted);
    border-right-color: var(--ads-v2-color-border-muted);

    span {
      font-weight: var(--ads-v2-font-weight-bold);
    }
  }

  & > .tab-close {
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover > .tab-close,
  &:focus-within > .tab-close,
  &.active > .tab-close {
    opacity: 1;
  }
`;

export const CloseButton = styled(ADSButton)`
  border-radius: 2px;
  cursor: pointer;
  padding: var(--ads-v2-spaces-1);
  max-width: 16px;
  max-height: 16px;
`;
