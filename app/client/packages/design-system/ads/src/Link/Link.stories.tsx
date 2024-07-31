import React from "react";
import type { StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { Link } from "./Link";
import type { LinkProps } from "./Link.types";

export default {
  title: "ADS/Components/Link",
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
  decorators: [
    (Story: () => React.ReactNode) => <MemoryRouter>{Story()}</MemoryRouter>,
  ],
};

// eslint-disable-next-line react/function-component-definition
const Template = (args: LinkProps) => {
  return <Link {...args} />;
};

export const PrimaryLink = Template.bind({}) as StoryObj;
PrimaryLink.args = {
  to: "https://appsmith.com",
  children: "appsmith_",
  kind: "primary",
};

export const SecondaryLink = Template.bind({}) as StoryObj;
SecondaryLink.args = {
  to: "https://appsmith.com",
  children: "appsmith_",
  kind: "secondary",
};

export const InternalLink = Template.bind({}) as StoryObj;
InternalLink.args = {
  to: "old",
  children: "deprecated appsmith design system",
  endIcon: "arrow-right-line",
  kind: "primary",
};

export const LinkWithOnClick = Template.bind({}) as StoryObj;
LinkWithOnClick.args = {
  to: "old",
  children: "click me",
  onClick: () => alert("this link was clicked"),
  endIcon: "arrow-right-line",
  kind: "primary",
};

export const ExternalLink = Template.bind({}) as StoryObj;
ExternalLink.args = {
  to: "https://appsmith.com",
  children: "Appsmith",
  endIcon: "arrow-right-line",
  kind: "primary",
};
