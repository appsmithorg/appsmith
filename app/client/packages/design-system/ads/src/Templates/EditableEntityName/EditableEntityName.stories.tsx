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
    onEditComplete: console.log,
    startIcon: JSIcon(),
    canEdit: true,
    inputTestId: "t--editable-name",
    isEditing: true,
    isLoading: false,
    validateName: (name: string) =>
      name.length < 3 ? "Name must be at least 3 characters" : null,
    textKind: "body-s",
  },
};
