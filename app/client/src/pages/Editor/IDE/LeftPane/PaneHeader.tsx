import React from "react";
import styled from "styled-components";
import { Flex, Text } from "@appsmith/ads";

interface Props {
  title: string;
  rightIcon?: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
  description?: string;
  autoHeight?: boolean;
}

const FIXED_HEIGHT = 40;

const Container = styled.div<Pick<Props, "variant" | "autoHeight">>`
  background: ${({ variant }) =>
    variant == "primary" ? "var(--ads-v2-color-gray-50)" : ""};
  padding: var(--ads-v2-spaces-3) var(--ads-v2-spaces-4);
  padding-right: var(--ads-v2-spaces-2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: ${({ autoHeight }) => (autoHeight ? "auto" : FIXED_HEIGHT + "px")};
  span {
    line-height: 20px;
  }
`;

function PaneHeader({
  autoHeight = false,
  className,
  description,
  rightIcon,
  title,
  variant = "primary",
}: Props) {
  return (
    <Container autoHeight={autoHeight} className={className} variant={variant}>
      <Flex flexDirection="column" gap="spaces-2">
        <Text kind="heading-xs">{title}</Text>
        {description && (
          <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
            {description}
          </Text>
        )}
      </Flex>
      {rightIcon ? rightIcon : null}
    </Container>
  );
}

export default PaneHeader;
