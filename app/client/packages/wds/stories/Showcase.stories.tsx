import React from "react";
import Showcase from "../demo/index";

export default {
  component: Showcase,
  title: "ButtonShowcase",
};

const Template = (args: JSX.IntrinsicAttributes & { loading: boolean }) => (
  <Showcase {...args} />
);

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const Default = Template.bind({});
