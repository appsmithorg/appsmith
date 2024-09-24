import React from "react";
import { MemoryRouter } from "react-router-dom";
import { Callout } from "./Callout";
import type { CalloutProps } from "./Callout.types";
import type { StoryObj } from "@storybook/react";

export default {
  title: "ADS/Components/Callout",
  component: Callout,
  argTypes: {
    _componentType: {
      table: {
        disable: true,
      },
    },
  },
  decorators: [
    (Story: () => React.ReactNode) => <MemoryRouter>{Story()}</MemoryRouter>,
  ],
};

// eslint-disable-next-line react/function-component-definition
const Template = (args: CalloutProps) => {
  return <Callout {...args}>{args.children}</Callout>;
};

export const CalloutStory = Template.bind({}) as StoryObj;
CalloutStory.storyName = "Callout";
CalloutStory.args = {
  children: "This is a successful callout",
};
CalloutStory.argTypes = {
  children: {
    control: {
      type: "text",
    },
    table: {
      type: {
        summary: "ReactNode",
      },
    },
  },
  kind: {
    defaultValue: "info",
    control: {},
  },
};

export const CalloutInfoStory = Template.bind({}) as StoryObj;
CalloutInfoStory.args = {
  ...CalloutStory.args,
  kind: "info",
};
export const CalloutSuccessStory = Template.bind({}) as StoryObj;
CalloutSuccessStory.args = {
  ...CalloutStory.args,
  kind: "success",
};

export const CalloutWarningStory = Template.bind({}) as StoryObj;
CalloutWarningStory.args = {
  ...CalloutStory.args,
  kind: "warning",
};

export const CalloutErrorStory = Template.bind({}) as StoryObj;
CalloutErrorStory.args = {
  ...CalloutStory.args,
  kind: "error",
};

export const CalloutWithLink = Template.bind({}) as StoryObj;
CalloutWithLink.args = {
  children: "This is a successful callout",
  links: [
    {
      to: "https://www.appsmith.com",
      children: "Home",
    },
    {
      children: "Docs",
      onClick: () => {
        // eslint-disable-next-line no-console
        console.log("I'm clicking things!");
      },
    },
  ],
};
CalloutWithLink.argTypes = {
  children: {
    control: {
      type: "text",
    },
    table: {
      type: {
        summary: "ReactNode",
      },
    },
  },
  kind: {
    defaultValue: "info",
    control: {},
  },
};
