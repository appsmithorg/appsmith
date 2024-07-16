import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { Link } from "./Link";

export default {
  title: "ADS/Link",
  component: Link,
  argTypes: {
    startIcon: {
      control: "text",
      description: "the icon at the beginning of the link",
    },
    endIcon: {
      control: "text",
      description: "the icon at the end of the link",
    },
    kind: {
      control: "radio",
      options: ["primary", "secondary"],
      description: "the kind of link",
      defaultValue: "secondary",
    },
    target: {
      control: "text",
      description: "the target of the link",
      defaultValue: "_blank",
    },
    to: {
      control: "text",
      description: "the place to navigate to",
    },
    children: {
      control: "text",
      description: "the words you want to display",
    },
  },
} as ComponentMeta<typeof Link>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof Link> = (args) => {
  return <Link {...args} />;
};

export const PrimaryLink = Template.bind({});
PrimaryLink.args = {
  to: "https://appsmith.com",
  children: "appsmith_",
  kind: "primary",
};

export const SecondaryLink = Template.bind({});
SecondaryLink.args = {
  to: "https://appsmith.com",
  children: "appsmith_",
  kind: "secondary",
};

export const InternalLink = Template.bind({});
InternalLink.args = {
  to: "old",
  children: "deprecated appsmith design system",
  endIcon: "arrow-right-line",
  kind: "primary",
};

export const LinkWithOnClick = Template.bind({});
LinkWithOnClick.args = {
  to: "old",
  children: "click me",
  onClick: () => alert("this link was clicked"),
  endIcon: "arrow-right-line",
  kind: "primary",
};

export const ExternalLink = Template.bind({});
ExternalLink.args = {
  to: "https://appsmith.com",
  children: "Appsmith",
  endIcon: "arrow-right-line",
  kind: "primary",
};
