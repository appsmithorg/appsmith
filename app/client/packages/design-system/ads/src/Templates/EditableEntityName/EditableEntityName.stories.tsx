/* eslint-disable no-console */
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import styled from "styled-components";

import { Icon } from "@appsmith/ads";
import { EditableEntityName } from ".";

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
    inputTestId: "t--editable-name",
    isEditing: true,
    isLoading: false,
    validateName: (name: string) =>
      name.length < 3 ? "Name must be at least 3 characters" : null,
  },
};
