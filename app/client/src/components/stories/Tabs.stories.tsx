import React from "react";
import { AdsTabComponent } from "components/ads/Tabs";
import { withKnobs } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import { ThemeProvider } from "styled-components";
import { adsTheme } from "../ads/baseTheme";
import { IconName } from "../ads/Icon";

export default {
  title: "tabs",
  component: AdsTabComponent,
  decorators: [withKnobs, withDesign],
};

type tabSingle = {
  key: string;
  title: string;
  panelComponent: JSX.Element;
  icon: IconName;
};

const tabArr: tabSingle[] = [
  {
    key: "r",
    title: "Tab one",
    panelComponent: <h2>1</h2>,
    icon: "delete",
  },
  {
    key: "r",
    title: "Tab two",
    panelComponent: <h2>2</h2>,
    icon: "delete",
  },
  {
    key: "r",
    title: "Tab three",
    panelComponent: <h2>3</h2>,
    icon: "delete",
  },
];

export const withDynamicProps = () => (
  <div
    style={{
      width: "100%",
      height: "600px",
      backgroundColor: "#1A191C",
      padding: "100px",
    }}
  >
    <ThemeProvider theme={adsTheme}>
      <AdsTabComponent tabs={tabArr}></AdsTabComponent>
    </ThemeProvider>
  </div>
);
