import React from "react";
import { TabComponent, TabProp } from "components/ads/Tabs";
import { select, text, withKnobs } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import { IconCollection, IconName } from "components/ads/Icon";
import { StoryWrapper } from "components/ads/common";

export default {
  title: "Tabs",
  component: TabComponent,
  decorators: [withKnobs, withDesign],
};

const TabStory = (props: any) => {
  const tabArr: TabProp[] = [
    {
      key: "1",
      title: props.title1,
      panelComponent: (
        <div
          style={{
            backgroundColor: "#CB4810",
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
        ></div>
      ),
      icon: props.icon1,
    },
    {
      key: "2",
      title: props.title2,
      panelComponent: (
        <div
          style={{
            backgroundColor: "#218358",
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
        ></div>
      ),
      icon: props.icon2,
    },
    {
      key: "3",
      title: props.title3,
      panelComponent: (
        <div
          style={{
            backgroundColor: "#457AE6",
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
        ></div>
      ),
      icon: props.icon3,
    },
  ];

  if (props.icon4 || props.title4) {
    tabArr.push({
      key: "4",
      title: props.title4,
      panelComponent: (
        <div
          style={{
            backgroundColor: "grey",
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
        ></div>
      ),
      icon: props.icon4,
    });
  }

  return (
    <StoryWrapper>
      <TabComponent tabs={tabArr} />
    </StoryWrapper>
  );
};

export const Tabs = () => (
  <TabStory
    icon1={select(
      "Icon 1",
      ["Select icon" as IconName, ...IconCollection],
      "Select icon" as IconName,
    )}
    title1={text("Title 1", "General")}
    icon2={select(
      "Icon 2",
      ["Select icon" as IconName, ...IconCollection],
      "Select icon" as IconName,
    )}
    title2={text("Title 2", "User")}
    icon3={select(
      "Icon 3",
      ["Select icon" as IconName, ...IconCollection],
      "Select icon" as IconName,
    )}
    title3={text("Title 3", "Billing")}
    icon4={select(
      "Icon 4",
      ["Select icon" as IconName, ...IconCollection],
      "Select icon" as IconName,
    )}
    title4={text("Title 4", "")}
  />
);
