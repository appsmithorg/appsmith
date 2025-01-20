/* eslint-disable no-console */
import type { Meta, StoryObj } from "@storybook/react";

import { EditableEntityName } from ".";

const meta: Meta<typeof EditableEntityName> = {
  title: "ADS/Templates/Editable Entity Name",
  component: EditableEntityName,
};

export default meta;

type Story = StoryObj<typeof EditableEntityName>;

export const Basic: Story = {
  args: {
    name: "Hello",
    onNameSave: console.log,
    onExitEditing: console.log,
    iconName: "js-yellow",
    inputTestId: "t--editable-name",
    isEditing: true,
    validateName: (name: string) =>
      name.length < 3 ? "Name must be at least 3 characters" : null,
  },
};
