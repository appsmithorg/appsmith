import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";
import moment from "moment-timezone";

import DatePickerComponent from "./index";

export default {
  title: "Design System/DatePicker",
  component: DatePickerComponent,
} as ComponentMeta<typeof DatePickerComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof DatePickerComponent> = (args) => {
  return <DatePickerComponent {...args} />;
};

export const DatePicker = Template.bind({});

const DATE_FORMAT = "YYYY-MM-DD";

const formatDate = (date: Date): string => {
  return moment(date).format(DATE_FORMAT);
};

const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) {
    return null;
  } else {
    const date = moment(dateStr, DATE_FORMAT);

    if (date.isValid()) return moment(dateStr, DATE_FORMAT).toDate();
    else return moment().toDate();
  }
};

DatePicker.args = {
  closeOnSelection: true,
  formatDate: formatDate,
  onChange: (date) => {
    // eslint-disable-next-line no-console
    console.log(date);
  },
  parseDate: parseDate,
  placeholder: "YYYY-MM-DD",
  showActionsBar: true,
  tabIndex: -1,
  value: new Date(),
};
