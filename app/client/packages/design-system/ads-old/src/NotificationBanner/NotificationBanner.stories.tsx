import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

// change ThisComponentName to the name of the component you are writing a story for
import NotificationBanner, { NotificationVariant } from "./index";

export default {
  // change ComponentDisplay to the name of the component you are writing a story for
  title: "Design System/NotificationBanner",
  component: NotificationBanner,
} as ComponentMeta<typeof NotificationBanner>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof NotificationBanner> = (args) => {
  return <NotificationBanner {...args} />;
};

export const NotificationBannerExample = Template.bind({});
NotificationBannerExample.storyName = "Notification Banner";
NotificationBannerExample.args = {
  canClose: true,
  className: "error",
  icon: "warning-line",
  onClose: () => console.log("closed"),
  variant: NotificationVariant.error,
  learnMoreClickHandler: () => console.log("learn more clicked"),
  children: "Here is some text in a notification banner",
};
