import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { Callout } from "./Callout";

export default {
  title: "ADS/Callout",
  component: Callout,
  argTypes: {
    _componentType: {
      table: {
        disable: true,
      },
    },
  },
} as ComponentMeta<typeof Callout>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof Callout> = (args) => {
  return <Callout {...args}>{args.children}</Callout>;
};

export const CalloutStory = Template.bind({});
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

export const CalloutInfoStory = Template.bind({});
CalloutInfoStory.args = {
  ...CalloutStory.args,
  kind: "info",
};
export const CalloutSuccessStory = Template.bind({});
CalloutSuccessStory.args = {
  ...CalloutStory.args,
  kind: "success",
};

export const CalloutWarningStory = Template.bind({});
CalloutWarningStory.args = {
  ...CalloutStory.args,
  kind: "warning",
};

export const CalloutErrorStory = Template.bind({});
CalloutErrorStory.args = {
  ...CalloutStory.args,
  kind: "error",
};

export const CalloutWithLink = Template.bind({});
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
