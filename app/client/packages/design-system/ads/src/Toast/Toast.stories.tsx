import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { Toast, toast } from "./Toast";

export default {
  title: "ADS/Toast",
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
} as ComponentMeta<typeof Toast>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof Toast> = (args) => {
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

export const Default = Template.bind({});
Default.args = {
  content: "Am I a toast?",
};

export const SuccessToast = Template.bind({});
SuccessToast.args = {
  ...Default.args,
  kind: "success",
};

export const WarningToast = Template.bind({});
WarningToast.args = {
  ...Default.args,
  kind: "warning",
};

export const ErrorToast = Template.bind({});
ErrorToast.args = {
  ...Default.args,
  kind: "error",
};

export const InformationToast = Template.bind({});
InformationToast.args = {
  ...Default.args,
  kind: "info",
};

export const ToastWithAction = Template.bind({});
ToastWithAction.args = {
  content: "Widget was removed.",
  kind: "success",
  action: {
    text: "undo",
    effect: () => console.log("effect affected"),
  },
};
