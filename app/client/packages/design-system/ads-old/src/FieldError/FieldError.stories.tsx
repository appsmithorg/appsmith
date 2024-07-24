import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import FormFieldErrorComponent from "./index";

export default {
  title: "Design System/FieldError",
  component: FormFieldErrorComponent,
} as ComponentMeta<typeof FormFieldErrorComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof FormFieldErrorComponent> = (args) => {
  return <FormFieldErrorComponent {...args} />;
};

export const FieldError = Template.bind({}) as StoryObj;
FieldError.args = {
  error: "This is an error",
};
