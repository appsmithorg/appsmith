import React, { useState } from "react";
import type { EntityItem } from "@appsmith/entities/IDE/constants";
import {
  Button,
  Flex,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Text,
} from "design-system";

interface Props {
  items: EntityItem[];
  navigateToTab: (item: EntityItem) => void;
}

const ListButton = (props: Props) => {
  const [isOpen, setOpen] = useState(false);

  return (
    <Menu onOpenChange={setOpen} open={isOpen}>
      <MenuTrigger>
        <Button
          endIcon="arrow-down-s-line"
          kind="tertiary"
          onClick={() => setOpen(true)}
        >
          <Text kind="action-m">{props.items.length}</Text>
        </Button>
      </MenuTrigger>
      <MenuContent
        align={"start"}
        data-testId={"t--page-selection"}
        height={props.items.length <= 6 ? "fit-content" : "186px"}
        side={"bottom"}
      >
        {props.items.map((item) => (
          <MenuItem key={item.key} onClick={() => props.navigateToTab(item)}>
            <Flex
              alignItems="center"
              className={"text-ellipsis whitespace-nowrap overflow-hidden"}
              gap="spaces-4"
            >
              {item.icon}
              <Text>{item.title}</Text>
            </Flex>
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
};

export default ListButton;
