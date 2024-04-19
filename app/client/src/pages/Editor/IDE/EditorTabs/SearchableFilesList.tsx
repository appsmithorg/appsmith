import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Fuse from "fuse.js";

import { EditorEntityTab } from "@appsmith/entities/IDE/constants";
import type { EntityItem } from "@appsmith/entities/IDE/constants";
import {
  Button,
  Flex,
  Menu,
  MenuContent,
  MenuGroup,
  MenuGroupName,
  MenuItem,
  MenuTrigger,
  SearchInput,
} from "design-system";
import { ListIconContainer, TabTextContainer } from "./StyledComponents";
import {
  SEARCHABLE_FILES_LIST,
  createMessage,
} from "@appsmith/constants/messages";
import { useCurrentEditorState } from "../hooks";

interface Props {
  allItems: EntityItem[];
  openTabs: EntityItem[];
  navigateToTab: (item: EntityItem) => void;
}

const StyledButton = styled(Button)<{ isActive?: boolean }>`
  ${({ isActive }) =>
    isActive &&
    `
    --button-color-bg: var(--ads-v2-colors-action-tertiary-surface-active-bg);
    --button-color-fg: var(--ads-v2-colors-action-tertiary-label-default-fg);
  `}
`;

const FUSE_OPTIONS = {
  shouldSort: true,
  threshold: 0.0,
  location: 0,
  keys: ["title"],
};

const SearchableFilesList = (props: Props) => {
  const { allItems, navigateToTab, openTabs } = props;
  const [files, setFiles] = useState(allItems);
  const [tabs, setTabs] = useState(openTabs);
  const [isOpen, setOpen] = useState(false);
  const { segment } = useCurrentEditorState();

  useEffect(() => {
    // reset filter
    setFiles(allItems);
    setTabs(openTabs);
  }, [isOpen]);

  if (allItems.length === 0) {
    return null;
  }

  const filterHandler = (value: string) => {
    const fuse = new Fuse(allItems, FUSE_OPTIONS);
    setFiles(value.length > 0 ? fuse.search(value) : allItems);
    setTabs(value.length > 0 ? [] : openTabs);
  };

  const renderMenuItems = (items: EntityItem[]) =>
    items.map((file) => (
      <MenuItem key={file.key} onClick={() => navigateToTab(file)}>
        <Flex
          alignItems="center"
          className={"text-ellipsis whitespace-nowrap overflow-hidden"}
          gap="spaces-2"
        >
          <ListIconContainer>{file.icon}</ListIconContainer>
          <TabTextContainer>{file.title}</TabTextContainer>
        </Flex>
      </MenuItem>
    ));

  return (
    <Menu onOpenChange={setOpen} open={isOpen}>
      <MenuTrigger>
        <StyledButton
          className="!min-w-fit"
          data-testid="t--files-list-trigger"
          isActive={isOpen}
          isIconButton
          kind="tertiary"
          onClick={() => setOpen(true)}
          startIcon="hamburger"
        />
      </MenuTrigger>
      <MenuContent
        align={"start"}
        className="!max-h-[300px]"
        height={"fit-content"}
        side={"bottom"}
        sideOffset={2}
        width="250px"
      >
        <SearchInput
          autoFocus
          data-testid={"t--files-list-search-input"}
          onChange={filterHandler}
          onKeyDown={(e: KeyboardEvent) => e.stopPropagation()}
        />
        {tabs.length > 0 ? (
          <MenuGroup>
            <MenuGroupName className="!pt-[8px]">
              {createMessage(SEARCHABLE_FILES_LIST.OPENED_GROUP_LABEL)}
            </MenuGroupName>
            {renderMenuItems(tabs)}
          </MenuGroup>
        ) : null}
        <MenuGroup>
          <MenuGroupName className="!pt-[8px]">
            {createMessage(
              SEARCHABLE_FILES_LIST.GROUP_LABEL,
              segment === EditorEntityTab.QUERIES
                ? SEARCHABLE_FILES_LIST.QUERY_TEXT
                : SEARCHABLE_FILES_LIST.JS_OBJECT_TEXT,
            )}
          </MenuGroupName>
          {renderMenuItems(files)}
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
};

export { SearchableFilesList };
