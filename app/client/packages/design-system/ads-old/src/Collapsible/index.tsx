import Icon, { IconSize } from "../Icon";
import React, { useState } from "react";
import styled from "styled-components";
import type { TextProps } from "../Text";
import Text, { TextType } from "../Text";

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: max-content;
  gap: 8px;
  color: var(--ads-v2-color-fg);
`;

const MenuHeader = styled.div`
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MenuBody = styled.div<{ isOpen: boolean }>`
  background-color: var(--ads-v2-color-bg);
  color: var(--ads-v2-color-fg);
  display: ${(props) => (props.isOpen ? "flex" : "none")};
  overflow: hidden;
  margin-left: 30px;
  flex-direction: column;
`;

export interface CollapsibleMenuProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  leftIcon?: string;
  showIcon?: boolean;
  rightIcon?: string;
  headerProps?: TextProps;
}

export function Collapsible(props: CollapsibleMenuProps) {
  const {
    children,
    className,
    headerProps,
    leftIcon,
    rightIcon,
    showIcon = true,
    title,
  } = props;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <MenuContainer className={className}>
      <MenuHeader onClick={() => setIsOpen(!isOpen)}>
        {showIcon && (
          <Icon
            name={leftIcon ? leftIcon : isOpen ? "expand-less" : "expand-more"}
            size={IconSize.XXL}
          />
        )}
        <Text type={TextType.P0} {...headerProps}>
          {title}
        </Text>
        {rightIcon && <Icon name={rightIcon} size={IconSize.XXL} />}
      </MenuHeader>
      <MenuBody isOpen={isOpen}>{children}</MenuBody>
    </MenuContainer>
  );
}

Collapsible.Header = MenuHeader;
Collapsible.Body = MenuBody;

export default Collapsible;
