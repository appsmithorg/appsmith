import React from "react";
import { withDesign } from "storybook-addon-designs";
import RadioComponent, { RadioProps } from "components/ads/Radio";
import { action } from "@storybook/addon-actions";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";

export default {
  title: storyName.platform.form.radio.PATH,
  component: RadioComponent,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

export function Radio(args: RadioProps) {
  return (
    <div style={{ height: "133px" }}>
      <RadioComponent {...args} />
    </div>
  );
}

Radio.args = {
  columns: 3,
  defaultValue: "React",
  disabled: false,
  onSelect: action("selected-radio-option"),
  options: [
    {
      label: "React",
      value: "React",
      onSelect: action("first-radio-option"),
      disabled: false,
    },
    {
      label: "Angular",
      value: "Angular",
      onSelect: action("second-radio-option"),
      disabled: false,
    },
    {
      label: "Vue",
      value: "Vue",
      onSelect: action("third-radio-option"),
      disabled: false,
    },
  ],
  rows: 3,
};

Radio.argTypes = {
  columns: { control: controlType.NUMBER },
  defaultValue: {
    control: controlType.SELECT,
    options: ["React", "Angular", "Vue"],
  },
  disabled: { control: controlType.BOOLEAN },
  rows: { control: controlType.NUMBER },
};

Radio.storyName = storyName.platform.form.radio.NAME;
