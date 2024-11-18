import { Flex } from "../../../Flex";
import React from "react";
import * as Styled from "./styles";

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
    <Flex
      flexDirection="column"
      justifyContent="center"
      maxHeight="300px"
      overflow="hidden"
    >
      {children}
    </Flex>
  );
}

function IDEHeaderDropdownHeader({
  children,
  className,
}: EditorHeaderDropdownHeader) {
  return (
    <Styled.HeaderWrapper className={className}>
      {children}
    </Styled.HeaderWrapper>
  );
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
