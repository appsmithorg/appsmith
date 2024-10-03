import React from "react";
import { Form } from "react-aria-components";
import type { Meta, StoryObj } from "@storybook/react";
import { Flex, Icon, TextInput, Button } from "@appsmith/wds";

const meta: Meta<typeof TextInput> = {
  title: "WDS/Widgets/TextInput",
  component: TextInput,
  tags: ["autodocs"],
  args: {
    placeholder: "Write something...",
  },
};

export default meta;
type Story = StoryObj<typeof TextInput>;

export const Main: Story = {
  args: {
    label: "Email",
    placeholder: "Write something...",
  },
};

export const WithLabelAndDescription: Story = {
  args: {
    label: "Email",
    description: "This is a description",
  },
};

export const WithContextualHelp: Story = {
  args: {
    label: "Email",
    contextualHelp: "This is a contextual help",
  },
};

export const WithPrefixAndSuffix: Story = {
  render: (args) => (
    <Flex direction="column" gap="spacing-4">
      <TextInput {...args} suffix={<Icon name="user" size="medium" />} />
      <TextInput {...args} prefix={<Icon name="user" size="medium" />} />
      <TextInput
        {...args}
        prefix={<Icon name="user" size="medium" />}
        suffix={<Icon name="user" size="medium" />}
      />
    </Flex>
  ),
};

export const Password: Story = {
  args: {
    type: "password",
    label: "Password",
  },
};

export const Disabled: Story = {
  args: {
    isDisabled: true,
    label: "Disabled",
    description: "This is a disabled field",
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    label: "Loading",
    placeholder: "Loading...",
    description: "This is a loading field",
  },
};

export const Readonly: Story = {
  args: {
    isReadOnly: true,
    label: "Readonly",
    description: "This is a readonly field",
  },
};

export const Size: Story = {
  render: (args) => (
    <Flex direction="column" gap="spacing-4">
      <TextInput
        {...args}
        label="Small"
        prefix={<Icon name="user" size="medium" />}
        size="small"
      />
      <TextInput
        {...args}
        label="Medium"
        prefix={<Icon name="user" size="medium" />}
        size="medium"
      />
    </Flex>
  ),
};

export const Validation: Story = {
  render: (args) => (
    <Form onSubmit={(e) => e.preventDefault()}>
      <Flex direction="column" gap="spacing-3" width="sizing-60">
        <TextInput
          {...args}
          errorMessage="Please enter a valid email address"
          isRequired
          label="Email"
          type="email"
        />
        <Button type="submit">Submit</Button>
      </Flex>
    </Form>
  ),
};
