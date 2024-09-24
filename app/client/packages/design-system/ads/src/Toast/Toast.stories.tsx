import React from "react";
import { Toast, toast } from "./Toast";
import type { ToastProps } from "./Toast.types";
import type { StoryObj } from "@storybook/react";

export default {
  title: "ADS/Components/Toast",
  component: Toast,
  argTypes: {
    content: {
      control: "text",
      description: "The content the toast contains",
      type: {
        required: true,
      },
    },
    kind: {
      description: "visual style to be used indicating type of toast ",
    },
    action: {
      description:
        "An object that displays an action that can be triggered from the toast",
    },
  },
};

// eslint-disable-next-line react/function-component-definition
const Template = (args: ToastProps) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const notify = () => toast.show(args.content, { ...args });

  return (
    <div>
      <button onClick={notify}>Click me</button>
      <Toast />
    </div>
  );
};

export const Default = Template.bind({}) as StoryObj;
Default.args = {
  content: "Am I a toast?",
};

export const SuccessToast = Template.bind({}) as StoryObj;
SuccessToast.args = {
  ...Default.args,
  kind: "success",
};

export const WarningToast = Template.bind({}) as StoryObj;
WarningToast.args = {
  ...Default.args,
  kind: "warning",
};

export const ErrorToast = Template.bind({}) as StoryObj;
ErrorToast.args = {
  ...Default.args,
  kind: "error",
};

export const InformationToast = Template.bind({}) as StoryObj;
InformationToast.args = {
  ...Default.args,
  kind: "info",
};

export const ToastWithAction = Template.bind({}) as StoryObj;
ToastWithAction.args = {
  content: "Widget was removed.",
  kind: "success",
  action: {
    text: "undo",
    // eslint-disable-next-line no-console
    effect: () => console.log("effect affected"),
  },
};
