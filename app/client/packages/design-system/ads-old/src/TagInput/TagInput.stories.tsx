import React, { useState } from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import TagInputComponent from "./index";

export default {
  title: "Design System/Tag Input",
  component: TagInputComponent,
  decorators: [
    (Story) => (
      <div style={{ width: "430px" }}>
        <Story />
      </div>
    ),
  ],
} as ComponentMeta<typeof TagInputComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof TagInputComponent> = (args) => {
  const [val, setValue] = useState("");
  return (
    <TagInputComponent
      {...args}
      input={{
        value: val,
        onChange: (v) => setValue(v),
      }}
    />
  );
};

export const TagIpt = Template.bind({});
TagIpt.args = {
  label: "Emails",
  placeholder: "Enter email address",
  type: "email",
};
