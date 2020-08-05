import React from "react";
// import { withKnobs, select, boolean, text } from "@storybook/addon-knobs";
// import { withDesign } from "storybook-addon-designs";
import FilePicker from "../ads/FilePicker";

export default {
  title: "FilePicker",
  component: FilePicker,
  // decorators: [withKnobs, withDesign],
};

export const withDynamicProps = () => <FilePicker></FilePicker>;
