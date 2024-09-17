import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  Flex,
  Icon,
  SIZES,
  Button,
  Menu,
  MenuTrigger,
  TextInput,
} from "@appsmith/wds";

/**
 * TextInput is a component that allows users to input text.
 */
const meta: Meta<typeof TextInput> = {
  component: TextInput,
  title: "WDS/Widgets/TextInput",
};

export default meta;
type Story = StoryObj<typeof TextInput>;

export const Main: Story = {
  args: {
    placeholder: "Write something...",
  },
};

export const Description: Story = {
  args: {
    placeholder: "Description",
    description: "This is a description",
  },
};

export const Sizes: Story = {
  render: () => (
    <Flex alignItems="start" gap="spacing-4">
      {Object.keys(SIZES)
        .filter((size) => !["large"].includes(size))
        .map((size) => (
          <TextInput
            key={size}
            placeholder={size}
            prefix={<Icon name="user" size={size as keyof typeof SIZES} />}
            size={size}
          />
        ))}
    </Flex>
  ),
};

export const PrefixAndSuffix: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4">
      <TextInput placeholder="prefix" prefix="$" />
      <TextInput placeholder="suffix" suffix="$" />
      <TextInput
        placeholder="prefix and suffix"
        prefix={<Icon name="user" />}
        suffix={<Icon name="user" />}
      />
      <TextInput
        placeholder="component as prefix"
        prefix={
          <MenuTrigger>
            <Button
              color="neutral"
              icon="chevron-down"
              size="small"
              variant="ghost"
            />
            <Menu
              disabledKeys={["cut"]}
              items={[
                { id: "copy", label: "Copy" },
                { id: "cut", label: "Cut" },
                { id: "paste", label: "Paste" },
              ]}
              onAction={(key) => alert(key)}
            />
          </MenuTrigger>
        }
      />
    </Flex>
  ),
};

/**
 * The icon button for input type password type occupies the same slot as the suffix and has priority.
 */
export const TypePassword: Story = {
  args: {
    label: "Password",
    placeholder: "Type Password",
    type: "password",
  },
};

/**
 * Loading indicator for input occupies the same slot as the password icon and suffix and has priority.
 */

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

export const Readonly: Story = {
  args: {
    label: "Readonly",
    isReadOnly: true,
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
        <TextInput description="description" isRequired label="Validation" />
        <Button type="submit">Submit</Button>
      </Flex>
    </form>
  ),
};

export const RequiredIndicator: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4" width="100%">
      <TextInput isRequired label="Required - Icon Indicator" />
      <TextInput
        isRequired
        label="Required - Label Indicator"
        necessityIndicator="label"
      />
      <TextInput
        label="Required - Label Indicator"
        necessityIndicator="label"
      />
    </Flex>
  ),
};

export const ContextualHelp: Story = {
  args: {
    label: "Label",
    placeholder: "Contextual Help Text",
    contextualHelp: "This is a contextual help text",
  },
};
