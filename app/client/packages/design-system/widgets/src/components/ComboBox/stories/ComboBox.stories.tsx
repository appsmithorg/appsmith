import React from "react";
import { Form } from "react-aria-components";
import type { Meta, StoryObj } from "@storybook/react";
import { ComboBox, ListBoxItem, Flex, Button } from "@appsmith/wds";

import { items } from "./items";

const meta: Meta<typeof ComboBox> = {
  title: "WDS/Widgets/ComboBox",
  component: ComboBox,
  tags: ["autodocs"],
  args: {
    children: items.map((item) => (
      <ListBoxItem key={item.id} textValue={item.label}>
        {item.label}
      </ListBoxItem>
    )),
  },
};

export default meta;
type Story = StoryObj<typeof ComboBox>;

export const Main: Story = {
  args: {
    label: "Select an option",
    placeholder: "Choose...",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Favorite Fruit",
  },
};

export const WithContextualHelp: Story = {
  args: {
    label: "Country",
    contextualHelp: "Select the country you currently reside in",
  },
};

export const Disabled: Story = {
  args: {
    isDisabled: true,
    label: "Disabled ComboBox",
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    label: "Loading ComboBox",
    placeholder: "Loading options...",
  },
};

export const Size: Story = {
  render: (args) => (
    <Flex direction="column" gap="spacing-4">
      <ComboBox {...args} label="Small" size="small" />
      <ComboBox {...args} label="Medium" size="medium" />
    </Flex>
  ),
};

export const Validation: Story = {
  render: (args) => (
    <Form onSubmit={(e) => e.preventDefault()}>
      <Flex direction="column" gap="spacing-3" width="sizing-60">
        <ComboBox
          errorMessage="Please select an option"
          isRequired
          label="Required Selection"
          {...args}
        />
        <Button type="submit">Submit</Button>
      </Flex>
    </Form>
  ),
};
