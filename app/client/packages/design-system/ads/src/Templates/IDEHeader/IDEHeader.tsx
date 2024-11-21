import React, { type PropsWithChildren } from "react";
import { Flex } from "../../Flex";
import { IDE_HEADER_HEIGHT, LOGO_WIDTH } from "./IDEHeader.constants";

interface ChildrenProps {
  children: React.ReactNode | React.ReactNode[];
}

const Left = (props: PropsWithChildren<{ logo: React.ReactNode }>) => {
  return (
    <Flex
      alignItems="center"
      className="header-left-section"
      flex="1"
      gap="spaces-4"
      height="100%"
      justifyContent="left"
    >
      <Flex
        alignItems="center"
        borderRight="1px solid var(--ads-v2-color-border)"
        h="100%"
        justifyContent="center"
        w={`${LOGO_WIDTH}px`}
      >
        {props.logo}
      </Flex>
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

export const IDEHeader = (props: ChildrenProps) => {
  return (
    <Flex
      alignItems="center"
      background="var(--ads-v2-color-bg)"
      borderBottom="1px solid var(--ads-v2-color-border)"
      className="t--editor-header"
      height={IDE_HEADER_HEIGHT + "px"}
      overflow="hidden"
      width="100%"
    >
      {props.children}
    </Flex>
  );
};

IDEHeader.Left = Left;
IDEHeader.Center = Center;
IDEHeader.Right = Right;
