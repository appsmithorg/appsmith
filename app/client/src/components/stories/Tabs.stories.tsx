import React from "react";
import { TabComponent } from "components/ads/Tabs";
import { select, text, withKnobs } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import { IconName } from "components/ads/Icon";
import styled from "styled-components";

export default {
  title: "Tabs",
  component: TabComponent,
  decorators: [withKnobs, withDesign],
};

type tabSingle = {
  key: string;
  title: string;
  panelComponent: JSX.Element;
  icon: IconName;
};

const TabStory = (props: any) => {
  const tabArr: tabSingle[] = [
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
      "icon1",
      ["Select icon", "general", "billing", "delete", "user"],
      "general",
    )}
    title1={text("title1", "General")}
    icon2={select(
      "icon2",
      ["Select icon", "general", "billing", "delete", "user"],
      "user",
    )}
    title2={text("title2", "User")}
    icon3={select(
      "icon3",
      ["Select icon", "general", "billing", "delete", "user"],
      "billing",
    )}
    title3={text("title3", "Billing")}
    icon4={select(
      "icon4",
      ["Select icon", "general", "billing", "delete", "user"],
      undefined,
    )}
    title4={text("title4", "")}
  />
);

export const StoryWrapper = styled.div`
  background: #1a191c;
  height: 700px;
  padding: 50px 100px;
`;
