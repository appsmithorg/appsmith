/* eslint-disable no-console */
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { EditableDismissibleTab } from ".";
import { Icon } from "../..";

const meta: Meta<typeof EditableDismissibleTab> = {
  title: "ADS/Templates/Editable Dismissible Tab",
  component: EditableDismissibleTab,
};

const JSIcon = () => {
  return <Icon name="js-yellow" size="sm" />;
};

export default meta;

type Story = StoryObj<typeof EditableDismissibleTab>;

export const Basic: Story = {
  args: {
    isActive: true,
    dataTestId: "t--dismissible-tab",
    icon: JSIcon(),
    name: "Hello",

    onNameSave: console.log,
    validateName: (name: string) =>
      name.length < 1 ? "Please enter a valid name" : null,
  },
};
