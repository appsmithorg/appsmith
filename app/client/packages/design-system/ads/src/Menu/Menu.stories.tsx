import React from "react";

import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  MenuSeparator,
  MenuGroup,
  MenuGroupName,
} from "./Menu";
import { Button } from "../Button";
import { Text } from "../Text";
import { Tooltip } from "../Tooltip";
import type { MenuProps } from "./Menu.types";
import type { StoryObj } from "@storybook/react";

export default {
  title: "ADS/Components/Menu",
  component: Menu,
};

// eslint-disable-next-line react/function-component-definition
const Template = () => {
  return (
    <Menu>
      <MenuTrigger>
        <Button>Menu</Button>
      </MenuTrigger>
      <MenuContent loop width="200px">
        <MenuItem startIcon="settings-line">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
        </MenuItem>
        <MenuItem startIcon="settings-line">Item 2</MenuItem>
        <MenuSeparator />
        <MenuItem startIcon="settings-line">Item 3</MenuItem>
        <MenuSub>
          <MenuSubTrigger startIcon="settings-line">Sub Menu</MenuSubTrigger>
          <MenuSubContent width="200px">
            <MenuItem>Sub Item 1</MenuItem>
            <MenuSub>
              <MenuSubTrigger>Sub Menu 2</MenuSubTrigger>
              <MenuSubContent width="200px">
                <MenuItem>Sub Item 2.1</MenuItem>
                <MenuItem>Sub Item 2.2</MenuItem>
                <MenuItem>Sub Item 2.3</MenuItem>
              </MenuSubContent>
            </MenuSub>
          </MenuSubContent>
        </MenuSub>
        <MenuItem startIcon="settings-line">Item 4</MenuItem>
        <MenuItem startIcon="settings-line">Item 5</MenuItem>
        <MenuItem disabled startIcon="settings-line">
          Item 6
        </MenuItem>
        <MenuSeparator />
        <MenuGroupName asChild>
          <Text kind="body-s">Menu Group</Text>
        </MenuGroupName>
        <MenuGroup>
          <MenuItem startIcon="settings-line">Item 7</MenuItem>
          <MenuItem startIcon="settings-line">Item 8</MenuItem>
          <MenuItem startIcon="settings-line">Item 9</MenuItem>
          <MenuItem startIcon="settings-line">Item 10</MenuItem>
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
};

export const MenuFullStory = Template.bind({}) as StoryObj;
MenuFullStory.storyName = "Complete Menu";
MenuFullStory.args = {};

export function MenuStory({ children, ...args }: MenuProps) {
  return <Menu {...args}>{children}</Menu>;
}
MenuStory.storyName = "Menu";
MenuStory.argTypes = {
  children: {
    control: {
      type: "text",
    },
    description: "Menu Trigger and Menu Content is passed here.",
    table: {
      type: {
        summary: "text",
      },
      defaultValue: {
        summary: "",
      },
    },
  },
  dir: {
    control: {
      type: "select",
      options: ["ltr", "rtl"],
    },
    description: "Direction of the menu.",
    table: {
      type: {
        summary: "ltr | rtl",
      },
      defaultValue: {
        summary: "ltr",
      },
    },
  },
  open: {
    control: {
      type: "boolean",
    },
    description: "Whether the menu is open or not.",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "false",
      },
    },
  },
  defaultOpen: {
    control: {
      type: "boolean",
    },
    description: "Whether the menu is open or not by default.",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "false",
      },
    },
  },
  onOpenChange: {
    control: {
      type: "function",
    },
    description: "Callback when the menu is opened or closed.",
    table: {
      type: {
        summary: "(open: boolean) => void",
      },
      defaultValue: {
        summary: "() => {}",
      },
    },
  },
  modal: {
    control: {
      type: "boolean",
    },
    description: "Whether the menu is modal or not.",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "false",
      },
    },
  },
};
MenuStory.args = {
  children: "This doesn't work alone. This is just to showcase props of Menu.",
};

export function MenuTriggerStory({ children, ...args }: MenuProps) {
  return (
    <Menu>
      <MenuTrigger {...args}>{children}</MenuTrigger>
    </Menu>
  );
}
MenuTriggerStory.storyName = "Menu Trigger";
MenuTriggerStory.argTypes = {
  children: {
    control: {
      type: "text",
    },
    description: "Menu Trigger is passed here.",
    table: {
      type: {
        summary: "text",
      },
      defaultValue: {
        summary: "",
      },
    },
  },
};
MenuTriggerStory.args = {
  children: <Button>Open Menu</Button>,
};

export function MenuContentStory({ children, ...args }: MenuProps) {
  return (
    <Menu>
      <MenuTrigger>
        <Button>Open Menu</Button>
      </MenuTrigger>
      <MenuContent {...args}>{children}</MenuContent>
    </Menu>
  );
}
MenuContentStory.storyName = "Menu Content";
MenuContentStory.argTypes = {
  children: {
    control: {
      type: "text",
    },
    description: "Menu Content is passed here.",
    table: {
      type: {
        summary: "text",
      },
      defaultValue: {
        summary: "",
      },
    },
  },
  height: {
    control: {
      type: "text",
    },
    description: "Height of the menu content.",
    table: {
      type: {
        summary: "string",
      },
      defaultValue: {
        summary: "fit-content",
      },
    },
  },
  width: {
    control: {
      type: "text",
    },
    description: "Width of the menu content. Max-width: 280px.",
    table: {
      type: {
        summary: "string",
      },
      defaultValue: {
        summary: "fit-content",
      },
    },
  },
  loop: {
    control: {
      type: "boolean",
    },
    description:
      "When true, keyboard navigation will loop from last item to first, and vice versa.",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "false",
      },
    },
  },
  onCloseAutoFocus: {
    control: {
      type: "object",
    },
    description:
      "Event handler called when focus moves to the trigger after closing. It can be prevented by calling event.preventDefault.",
    table: {
      type: {
        summary: "(event: Event) => void",
      },
    },
  },
  onEscapeKeyDown: {
    control: {
      type: "object",
    },
    description:
      "Event handler called when the escape key is pressed. It can be prevented by calling event.preventDefault.",
    table: {
      type: {
        summary: "(event: KeyboardEvent) => void",
      },
    },
  },
  onPointerDownOutside: {
    control: {
      type: "object",
    },
    description:
      "Event handler called when a pointer event occurs outside the bounds of the component. It can be prevented by calling event.preventDefault.",
    table: {
      type: {
        summary: "(event: PointerDownOutsideEvent) => void",
      },
    },
  },
  onFocusOutside: {
    control: {
      type: "object",
    },
    description:
      "Event handler called when focus moves outside the bounds of the component. It can be prevented by calling event.preventDefault.",
    table: {
      type: {
        summary: "(event: FocusOutsideEvent) => void",
      },
    },
  },
  onInteractOutside: {
    control: {
      type: "object",
    },
    description:
      "Event handler called when an interaction (pointer or focus event) happens outside the bounds of the component. It can be prevented by calling event.preventDefault.",
    table: {
      type: {
        summary: "(event: PointerDownOutsideEvent | FocusOutsideEvent) => void",
      },
    },
  },
  forceMount: {
    control: {
      type: "boolean",
    },
    description:
      "Used to force mounting when more control is needed. Useful when controlling animation with React animation libraries. It inherits from DropdownMenu.Portal.",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "false",
      },
    },
  },
  side: {
    control: {
      type: "select",
    },
    options: ["top", "right", "bottom", "left"],
    description:
      "The preferred side of the trigger to render against when open. Will be reversed when collisions occur and avoidCollisions is enabled.",
    table: {
      type: {
        summary: "top | right | bottom | left",
      },
      defaultValue: {
        summary: "bottom",
      },
    },
  },
  sideOffset: {
    control: {
      type: "number",
    },
    description:
      "The offset of the menu from the trigger. The offset is flipped when collisions occur and avoidCollisions is enabled.",
    table: {
      type: {
        summary: "number",
      },
      defaultValue: {
        summary: "0",
      },
    },
  },
  align: {
    control: {
      type: "select",
    },
    options: ["start", "center", "end"],
    description:
      "The preferred alignment of the menu against the trigger. Will be reversed when collisions occur and avoidCollisions is enabled.",
    table: {
      type: {
        summary: "start | center | end",
      },
      defaultValue: {
        summary: "center",
      },
    },
  },
  alignOffset: {
    control: {
      type: "number",
    },
    description:
      "The offset of the menu from the trigger. The offset is flipped when collisions occur and avoidCollisions is enabled.",
    table: {
      type: {
        summary: "number",
      },
      defaultValue: {
        summary: "0",
      },
    },
  },
  avoidCollisions: {
    control: {
      type: "boolean",
    },
    description:
      "When true, the menu will flip sides when it reaches the viewport bounds.",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "true",
      },
    },
  },
  collisionBoundary: {
    control: {
      type: "object",
    },
    description:
      "The element that the menu will be constrained to fit within if it reaches the viewport bounds.",
    table: {
      type: {
        summary: "Element | null | Array<Element | null>",
      },
    },
  },
  collisionPadding: {
    control: {
      type: "object",
    },
    description:
      "The padding between the menu and the viewport edges when collisions occur.",
    table: {
      type: {
        summary: "number | Partial<Record<Side, number>>",
      },
      defaultValue: {
        summary: "0",
      },
    },
  },
  arrowPadding: {
    control: {
      type: "object",
    },
    description:
      "The padding between the menu and the trigger when the menu is positioned with an arrow.",
    table: {
      type: {
        summary: "number",
      },
      defaultValue: {
        summary: "0",
      },
    },
  },
  sticky: {
    control: {
      type: "select",
    },
    options: ["partial", "always"],
    description:
      "When true, the menu will remain open when the trigger is blurred.",
    table: {
      type: {
        summary: "partial | always",
      },
      defaultValue: {
        summary: "partial",
      },
    },
  },
  hideWhenDetached: {
    control: {
      type: "boolean",
    },
    description:
      "When true, the menu will hide when the trigger is detached from the DOM.",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "false",
      },
    },
  },
};
MenuContentStory.args = {
  children: <Text>Menu Content</Text>,
  width: "150px",
};

export function MenuItemStory({ children, ...args }: MenuProps) {
  return (
    <Menu>
      <MenuTrigger>
        <Button>Open Menu</Button>
      </MenuTrigger>
      <MenuContent width="150px">
        <MenuItem {...args}>{children}</MenuItem>
      </MenuContent>
    </Menu>
  );
}
MenuItemStory.storyName = "Menu Item";
MenuItemStory.argTypes = {
  children: {
    control: {
      type: "text",
    },
    description: "Menu Item is passed here.",
    table: {
      type: {
        summary: "text",
      },
      defaultValue: {
        summary: "",
      },
    },
  },
  disabled: {
    control: {
      type: "boolean",
    },
    description: "Whether the menu item is disabled or not.",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "false",
      },
    },
  },
  startIcon: {
    control: {
      type: "text",
    },
    description: "Start icon of the menu item.",
    table: {
      type: {
        summary: "string",
      },
      defaultValue: {
        summary: "",
      },
    },
  },
  endIcon: {
    control: {
      type: "text",
    },
    description: "End icon of the menu item.",
    table: {
      type: {
        summary: "string",
      },
      defaultValue: {
        summary: "",
      },
    },
  },
  size: {
    control: {
      type: "select",
      options: ["sm", "md"],
    },
    description: "Size of the menu item.",
    table: {
      type: {
        summary: "sm | md",
      },
      defaultValue: {
        summary: "md",
      },
    },
  },
  onSelect: {
    control: {
      type: "function",
    },
    description: "Callback when the menu item is selected.",
    table: {
      type: {
        summary: "() => void",
      },
      defaultValue: {
        summary: "() => {}",
      },
    },
  },
};
MenuItemStory.args = {
  children: "Item",
};

export function MenuSeparatorStory({ ...args }: MenuProps) {
  return (
    <Menu>
      <MenuTrigger>
        <Button>Open Menu</Button>
      </MenuTrigger>
      <MenuContent width="150px">
        <MenuItem>Item</MenuItem>
        <MenuSeparator {...args} />
        <MenuItem>Item</MenuItem>
        <MenuItem>Item</MenuItem>
      </MenuContent>
    </Menu>
  );
}
MenuSeparatorStory.storyName = "Menu Separator";

export function MenuSubmenuStory({ ...args }: MenuProps) {
  return (
    <Menu>
      <MenuTrigger>
        <Button>Open Menu</Button>
      </MenuTrigger>
      <MenuContent width="150px">
        <MenuItem>Item</MenuItem>
        <MenuSub {...args}>
          <MenuSubTrigger>Item Sub</MenuSubTrigger>
          <MenuSubContent width="200px">
            <MenuItem>Sub Item</MenuItem>
          </MenuSubContent>
        </MenuSub>
        <MenuItem>Item</MenuItem>
      </MenuContent>
    </Menu>
  );
}
MenuSubmenuStory.storyName = "Menu Submenu";
MenuSubmenuStory.argTypes = {
  children: {
    control: {
      type: "text",
    },
    description: "Menu Trigger and Menu Content is passed here.",
    table: {
      type: {
        summary: "text",
      },
      defaultValue: {
        summary: "",
      },
    },
  },
  open: {
    control: {
      type: "boolean",
    },
    description: "Whether the menu is open or not.",
    table: {
      type: {
        summary: "boolean",
      },
      defaultValue: {
        summary: "false",
      },
    },
  },
  onOpenChange: {
    control: {
      type: "function",
    },
    description: "Callback when the menu is opened or closed.",
    table: {
      type: {
        summary: "(open: boolean) => void",
      },
      defaultValue: {
        summary: "() => {}",
      },
    },
  },
};

export function MenuWithTooltipOnTrigger() {
  return (
    <Menu>
      <Tooltip
        content={
          "this tooltip appears when you hover over the menu trigger. " +
          "clicking the menu trigger will open the menu only if the tooltip is " +
          "wrapped around the MenuTrigger and not the other way around."
        }
      >
        <MenuTrigger>
          <Button>Click me</Button>
        </MenuTrigger>
      </Tooltip>
      <MenuContent width="150px">
        <MenuItem>Item</MenuItem>
        <MenuItem>Item</MenuItem>
      </MenuContent>
    </Menu>
  );
}
