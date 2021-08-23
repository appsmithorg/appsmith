import React from "react";
import { withDesign } from "storybook-addon-designs";
import { TabComponent, TabbedViewComponentType } from "components/ads/Tabs";
import { StoryWrapper } from "components/ads/common";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";
import { action } from "@storybook/addon-actions";

export default {
  title: storyName.platform.tabs.PATH,
  component: TabComponent,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

export function TabsStory(args: TabbedViewComponentType) {
  return (
    <StoryWrapper style={{ height: 200 }}>
      <TabComponent {...args} onSelect={action("tab-selected")} />
    </StoryWrapper>
  );
}

TabsStory.args = {
  tabs: [
    {
      key: "1",
      title: "General",
      panelComponent: (
        <div
          style={{
            backgroundColor: "#CB4810",
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
        />
      ),
      icon: "",
    },
    {
      key: "2",
      title: "User",
      panelComponent: (
        <div
          style={{
            backgroundColor: "#218358",
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
        />
      ),
      icon: "user",
    },
    {
      key: "3",
      title: "Billing",
      panelComponent: (
        <div
          style={{
            backgroundColor: "#457AE6",
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
        />
      ),
      icon: "bill",
    },
  ],
  overflow: false,
  vertical: false,
};

TabsStory.argTypes = {
  overflow: { control: controlType.BOOLEAN },
  vertical: { control: controlType.BOOLEAN },
  tabs: { control: controlType.ARRAY },
  selectedIndex: { control: controlType.NUMBER },
};

TabsStory.storyName = storyName.platform.tabs.NAME;
