import React from "react";
import { DateRangePicker } from "./DatePicker";
import type { StoryObj } from "@storybook/react";
import type { DateRangePickerProps } from "./DatePicker.types";

export default {
  title: "ADS/Components/Date Picker",
  component: DateRangePicker,
  decorators: [
    (Story: () => React.ReactNode) => (
      <div style={{ width: "100%", maxWidth: "250px", margin: "0 auto" }}>
        {Story()}
      </div>
    ),
  ],
  argTypes: {
    className: {
      control: {
        type: "text",
      },
      description: "(try not to) pass addition classes here.",
      table: {
        type: {
          summary: "string",
        },
        defaultValue: {
          summary: "",
        },
      },
    },
    inputSize: {
      control: {
        type: "radio",
        options: ["sm", "md"],
      },
      description: "Size of the input field.",
      table: {
        type: {
          summary: "sm | md",
        },
        defaultValue: {
          summary: "md",
        },
      },
    },
    yearStartRange: {
      control: {
        type: "number",
      },
      description: "Start year for the year dropdown.",
      table: {
        type: {
          summary: "number",
        },
        defaultValue: {
          summary: "1990",
        },
      },
    },
    yearEndRange: {
      control: {
        type: "number",
      },
      description: "End year for the year dropdown.",
      table: {
        type: {
          summary: "number",
        },
        defaultValue: {
          summary: "current year",
        },
      },
    },
    allowSameDay: {
      control: {
        type: "boolean",
      },
      description: "Allow the same day to be selected as start and end date.",
      table: {
        type: {
          summary: "boolean",
        },
        defaultValue: {
          summary: "false",
        },
      },
    },
    showRangeShortcuts: {
      control: {
        type: "boolean",
      },
      description:
        "Show a panel next to date range that contains quick predefined ranges",
      table: {
        type: {
          summary: "boolean",
        },
        defaultValue: {
          summary: "false",
        },
      },
    },
    showPreviousMonths: {
      control: {
        type: "boolean",
      },
      description: "When opened show previous months from the current month",
      table: {
        type: {
          summary: "boolean",
        },
        defaultValue: {
          summary: "false",
        },
      },
    },
    closeOnScroll: {
      control: {
        type: "boolean",
      },
      description:
        "Close the datepicker when the user scrolls anywhere in the screen.",
      table: {
        type: {
          summary: "boolean",
        },
        defaultValue: {
          summary: "true",
        },
      },
    },
    dateFormat: {
      control: {
        type: "text",
      },
      description: "Date format for the input field.",
      table: {
        type: {
          summary: "string",
        },
        defaultValue: {
          summary: "MM/dd/yyyy",
        },
      },
    },
    isDisabled: {
      control: {
        type: "boolean",
      },
      description: "Disable the datepicker.",
      table: {
        type: {
          summary: "boolean",
        },
        defaultValue: {
          summary: "false",
        },
      },
    },
    isRequired: {
      control: {
        type: "boolean",
      },
      description: "Make the datepicker required.",
      table: {
        type: {
          summary: "boolean",
        },
        defaultValue: {
          summary: "false",
        },
      },
    },
    isReadOnly: {
      control: {
        type: "boolean",
      },
      description: "Make the datepicker read only.",
      table: {
        type: {
          summary: "boolean",
        },
        defaultValue: {
          summary: "false",
        },
      },
    },
    startDate: {
      control: {
        type: "date",
      },
      description: "Start date of the date range picker.",
      table: {
        type: {
          summary: "Date",
        },
        defaultValue: {
          summary: "null",
        },
      },
    },
    endDate: {
      control: {
        type: "date",
      },
      description: "End date of the date range picker.",
      table: {
        type: {
          summary: "Date",
        },
        defaultValue: {
          summary: "null",
        },
      },
    },
    excludeDates: {
      control: {
        type: "array",
      },
      description: "Dates to be excluded from the datepicker.",
      table: {
        type: {
          summary: "Date[]",
        },
        defaultValue: {
          summary: "[]",
        },
      },
    },
    excludeDateIntervals: {
      control: {
        type: "string",
      },
      description: "Date intervals to be excluded from the datepicker.",
      table: {
        type: {
          summary: "Array<{ start: Date; end: Date }>",
        },
        defaultValue: {
          summary: "",
        },
      },
    },
    excludeTimes: {
      table: {
        disable: true,
      },
    },
    excludeShortcuts: {
      control: {
        type: "array",
      },
      description: "Shortcuts to be excluded from the datepicker.",
      table: {
        type: {
          summary:
            "today | yesterday | past_2_years | past_year | past_6_months | past_3_months | past_month | past_week",
        },
        defaultValue: {
          summary: "[]",
        },
      },
    },
    filterDate: {
      control: {
        type: "string",
      },
      description: "Function to filter dates.",
      table: {
        type: {
          summary: "(date: Date) => boolean",
        },
        defaultValue: {
          summary: "",
        },
      },
    },
    filterTime: {
      table: {
        disable: true,
      },
    },
    isClearable: {
      control: {
        type: "boolean",
      },
      description: "Allow the datepicker to be cleared.",
      table: {
        type: {
          summary: "boolean",
        },
        defaultValue: {
          summary: "false",
        },
      },
    },
    inputProps: {
      control: {
        type: "object",
      },
      description: "Props to be passed to the input field.",
      table: {
        type: {
          summary: "InputProps",
        },
        defaultValue: {
          summary: "{}",
        },
      },
    },
    locale: {
      control: {
        type: "text",
      },
      description: "Locale for the datepicker.",
      table: {
        type: {
          summary: "string",
        },
        defaultValue: {
          summary: "en-US",
        },
      },
    },
    label: {
      control: {
        type: "text",
      },
      description: "Label for the datepicker.",
      table: {
        type: {
          summary: "string",
        },
        defaultValue: {
          summary: "",
        },
      },
    },
    minDate: {
      control: {
        type: "date",
      },
      description: "Minimum date for the datepicker.",
      table: {
        type: {
          summary: "Date",
        },
        defaultValue: {
          summary: "null",
        },
      },
    },
    maxDate: {
      control: {
        type: "date",
      },
      description: "Maximum date for the datepicker.",
      table: {
        type: {
          summary: "Date",
        },
        defaultValue: {
          summary: "null",
        },
      },
    },
    minTime: {
      table: {
        disable: true,
      },
    },
    maxTime: {
      table: {
        disable: true,
      },
    },
    onBlur: {
      control: {
        type: "string",
      },
      description: "Function to be called when the datepicker is blurred.",
      table: {
        type: {
          summary: "(event: React.FocusEvent<HTMLInputElement>) => void",
        },
        defaultValue: {
          summary: "",
        },
      },
    },
    onCalendarClose: {
      control: {
        type: "string",
      },
      description: "Function to be called when the calendar is closed.",
      table: {
        type: {
          summary: "() => void",
        },
        defaultValue: {
          summary: "",
        },
      },
    },
    onCalendarOpen: {
      control: {
        type: "string",
      },
      description: "Function to be called when the calendar is opened.",
      table: {
        type: {
          summary: "() => void",
        },
        defaultValue: {
          summary: "",
        },
      },
    },
    onClickOutside: {
      control: {
        type: "string",
      },
      description:
        "Function to be called when the datepicker is clicked outside.",
      table: {
        type: {
          summary: "(event: React.MouseEvent<HTMLDivElement>) => void",
        },
        defaultValue: {
          summary: "",
        },
      },
    },
    open: {
      control: {
        type: "boolean",
      },
      description: "Whether the datepicker is open or not.",
      table: {
        type: {
          summary: "boolean",
        },
        defaultValue: {
          summary: "false",
        },
      },
    },
    placeholderText: {
      control: {
        type: "text",
      },
      description: "Placeholder text for the datepicker.",
      table: {
        type: {
          summary: "string",
        },
        defaultValue: {
          summary: "",
        },
      },
    },
    selected: {
      control: {
        type: "date",
      },
      description: "Selected date for the datepicker.",
      table: {
        type: {
          summary: "Date",
        },
        defaultValue: {
          summary: "null",
        },
      },
    },
    shouldCloseOnSelect: {
      control: {
        type: "boolean",
      },
      description: "Whether the datepicker should close on select or not.",
      table: {
        type: {
          summary: "boolean",
        },
        defaultValue: {
          summary: "true",
        },
      },
    },
    timeFormat: {
      table: {
        disable: true,
      },
    },
  },
};

// eslint-disable-next-line react/function-component-definition
const Template = (args: DateRangePickerProps) => {
  return <DateRangePicker {...args} />;
};

export const DateRangePickerStory = Template.bind({}) as StoryObj;
DateRangePickerStory.storyName = "Date Range Picker";
DateRangePickerStory.args = {
  //add arguments here
  excludeDates: [new Date()],
  excludeShortcuts: [],
};
