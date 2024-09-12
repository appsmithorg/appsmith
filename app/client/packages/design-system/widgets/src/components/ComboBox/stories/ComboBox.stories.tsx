import { Button, ComboBox, Flex, SIZES } from "@appsmith/wds";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { items, itemsWithIcons } from "./items";

/**
 * A select displays a collapsible list of options and allows a user to select one of them.
 */
const meta: Meta<typeof ComboBox> = {
  component: ComboBox,
  title: "WDS/Widgets/ComboBox",
};

export default meta;
type Story = StoryObj<typeof ComboBox>;

export const Main: Story = {
  args: {
    items: items,
  },
  render: (args) => (
    <Flex width="sizing-60">
      <ComboBox {...args} />
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
        .filter((size) => !["xSmall", "large"].includes(size))
        .map((size) => (
          <ComboBox items={items} key={size} placeholder={size} size={size} />
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
      <Flex direction="column" gap="spacing-5" width="sizing-60">
        <ComboBox
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

export const WithIcons: Story = {
  args: {
    label: "With icons",
    items: itemsWithIcons,
  },
};
