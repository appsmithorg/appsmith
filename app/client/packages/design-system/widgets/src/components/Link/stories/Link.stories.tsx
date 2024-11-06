import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  TYPOGRAPHY_VARIANTS,
  TYPOGRAPHY_FONT_WEIGHTS,
} from "@appsmith/wds-theming";
import { Link, Flex } from "@appsmith/wds";

/**
 * Link component is used to navigate to a different page or section of the current page.
 */
const meta: Meta<typeof Link> = {
  component: Link,
  title: "WDS/Widgets/Link",
};

export default meta;
type Story = StoryObj<typeof Link>;

export const Main: Story = {
  args: {
    target: "_blank",
    href: "https://appsmith.com",
    children: "Appsmith.",
  },
};

export const LineClamp: Story = {
  parameters: {
    width: 300,
  },
  args: {
    target: "_blank",
    href: "https://appsmith.com",
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
        <Link href="https://appsmith.com" key={variant} size={variant}>
          {variant}
        </Link>
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
        <Link
          fontWeight={fontWeight}
          href="https://appsmith.com"
          key={fontWeight}
        >
          {fontWeight}
        </Link>
      ))}
    </Flex>
  ),
};
