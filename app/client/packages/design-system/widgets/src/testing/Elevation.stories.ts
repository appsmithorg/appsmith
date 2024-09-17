import type { Meta, StoryObj } from "@storybook/react";
import { Elevation } from "./Elevation";

const meta: Meta<typeof Elevation> = {
  component: Elevation,
  title: "WDS/Testing/Elevation",
};

export default meta;
type Story = StoryObj<typeof Elevation>;

export const Main: Story = {};
