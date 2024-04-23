import React, { useState } from "react";
import {
  Flex,
  Text,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "design-system";

import { createMessage, HEADER_TITLES } from "@appsmith/constants/messages";
import { PagesSection } from "../EditorPane/PagesSection";
import styled from "styled-components";

const PageSwitchTrigger = styled.div<{ active: boolean }>`
  border-radius: var(--ads-v2-border-radius);
  background-color: ${(props) =>
    props.active ? `var(--ads-v2-color-bg-subtle)` : "unset"};
  cursor: pointer;
  padding: var(--ads-v2-spaces-2);
  :hover {
    background-color: var(--ads-v2-color-bg-subtle);
  }
`;

const EditorTitle = ({ title }: { title: string }) => {
  const [active, setActive] = useState(false);

  const closeMenu = () => {
    setActive(false);
  };

  return (
    <Popover onOpenChange={setActive} open={active}>
      <PopoverTrigger>
        <PageSwitchTrigger
          active={active}
          className="flex align-center justify-center"
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
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="!p-0 !pb-1"
        onEscapeKeyDown={closeMenu}
      >
        <PagesSection onItemSelected={closeMenu} />
      </PopoverContent>
    </Popover>
  );
};

export { EditorTitle };
