/* eslint-disable no-console */
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { DismissibleTab, DismissibleTabBar } from "../..";

import { EntityTabsHeader, EntityListButton, ToggleScreenModeButton } from ".";

const meta: Meta<typeof EntityTabsHeader> = {
  title: "ADS/Templates/Entity Tabs Header",
  component: EntityTabsHeader,
};

export default meta;

interface Args {
  width: number;
}

const Template = ({ width }: Args) => {
  return (
    <div style={{ width }}>
      <EntityTabsHeader>
        <EntityListButton onClick={console.log} />
        <DismissibleTabBar onTabAdd={console.log}>
          <DismissibleTab onClick={console.log} onClose={console.log}>
            One
          </DismissibleTab>
          <DismissibleTab onClick={console.log} onClose={console.log}>
            Two
          </DismissibleTab>
          <DismissibleTab isActive onClick={console.log} onClose={console.log}>
            Three
          </DismissibleTab>
          <DismissibleTab onClick={console.log} onClose={console.log}>
            Four
          </DismissibleTab>
          <DismissibleTab onClick={console.log} onClose={console.log}>
            Five
          </DismissibleTab>
        </DismissibleTabBar>
        <ToggleScreenModeButton onClick={console.log} />
      </EntityTabsHeader>
    </div>
  );
};

export const Basic = Template.bind({}) as StoryObj;

Basic.argTypes = {
  width: {
    control: { type: "range", min: 250, max: 600, step: 10 },
  },
};

Basic.args = {
  width: 400,
};
