import { Flex } from "../Flex";
import React from "react";
import styled from "styled-components";

const Container = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 0 auto 1fr auto auto auto auto auto;
    height: 32px;

    & .t--entity-name {
      padding-left: var(--ads-v2-spaces-3);
    }
  }
`;

const HeaderWrapper = styled.div`
  padding: var(--ads-v2-spaces-3);
  padding-right: var(--ads-v2-spaces-2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  span {
    line-height: 20px;
  }
`;

interface EditorHeaderDropdown {
  children: React.ReactNode;
}

interface EditorHeaderDropdownHeader {
  children: React.ReactNode;
  className?: string;
}

interface EditorHeaderDropdownBody {
  children: React.ReactNode;
}

export function IDEHeaderDropdown({ children }: EditorHeaderDropdown) {
  return (
    <Container
      flexDirection="column"
      justifyContent="center"
      maxHeight="300px"
      overflow="hidden"
    >
      {children}
    </Container>
  );
}

function IDEHeaderDropdownHeader({
  children,
  className,
}: EditorHeaderDropdownHeader) {
  return <HeaderWrapper className={className}>{children}</HeaderWrapper>;
}

function IDEHeaderDropdownBody({ children }: EditorHeaderDropdownBody) {
  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      overflow="auto"
      px="spaces-2"
      width="100%"
    >
      {children}
    </Flex>
  );
}

IDEHeaderDropdown.Header = IDEHeaderDropdownHeader;
IDEHeaderDropdown.Body = IDEHeaderDropdownBody;
