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
    panelComponent: (
      <div
        style={{ backgroundColor: "#CB4810", width: "100%", height: "100%" }}
      ></div>
    ),
    icon: "delete",
  },
  {
    key: "r",
    title: "Tab two",
    panelComponent: (
      <div
        style={{ backgroundColor: "#218358", width: "100%", height: "100%" }}
      ></div>
    ),
    icon: "delete",
  },
  {
    key: "r",
    title: "Tab three",
    panelComponent: (
      <div
        style={{ backgroundColor: "#457AE6", width: "100%", height: "100%" }}
      ></div>
    ),
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
