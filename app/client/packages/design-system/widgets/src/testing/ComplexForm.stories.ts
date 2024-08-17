import type { Meta, StoryObj } from "@storybook/react";
import { ComplexForm } from "./ComplexForm";

const meta: Meta<typeof ComplexForm> = {
  component: ComplexForm,
  title: "WDS/Testing/ComplexForm",
};

export default meta;
type Story = StoryObj<typeof ComplexForm>;

export const Main: Story = {};
