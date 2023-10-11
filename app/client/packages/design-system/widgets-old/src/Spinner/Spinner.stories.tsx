import * as React from "react";
import {
  IconSize,
  Spinner as SpinnerComponent,
} from "@design-system/widgets-old";

import type { ComponentMeta, ComponentStory } from "@storybook/react";

export default {
  title: "Design System/Widgets-old/Spinner",
  component: SpinnerComponent,
} as ComponentMeta<typeof SpinnerComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof SpinnerComponent> = (args) => (
  <SpinnerComponent {...args} />
);

export const Spinner = Template.bind({});
Spinner.args = {
  size: IconSize.SMALL,
};
