import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  Select,
  Button,
  Flex,
  SIZES,
  ListBoxItem,
  type SelectProps,
} from "@appsmith/wds";

import { selectItems, selectItemsWithIcons } from "./selectData";

/**
 * A select displays a collapsible list of options and allows a user to select one of them.
 */
const meta: Meta<typeof Select> = {
  component: Select,
  title: "WDS/Widgets/Select",
  args: {
    children: selectItems.map((item) => (
      <ListBoxItem key={item.id} textValue={item.label}>
        {item.label}
      </ListBoxItem>
    )),
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Main: Story = {
  args: {
    label: "Label",
    children: selectItems.map((item) => (
      <ListBoxItem key={item.id} textValue={item.label}>
        {item.label}
      </ListBoxItem>
    )),
  },
};

/**
 * The component supports two sizes `small` and `medium`. Default size is `medium`.
 */
export const Sizes: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4" width="sizing-60">
      {Object.keys(SIZES)
        .filter(
          (size): size is NonNullable<SelectProps["size"]> =>
            !["xSmall", "large"].includes(size),
        )
        .map((size) => (
          <Select key={size} label={size} placeholder={size} size={size}>
            {selectItems.map((item) => (
              <ListBoxItem key={item.id} textValue={item.label}>
                {item.label}
              </ListBoxItem>
            ))}
          </Select>
        ))}
    </Flex>
  ),
};

export const Loading: Story = {
  args: {
    placeholder: "Loading",
    isLoading: true,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled",
    isDisabled: true,
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
        <Select errorMessage="There is an error" isRequired label="Validation">
          {selectItems.map((item) => (
            <ListBoxItem key={item.id} textValue={item.label}>
              {item.label}
            </ListBoxItem>
          ))}
        </Select>
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
  },
};

export const WithIcons: Story = {
  args: {
    label: "With icons",
    children: selectItemsWithIcons.map((item) => (
      <ListBoxItem icon={item.icon} key={item.id} textValue={item.label}>
        {item.label}
      </ListBoxItem>
    )),
  },
};
