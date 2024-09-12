import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Select, Button, Flex, SIZES } from "@appsmith/wds";
import { selectItems, selectItemsWithIcons } from "./selectData";

/**
 * A select displays a collapsible list of options and allows a user to select one of them.
 */
const meta: Meta<typeof Select> = {
  component: Select,
  title: "WDS/Widgets/Select",
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Main: Story = {
  args: {
    items: selectItems,
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
          <Select
            items={selectItems}
            key={size}
            placeholder={size}
            size={size}
          />
        ))}
    </Flex>
  ),
};

export const Loading: Story = {
  args: {
    placeholder: "Loading",
    isLoading: true,
    items: selectItems,
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
      <Flex direction="column" gap="spacing-5" width="sizing-60">
        <Select
          description="description"
          isRequired
          items={selectItems}
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
    items: selectItems,
  },
};

export const WithIcons: Story = {
  args: {
    label: "With icons",
    items: selectItemsWithIcons,
  },
};
