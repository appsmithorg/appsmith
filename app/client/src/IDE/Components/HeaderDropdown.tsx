import { Flex } from "@appsmith/ads";
import React from "react";
import styled from "styled-components";

const Container = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 0 auto 1fr auto auto auto auto auto;
    height: 32px;
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

function EditorHeaderDropdown({ children }: EditorHeaderDropdown) {
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

function EditorHeaderDropdownHeader({
  children,
  className,
}: EditorHeaderDropdownHeader) {
  return <HeaderWrapper className={className}>{children}</HeaderWrapper>;
}

function EditorHeaderDropdownBody({ children }: EditorHeaderDropdownBody) {
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

EditorHeaderDropdown.Header = EditorHeaderDropdownHeader;
EditorHeaderDropdown.Body = EditorHeaderDropdownBody;

export default EditorHeaderDropdown;
