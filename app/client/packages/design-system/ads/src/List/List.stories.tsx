import React from "react";
import { List, ListItem, Icon } from "@appsmith/ads";
import type { StoryObj } from "@storybook/react";
import type { ListItemProps, ListProps } from "@appsmith/ads";

export default {
  title: "ADS/Components/List",
  component: List,
  decorators: [
    (Story: () => React.ReactNode) => (
      <div
        style={{
          width: "350px",
          margin: "0 auto",
          height: "200px",
        }}
      >
        {Story()}
      </div>
    ),
  ],
};

// eslint-disable-next-line react/function-component-definition
const ListTemplate = (args: ListProps) => {
  return <List {...args} />;
};

export const ListStory = ListTemplate.bind({}) as StoryObj;
ListStory.storyName = "List";
ListStory.args = {
  items: [
    {
      startIcon: <Icon name="file-list-2-line" size={"md"} />,
      title: "Action item 1",
    },
    {
      startIcon: <Icon name="file-list-2-line" size={"md"} />,
      title: "Action item 2",
    },
    {
      startIcon: <Icon name="file-list-2-line" size={"md"} />,
      title: "Action item 3",
    },
    {
      startIcon: <Icon name="file-list-2-line" size={"md"} />,
      title: "Action item 4",
    },
    {
      startIcon: <Icon name="file-list-2-line" size={"md"} />,
      title: "Action item 5",
    },
    {
      startIcon: <Icon name="file-list-2-line" size={"md"} />,
      title: "Action item 6",
    },
    {
      startIcon: <Icon name="file-list-2-line" size={"md"} />,
      title: "Action item 7",
    },
  ],
};

const ListItemArgTypes = {
  title: {
    control: "text",
    description: "The title/label of the list item",
    table: {
      type: {
        summary: "string",
      },
    },
  },
  startIcon: {
    description: "The icon to display before the list item title.",
    table: {
      type: {
        summary: "ReactNode",
      },
    },
  },
  endIcon: {
    control: "text",
    description: "The icon to display at the end of the list item",
    table: {
      type: {
        summary: "string",
      },
    },
  },
  description: {
    control: "text",
    description: "Description text to be shown alongside the title",
    table: {
      type: {
        summary: "string",
      },
    },
  },
  descriptionType: {
    description:
      "`inline` type will show the description beside the title. `block` type will show the description below the title.",
    control: "radio",
    options: ["inline", "block"],
    defaultValue: "inline",
  },
  size: {
    description: "Size of the list item",
    control: "radio",
    options: ["md", "lg"],
    defaultValue: "md",
  },
  hasError: {
    control: {
      type: "boolean",
    },
    description: "Whether the item is to be indicated as having an error",
    table: {
      type: {
        summary: "boolean",
      },
    },
  },
  isDisabled: {
    control: {
      type: "boolean",
    },
    description: "Whether the item is disabled",
    table: {
      type: {
        summary: "boolean",
      },
    },
  },
  onClick: {
    description: "callback for when the list item is clicked",
    table: {
      type: {
        summary: "() => void",
      },
    },
  },
  onEndIconClick: {
    description: "callback for when the end icon is clicked",
    table: {
      type: {
        summary: "() => void",
      },
    },
  },
};

function ListItemTemplate(args: JSX.IntrinsicAttributes & ListItemProps) {
  return <ListItem {...args} />;
}

export const ListItemLargeStory = ListItemTemplate.bind({}) as StoryObj;
ListItemLargeStory.storyName = "List item size large";
ListItemLargeStory.argTypes = ListItemArgTypes;
ListItemLargeStory.args = {
  startIcon: <Icon name="file-list-2-line" size={"md"} />,
  title: "Action item 1",
  description: "inline",
  descriptionType: "inline",
  size: "lg",
  endIcon: "add-more",
};

export const ListItemErrorStory = ListItemTemplate.bind({}) as StoryObj;
ListItemErrorStory.storyName = "List item with error";
ListItemErrorStory.argTypes = ListItemArgTypes;
ListItemErrorStory.args = {
  startIcon: (
    <Icon
      color="var(--ads-v2-color-fg-error)"
      name="file-list-2-line"
      size={"md"}
    />
  ),
  title: "Action item 1",
  hasError: true,
  onClick: () => alert("Clicked"),
};

export const ListItemDisabledStory = ListItemTemplate.bind({}) as StoryObj;
ListItemDisabledStory.storyName = "List item disabled";
ListItemDisabledStory.argTypes = ListItemArgTypes;
ListItemDisabledStory.args = {
  title: "Action item 1",
  isDisabled: true,
  onClick: () => alert("Clicked"),
};

export const ListItemInlineDescStory = ListItemTemplate.bind({}) as StoryObj;
ListItemInlineDescStory.storyName = "List item inline description";
ListItemInlineDescStory.argTypes = ListItemArgTypes;
ListItemInlineDescStory.args = {
  title: "Action item 1",
  description: "inline",
};

export const ListItemBlockDescStory = ListItemTemplate.bind({}) as StoryObj;
ListItemBlockDescStory.storyName = "List item block description";
ListItemBlockDescStory.argTypes = ListItemArgTypes;
ListItemBlockDescStory.args = {
  title: "Action item 1",
  description: "block",
  descriptionType: "block",
};

export const ListItemOverflowStory = ListItemTemplate.bind({}) as StoryObj;
ListItemOverflowStory.storyName = "List item title overflow";
ListItemOverflowStory.argTypes = ListItemArgTypes;
ListItemOverflowStory.args = {
  title: "Action item 1 Action item 1 Action item 1 Action item 1",
};

export const ListItemEndIconStory = ListItemTemplate.bind({}) as StoryObj;
ListItemEndIconStory.storyName = "List item end icon";
ListItemEndIconStory.argTypes = ListItemArgTypes;
ListItemEndIconStory.args = {
  title: "Action item 1",
  endIcon: "add-more",
};
