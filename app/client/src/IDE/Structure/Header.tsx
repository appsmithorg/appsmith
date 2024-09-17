import React from "react";
import { Divider, Flex } from "@appsmith/ads";
import { AppsmithLink } from "pages/Editor/AppsmithLink";
import { IDE_HEADER_HEIGHT } from "./constants";

interface ChildrenProps {
  children: React.ReactNode | React.ReactNode[];
}

const Left = (props: ChildrenProps) => {
  return (
    <Flex
      alignItems="center"
      className="header-left-section"
      flex="1"
      gap="spaces-4"
      height="100%"
      justifyContent="left"
      pl="spaces-4"
    >
      <AppsmithLink />
      <Divider orientation="vertical" />
      {props.children}
    </Flex>
  );
};

const Center = (props: ChildrenProps) => {
  return (
    <Flex
      alignItems="center"
      className="header-center-section"
      flex="1"
      height="100%"
      justifyContent="center"
    >
      {props.children}
    </Flex>
  );
};

const Right = (props: ChildrenProps) => {
  return (
    <Flex
      alignItems="center"
      className="header-right-section"
      flex="1"
      gap="spaces-3"
      height="100%"
      justifyContent="right"
    >
      {props.children}
    </Flex>
  );
};

const Header = (props: ChildrenProps) => {
  return (
    <Flex
      alignItems="center"
      border="1px solid var(--ads-v2-color-border)"
      className="t--editor-header"
      height={IDE_HEADER_HEIGHT + "px"}
      overflow="hidden"
      width="100%"
    >
      {props.children}
    </Flex>
  );
};

Header.Left = Left;
Header.Center = Center;
Header.Right = Right;

export default Header;
