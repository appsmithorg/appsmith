import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TagGroup, Tag } from "@appsmith/wds";
import type { TagGroupProps } from "../src/TagGroup";

/**
 * Tag Group is a group of checkboxes that can be selected together.
 */
const meta: Meta<typeof TagGroup> = {
  component: TagGroup,
  title: "WDS/Widgets/TagGroup",
  subcomponents: {
    Tag,
  },
};

export default meta;
type Story = StoryObj<typeof TagGroup>;

const TagGroupExample = (args: TagGroupProps<object>) => (
  <TagGroup {...args}>
    <Tag id="value-1">Value 1</Tag>
    <Tag id="value-2">Value 2</Tag>
    <Tag id="value-3">Value 3</Tag>
    <Tag id="value-4">Value 4</Tag>
  </TagGroup>
);

export const Main: Story = {
  render: (args) => <TagGroupExample {...args} />,
};

/**
 * Tag Group can be configured to allow only one selection at a time with the `selectionMode` prop.
 */
export const SingleSelection: Story = {
  args: { selectionMode: "single" },
  render: (args) => <TagGroupExample {...args} />,
};

/**
 * Tag Group can be configured to allow multiple selections at a time with the `selectionMode` prop with value `multiple`.
 */
export const MultipleSelection: Story = {
  args: { selectionMode: "multiple" },
  render: (args) => <TagGroupExample {...args} />,
};

/**
 * Tags can be removed with the `onRemove` prop. The Tag will render a close icon when this prop is provided on the TagGroup.
 */
export const RemovingTags: Story = {
  args: {
    onRemove: (id) => {
      alert(id);
    },
  },
  render: (args) => <TagGroupExample {...args} />,
};

/**
 * Tags can be disabled with the `disabledKeys` prop.
 */
export const DisabledTags: Story = {
  args: {
    selectionMode: "multiple",
    disabledKeys: ["value-2"],
  },
  render: (args) => <TagGroupExample {...args} />,
};

export const EmptyState: Story = {
  args: {
    renderEmptyState: () => "No categories.",
    children: undefined,
  },
  render: (args) => <TagGroupExample {...args} />,
};

export const WithLabel: Story = {
  args: {
    label: "Categories",
    selectionMode: "multiple",
  },
  render: (args) => <TagGroupExample {...args} />,
};

export const WithError: Story = {
  args: {
    label: "Categories",
    selectionMode: "multiple",
    errorMessage: "Please select at least one category.",
  },
  render: (args) => <TagGroupExample {...args} />,
};
