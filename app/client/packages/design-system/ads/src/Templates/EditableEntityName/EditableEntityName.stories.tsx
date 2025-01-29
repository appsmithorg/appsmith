/* eslint-disable no-console */
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Icon } from "../..";
import { EditableEntityName } from ".";

const JSIcon = () => {
  return <Icon name="js-yellow" size="sm" />;
};

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
    icon: JSIcon(),
    canEdit: true,
    inputTestId: "t--editable-name",
    isEditing: true,
    isLoading: false,
    validateName: (name: string) =>
      name.length < 1 ? "Please enter a valid name" : null,
  },
};
