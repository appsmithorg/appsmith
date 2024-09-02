import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  TYPOGRAPHY_VARIANTS,
  TYPOGRAPHY_FONT_WEIGHTS,
} from "@appsmith/wds-theming";
import { Text, Flex, COLORS } from "@appsmith/wds";

/**
 * Text is a component that renders a capsized text.
 */
const meta: Meta<typeof Text> = {
  component: Text,
  title: "WDS/Widgets/Text",
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Main: Story = {
  args: {
    children:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
  },
};

export const LineClamp: Story = {
  parameters: {
    width: 300,
  },
  args: {
    lineClamp: 1,
    children:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
  },
};

export const Size: Story = {
  render: () => (
    <Flex
      alignItems="center"
      direction="row-reverse"
      flex="1"
      gap="spacing-6"
      justifyContent="start"
    >
      {Object.values(TYPOGRAPHY_VARIANTS).map((variant) => (
        <Text key={variant} size={variant}>
          {variant}
        </Text>
      ))}
    </Flex>
  ),
};

export const Color: Story = {
  render: () => (
    <Flex
      alignItems="center"
      direction="row-reverse"
      flex="1"
      gap="spacing-6"
      justifyContent="start"
    >
      {Object.values(COLORS).map((color) => (
        <Text color={color} key={color}>
          {color}
        </Text>
      ))}
    </Flex>
  ),
};

export const FontWeight: Story = {
  render: () => (
    <Flex
      alignItems="center"
      direction="row-reverse"
      flex="1"
      gap="spacing-6"
      justifyContent="start"
    >
      {Object.values(TYPOGRAPHY_FONT_WEIGHTS).map((fontWeight) => (
        <Text fontWeight={fontWeight} key={fontWeight}>
          {fontWeight}
        </Text>
      ))}
    </Flex>
  ),
};
