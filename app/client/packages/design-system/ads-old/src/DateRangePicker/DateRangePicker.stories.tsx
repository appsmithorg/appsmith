import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { DateRangePicker as DateRangePickerComponent } from "./index";
import moment from "moment-timezone";

export default {
  title: "Design System/DateRangePicker",
  component: DateRangePickerComponent,
} as ComponentMeta<typeof DateRangePickerComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof DateRangePickerComponent> = (args) => {
  return <DateRangePickerComponent {...args} />;
};

function parseDate(dateStr: string): Date | null {
  if (!dateStr) {
    return null;
  } else {
    const dateFormat = "DD-MM-YYYY";
    const date = moment(dateStr, dateFormat);

    if (date.isValid()) return moment(dateStr, dateFormat).toDate();
    else return moment().toDate();
  }
}

function formatDate(date: Date): string {
  const dateFormat = "DD-MM-YYYY";
  return moment(date).format(dateFormat);
}

export const DateRangePicker = Template.bind({}) as StoryObj;
DateRangePicker.args = {
  formatDate,
  parseDate,
};
