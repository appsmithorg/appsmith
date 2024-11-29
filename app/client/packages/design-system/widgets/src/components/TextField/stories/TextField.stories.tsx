import React from "react";
import { Form } from "react-aria-components";
import type { Meta, StoryObj } from "@storybook/react";
import { Flex, Icon, TextField, Button } from "@appsmith/wds";

const meta: Meta<typeof TextField> = {
  title: "WDS/Widgets/TextField",
  component: TextField,
  tags: ["autodocs"],
  args: {
    placeholder: "Write something...",
  },
};

export default meta;
type Story = StoryObj<typeof TextField>;

export const Main: Story = {
  args: {
    label: "Email",
    placeholder: "Write something...",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Email",
  },
};

export const WithContextualHelp: Story = {
  args: {
    label: "Email",
    contextualHelp: "This is a contextual help",
  },
};

export const WithPrefixAndSuffix: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4">
      <TextField suffix={<Icon name="user" size="medium" />} />
      <TextField prefix={<Icon name="user" size="medium" />} />
      <TextField
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
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    label: "Loading",
    placeholder: "Loading...",
  },
};

export const Readonly: Story = {
  args: {
    isReadOnly: true,
    label: "Readonly",
  },
};

export const Size: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4">
      <TextField
        label="Small"
        prefix={<Icon name="user" size="medium" />}
        size="small"
      />
      <TextField
        label="Medium"
        prefix={<Icon name="user" size="medium" />}
        size="medium"
      />
    </Flex>
  ),
};

export const Validation: Story = {
  render: () => (
    <Form onSubmit={(e) => e.preventDefault()}>
      <Flex direction="column" gap="spacing-3" width="sizing-60">
        <TextField
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
