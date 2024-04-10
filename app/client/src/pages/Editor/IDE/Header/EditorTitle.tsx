import React, { useState } from "react";
import {
  Flex,
  Text,
  Icon,
  Menu,
  MenuTrigger,
  MenuContent,
} from "design-system";

import { createMessage, HEADER_TITLES } from "@appsmith/constants/messages";
import { PagesSection } from "../EditorPane/PagesSection";
import styled from "styled-components";

const PageSwitchTrigger = styled.div<{ active: boolean }>`
  :hover {
    background-color: var(--ads-v2-color-bg-subtle);
  }
  background-color: ${(props) =>
    props.active ? `var(--ads-v2-color-bg-subtle)` : "unset"};
  cursor: pointer;
`;

const EditorTitle = ({ title }: { title: string }) => {
  const [active, setActive] = useState(false);

  return (
    <Menu onOpenChange={setActive} open={active}>
      <MenuTrigger>
        <PageSwitchTrigger
          active={active}
          className="flex align-center justify-center py-2"
        >
          <Text
            color={"var(--ads-v2-colors-content-label-inactive-fg)"}
            kind="body-m"
          >
            {createMessage(HEADER_TITLES.EDITOR) + " /"}
          </Text>
          <Flex
            alignItems={"center"}
            className={"t--pages-switcher"}
            data-active={active}
            gap={"spaces-1"}
            height={"100%"}
            justifyContent={"center"}
            paddingLeft={"spaces-2"}
          >
            <Text isBold kind={"body-m"}>
              {title}
            </Text>
            <Icon
              name={active ? "arrow-up-s-line" : "arrow-down-s-line"}
              size={"md"}
            />
          </Flex>
        </PageSwitchTrigger>
      </MenuTrigger>
      <MenuContent
        align="start"
        onEscapeKeyDown={() => {
          setActive(false);
        }}
        width="300px"
      >
        <PagesSection />
      </MenuContent>
    </Menu>
  );
};

export { EditorTitle };
