import styled from "styled-components";
import { Flex } from "design-system";

/**
 * Logic for 54px in max width
 *
 * 4px  tabs + add icon container left padding
 * 4px  tabs + add icon container right padding
 * 4px  gap between tabs and add icon
 * 16px 4px gap between every tabs * 4 (since max tab count is 5,
 *      there will be 5 gaps)
 * 26px Add button width
 * 62px show more list button(considering 3 digit width as max)
 * ======================================
 * 127px
 *
 */
export const StyledTab = styled(Flex)`
  position: relative;
  top: 1px;
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

  &:hover > .tab-close {
    visibility: visible;
  }

  &.active > .tab-close {
    visibility: visible;
  }
`;

export const TabTextContainer = styled.span`
  width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`;

export const TabIconContainer = styled.div`
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

export const ListIconContainer = styled.div`
  height: 18px;
  width: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  img {
    width: 18px;
  }
`;
