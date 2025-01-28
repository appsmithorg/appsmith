import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { ScrollArea } from "../..";
import { Tab, Tabs, TabsList } from "../..";
import { Button } from "../..";

import { EntityTabsHeader, EntityListButton } from ".";

const SCROLL_AREA_OPTIONS = {
  overflow: {
    x: "scroll",
    y: "hidden",
  },
} as const;

const meta: Meta<typeof EntityTabsHeader> = {
  title: "ADS/Templates/Entity Tabs Header",
  component: EntityTabsHeader,
};

export default meta;

interface Args {
  width: number;
}

const Template = ({ width }: Args) => {
  // TODO: replace SegmentHeader children with proper components when ready
  return (
    <div style={{ width }}>
      <EntityTabsHeader>
        <EntityListButton />
        <ScrollArea
          data-testid="t--editor-tabs"
          options={SCROLL_AREA_OPTIONS}
          size="sm"
          style={{ height: 32, top: 0.5 }}
        >
          <Tabs defaultValue="tab1">
            <TabsList>
              <Tab notificationCount={3} value="tab1">
                Account
              </Tab>
              <Tab notificationCount={15} value="tab2">
                Password
              </Tab>
              <Tab value="tab3">Account</Tab>
              <Tab value="tab4">Test</Tab>
              <Tab value="tab5">General</Tab>
            </TabsList>
          </Tabs>
        </ScrollArea>
        <Button
          isIconButton
          kind="tertiary"
          startIcon="maximize-v3"
          style={{ marginLeft: "auto", minWidth: 24 }}
        />
      </EntityTabsHeader>
    </div>
  );
};

export const Basic = Template.bind({}) as StoryObj;

Basic.args = {
  width: 500,
};
