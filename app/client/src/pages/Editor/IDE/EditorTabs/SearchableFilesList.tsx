import React, { useEffect, useState } from "react";
import styled from "styled-components";

import type { EntityItem } from "@appsmith/entities/IDE/constants";
import {
  Button,
  Flex,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  SearchInput,
} from "design-system";
import { ListIconContainer, TabTextContainer } from "./StyledComponents";

interface Props {
  items: EntityItem[];
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

const SearchableFilesList = (props: Props) => {
  const { items, navigateToTab } = props;
  const [files, setFiles] = useState(items);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    // reset filter
    setFiles(items);
  }, [isOpen]);

  if (items.length === 0) {
    return null;
  }

  const filterHandler = (value: string) => {
    const _files = [...items].filter((item) => item.title.includes(value));
    setFiles(_files);
  };

  return (
    <Menu onOpenChange={setOpen} open={isOpen}>
      <MenuTrigger>
        <StyledButton
          id="tabs-overflow-trigger"
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
        data-testId={"t--page-selection"}
        height={"fit-content"}
        side={"bottom"}
        sideOffset={2}
        width="250px"
      >
        <SearchInput
          autoFocus
          onChange={filterHandler}
          onKeyDown={(e: KeyboardEvent) => e.stopPropagation()}
        />
        {files.map((file) => (
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
        ))}
      </MenuContent>
    </Menu>
  );
};

export { SearchableFilesList };
