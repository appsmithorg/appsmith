import React from "react";
import { Divider, Flex } from "design-system";
import { AppsmithLink } from "../../pages/Editor/AppsmithLink";

interface Props {
  left: React.ReactNode;
  middle: React.ReactNode;
  right: React.ReactNode;
}

export const Header = (props: Props) => {
  return (
    <Flex
      alignItems={"center"}
      border={"1px solid var(--ads-v2-color-border)"}
      className={"t--editor-header"}
      height={"40px"}
      overflow={"hidden"}
      width={"100%"}
    >
      <Flex
        alignItems={"center"}
        className={"header-left-section"}
        flex={"1"}
        gap={"spaces-4"}
        height={"100%"}
        justifyContent={"left"}
        pl={"spaces-4"}
      >
        <AppsmithLink />
        <Divider orientation="vertical" />
        {props.left}
      </Flex>
      <Flex
        alignItems={"center"}
        className={"header-center-section"}
        flex={"1"}
        height={"100%"}
        justifyContent={"center"}
      >
        {props.middle}
      </Flex>
      <Flex
        alignItems={"center"}
        className={"header-right-section"}
        flex={"1"}
        gap={"spaces-3"}
        height={"100%"}
        justifyContent={"right"}
      >
        {props.right}
      </Flex>
    </Flex>
  );
};
