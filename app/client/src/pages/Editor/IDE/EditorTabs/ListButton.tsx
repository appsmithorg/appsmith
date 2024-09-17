import React, { useState } from "react";
import type { EntityItem } from "ee/entities/IDE/constants";
import {
  Button,
  Flex,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Text,
} from "@appsmith/ads";
import { ListIconContainer, ListTitle } from "./StyledComponents";

interface Props {
  items: EntityItem[];
  navigateToTab: (item: EntityItem) => void;
}

const ListButton = (props: Props) => {
  const { items, navigateToTab } = props;
  const [isOpen, setOpen] = useState(false);
  if (items.length === 0) {
    return null;
  }

  return (
    <Menu onOpenChange={setOpen} open={isOpen}>
      <MenuTrigger>
        <Button
          endIcon="arrow-down-s-line"
          id="tabs-overflow-trigger"
          kind="tertiary"
          onClick={() => setOpen(true)}
        >
          <Text kind="action-m">+ {items.length}</Text>
        </Button>
      </MenuTrigger>
      <MenuContent
        align={"end"}
        data-testId={"t--page-selection"}
        height={items.length <= 6 ? "fit-content" : "186px"}
        side={"bottom"}
        width="216px"
      >
        {items.map((item) => (
          <MenuItem key={item.key} onClick={() => navigateToTab(item)}>
            <Flex
              alignItems="center"
              className={"text-ellipsis whitespace-nowrap overflow-hidden"}
              gap="spaces-2"
            >
              <ListIconContainer>{item.icon}</ListIconContainer>
              <ListTitle>{item.title}</ListTitle>
            </Flex>
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
};

export default ListButton;
