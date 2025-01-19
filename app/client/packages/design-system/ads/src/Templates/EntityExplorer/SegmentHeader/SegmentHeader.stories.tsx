import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { ToggleButton } from "../../../ToggleButton";
import { ScrollArea } from "../../../ScrollArea";
import { Tab, Tabs, TabsList } from "../../../Tab";
import { Button } from "../../../Button";

import { SegmentHeader } from ".";

const SCROLL_AREA_OPTIONS = {
  overflow: {
    x: "scroll",
    y: "hidden",
  },
} as const;

const meta: Meta<typeof SegmentHeader> = {
  title: "ADS/Templates/Entity Explorer/Segment Header",
  component: SegmentHeader,
};

export default meta;

interface Args {
  width: number;
}

const Template = ({ width }: Args) => {
  // TODO: replace SegmentHeader children with proper components when ready
  return (
    <div style={{ width }}>
      <SegmentHeader>
        <ToggleButton icon="hamburger" size="md" />
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
      </SegmentHeader>
    </div>
  );
};

export const Basic = Template.bind({}) as StoryObj;

Basic.args = {
  width: 500,
};
