import type { Meta, StoryObj } from "@storybook/react";
import { CompareTokens } from "./CompareTokens";

const meta: Meta<typeof CompareTokens> = {
  component: CompareTokens,
  title: "Testing/CompareTokens",
};

export default meta;
type Story = StoryObj<typeof CompareTokens>;

export const Main: Story = {};
