export type DatePickerType = "DATE_PICKER" | "DATE_RANGE_PICKER";

export declare const TimePrecision: {
  NONE: "None";
  MILLISECOND: "millisecond";
  MINUTE: "minute";
  SECOND: "second";
};

export declare type TimePrecision = typeof TimePrecision[keyof typeof TimePrecision];
