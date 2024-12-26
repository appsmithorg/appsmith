/* eslint-disable no-console */
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { EmptyState, type EmptyStateProps } from ".";

const meta: Meta<typeof EmptyState> = {
  title: "ADS/Templates/Entity Explorer/Empty State",
  component: EmptyState,
};

export default meta;

const Template = (props: EmptyStateProps) => {
  const { button, description, icon } = props;

  return (
    <EmptyState
      {...{
        description,
        icon,
        button,
      }}
    />
  );
};

export const Basic = Template.bind({}) as StoryObj;

Basic.args = {
  description: "No data available",
  icon: "folder-line",
};

export const WithButton = Template.bind({}) as StoryObj;

WithButton.args = {
  description: "No data available",
  icon: "file-line",
  button: {
    text: "Add new",
    onClick: () => console.log("Add clicked"),
  },
};

export const WithButtonWithoutOnClick = Template.bind({}) as StoryObj;

WithButtonWithoutOnClick.args = {
  description: "No data available",
  icon: "file-line",
  button: {
    text: "Add new",
  },
};
