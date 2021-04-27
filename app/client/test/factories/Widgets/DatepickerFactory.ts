import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const OldDatepickerFactory = Factory.Sync.makeFactory<WidgetProps>({
  widgetName: Factory.each((i) => `OldDatePicker${i + 1}`),
  rightColumn: 11,
  dateFormat: "DD/MM/YYYY",
  topRow: 7,
  bottomRow: 8,
  isValid: "{{ DatePicker1.isRequired ? !!DatePicker1.selectedDate : true }}",
  parentRowSpace: 38,
  isVisible: true,
  datePickerType: "DATE_PICKER",
  label: "From Date",
  type: "DATE_PICKER_WIDGET",
  dynamicBindingPathList: [],
  isLoading: false,
  enableTimePicker: true,
  parentColumnSpace: 34.6875,
  leftColumn: 3,
  isDisabled: false,
  widgetId: generateReactKey(),
  renderMode: "CANVAS",
  version: 1,
});

export const DatepickerFactory = Factory.Sync.makeFactory<WidgetProps>({
  widgetName: Factory.each((i) => `DatePicker${i + 1}`),
  isVisible: true,
  isDisabled: false,
  datePickerType: "DATE_PICKER",
  label: "",
  dateFormat: "DD/MM/YYYY HH:mm",
  defaultDate: "2021-02-05T10:53:12.791Z",
  version: 2,
  type: "DATE_PICKER_WIDGET2",
  isLoading: false,
  parentColumnSpace: 74,
  parentRowSpace: 40,
  leftColumn: 5,
  rightColumn: 10,
  topRow: 0,
  bottomRow: 1,
  widgetId: generateReactKey(),
  parentId: "0",
});
