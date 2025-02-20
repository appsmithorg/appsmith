/* eslint-disable no-console */
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { MenuItem } from "../../Menu";
import { EntityContextMenu } from "./EntityContextMenu";

const meta: Meta<typeof EntityContextMenu> = {
  title: "ADS/Templates/Entity Context Menu",
  component: EntityContextMenu,
};

export default meta;

type Story = StoryObj<typeof EntityContextMenu>;

export const Basic: Story = {
  args: {
    tooltipContent: "More actions",
    children: (
      <>
        <MenuItem onClick={console.log} startIcon="edit-line">
          Rename
        </MenuItem>
        <MenuItem onClick={console.log} startIcon="copy-control">
          Copy
        </MenuItem>
        <MenuItem onClick={console.log} startIcon="delete">
          Delete
        </MenuItem>
      </>
    ),
  },
};
