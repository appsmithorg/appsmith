import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Select, Button, Flex, SIZES } from "@design-system/widgets";
import type { SelectItem } from "../src/types";

/**
 * A select displays a collapsible list of options and allows a user to select one of them.
 */
const meta: Meta<typeof Select> = {
  component: Select,
  title: "Design-system/Widgets/Select",
};

export default meta;
type Story = StoryObj<typeof Select>;

const items: SelectItem[] = [
  { key: 1, name: "Aerospace", icon: "rocket" },
  { key: 2, name: "Mechanical", icon: "settings" },
  { key: 3, name: "Civil" },
  { key: 4, name: "Biomedical" },
  { key: 5, name: "Nuclear" },
  { key: 6, name: "Industrial" },
  { key: 7, name: "Chemical" },
  { key: 8, name: "Agricultural" },
  { key: 9, name: "Electrical" },
];

export const Main: Story = {
  args: {
    items: items,
  },
  render: (args) => (
    <Flex width="sizing-60">
      <Select {...args} />
    </Flex>
  ),
};

/**
 * The component supports two sizes `small` and `medium`. Default size is `medium`.
 */
export const Sizes: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4" width="sizing-60">
      {Object.keys(SIZES)
        .filter((size) => !["large"].includes(size))
        .map((size) => (
          <Select items={items} key={size} placeholder={size} size={size} />
        ))}
    </Flex>
  ),
};

export const Loading: Story = {
  args: {
    placeholder: "Loading",
    isLoading: true,
    items: items,
  },
};

export const Validation: Story = {
  render: () => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        alert("Form submitted");
      }}
    >
      <Flex direction="column" gap="spacing-2" width="sizing-60">
        <Select
          description="description"
          isRequired
          items={items}
          label="Validation"
        />
        <Button type="submit">Submit</Button>
      </Flex>
    </form>
  ),
};

export const ContextualHelp: Story = {
  args: {
    label: "Label",
    placeholder: "Contextual Help Text",
    contextualHelp: "This is a contextual help text",
    items: items,
  },
};
