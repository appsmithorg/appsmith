import React from "react";
import { Form } from "react-aria-components";
import type { Meta, StoryObj } from "@storybook/react";
import { Flex, TextArea, Button } from "@appsmith/wds";

const meta: Meta<typeof TextArea> = {
  title: "WDS/Widgets/Text Area",
  component: TextArea,
  tags: ["autodocs"],
  args: {
    placeholder: "Write something...",
  },
};

export default meta;
type Story = StoryObj<typeof TextArea>;

export const Main: Story = {
  args: {
    label: "Description",
    placeholder: "Write something...",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Label",
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

export const Readonly: Story = {
  args: {
    isReadOnly: true,
    label: "Readonly",
  },
};

export const Validation: Story = {
  render: (args) => (
    <Form onSubmit={(e) => e.preventDefault()}>
      <Flex direction="column" gap="spacing-3" width="sizing-60">
        <TextArea
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
