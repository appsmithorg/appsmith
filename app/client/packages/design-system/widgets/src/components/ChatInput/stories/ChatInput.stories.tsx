import React from "react";
import { Form } from "react-aria-components";
import type { Meta, StoryObj } from "@storybook/react";
import { Flex, ChatInput, Button } from "@appsmith/wds";

const meta: Meta<typeof ChatInput> = {
  title: "WDS/Widgets/ChatInput",
  component: ChatInput,
  tags: ["autodocs"],
  args: {
    placeholder: "Write something...",
    onSubmit: () => alert("Action triggered"),
  },
};

export default meta;
type Story = StoryObj<typeof ChatInput>;

export const Main: Story = {
  args: {
    label: "Description",
    placeholder: "Write something...",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Description",
  },
};

export const WithContextualHelp: Story = {
  args: {
    label: "Description",
    contextualHelp: "This is a contextual help",
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

export const Validation: Story = {
  render: (args) => (
    <Form>
      <Flex direction="column" gap="spacing-3" width="sizing-60">
        <ChatInput
          {...args}
          errorMessage="Please enter at least 10 characters"
          isRequired
          label="Description"
        />
        <Button type="submit">Submit</Button>
      </Flex>
    </Form>
  ),
};
