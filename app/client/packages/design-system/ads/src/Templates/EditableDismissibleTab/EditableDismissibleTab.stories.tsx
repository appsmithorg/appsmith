/* eslint-disable no-console */
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { EditableDismissibleTab } from ".";
import styled from "styled-components";

import { Icon } from "../..";

const meta: Meta<typeof EditableDismissibleTab> = {
  title: "ADS/Templates/Editable Dismissible Tab",
  component: EditableDismissibleTab,
};

const EntityIcon = styled.div`
  height: 18px;
  width: 18px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;

  svg,
  img {
    height: 100%;
    width: 100%;
  }
`;

const JSIcon = () => {
  return (
    <EntityIcon>
      <Icon name="js-yellow" size="md" />
    </EntityIcon>
  );
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
      name.length < 3 ? "Name must be at least 3 characters" : null,
  },
};
