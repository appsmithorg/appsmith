/* eslint-disable no-console */
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { NoSearchResults, type NoSearchResultsProps } from ".";

const meta: Meta<typeof NoSearchResults> = {
  title: "ADS/Templates/Entity Explorer/No Search Results",
  component: NoSearchResults,
};

export default meta;

const Template = (props: NoSearchResultsProps) => {
  const { text } = props;

  return <NoSearchResults text={text} />;
};

export const Basic = Template.bind({}) as StoryObj;

Basic.args = {
  text: "No files found",
};
