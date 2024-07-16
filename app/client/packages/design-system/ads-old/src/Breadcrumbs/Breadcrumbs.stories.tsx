import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import BreadcrumbsComponent from "./index";

export default {
  title: "Design System/Breadcrumbs",
  component: BreadcrumbsComponent,
  decorators: [
    (Story) => (
      <Router>
        <Story />
      </Router>
    ),
  ],
} as ComponentMeta<typeof BreadcrumbsComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof BreadcrumbsComponent> = (args) => {
  return <BreadcrumbsComponent {...args} />;
};

export const Breadcrumbs = Template.bind({});
Breadcrumbs.args = {
  items: [
    {
      href: "#",
      text: "Home",
    },
    {
      href: "#about",
      text: "About",
    },
  ],
};
