import React from "react";
import styled from "styled-components";
import clsx from "classnames";

import { Flex, Icon } from "@appsmith/ads";
import { sanitizeString } from "utils/URLUtils";

interface FileTabProps {
  isActive: boolean;
  title: string;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
  icon?: React.ReactNode;
}

export const StyledTab = styled(Flex)`
  position: relative;
  height: 100%;
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
  padding-top: 6px; // to accomodate border and make icons align correctly
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

export const FileTab = ({
  icon,
  isActive,
  onClick,
  onClose,
  title,
}: FileTabProps) => {
  return (
    <StyledTab
      className={clsx("editor-tab", isActive && "active")}
      data-testid={`t--ide-tab-${sanitizeString(title)}`}
      onClick={onClick}
    >
      {icon ? <TabIconContainer>{icon}</TabIconContainer> : null}
      <TabTextContainer>{title}</TabTextContainer>
      {/* not using button component because of the size not matching design */}
      <Icon
        className="tab-close rounded-[4px] hover:bg-[var(--ads-v2-colors-action-tertiary-surface-hover-bg)] cursor-pointer p-[2px]"
        data-testid="t--tab-close-btn"
        name="close-line"
        onClick={onClose}
      />
    </StyledTab>
  );
};
