import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TextArea, Flex } from "@appsmith/wds";

/**
 * TextArea is a component that is similar to the native textarea element, but with a few extra features.
 */
const meta: Meta<typeof TextArea> = {
  component: TextArea,
  title: "WDS/Widgets/TextArea",
};

export default meta;
type Story = StoryObj<typeof TextArea>;

export const Main: Story = {
  args: {
    label: "Label",
    placeholder: "Placeholder",
  },
};

export const Description: Story = {
  args: {
    placeholder: "Description",
    description: "This is a description",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled",
    isDisabled: true,
  },
};

export const Validation: Story = {
  args: {
    placeholder: "Validation",
    validationState: "invalid",
    errorMessage: "This field is required",
  },
};

export const RequiredIndicator: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-4" width="100%">
      <TextArea isRequired label="Required - Icon Indicator" />
      <TextArea
        isRequired
        label="Required - Label Indicator"
        necessityIndicator="label"
      />
      <TextArea label="Required - Label Indicator" necessityIndicator="label" />
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
