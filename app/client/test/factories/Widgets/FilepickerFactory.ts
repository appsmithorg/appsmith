import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const FilepickerFactory = Factory.Sync.makeFactory<WidgetProps>({
  rightColumn: 8,
  isDefaultClickDisabled: true,
  topRow: 1,
  bottomRow: 2,
  isValid: "{{ FilePicker1.isRequired ? FilePicker1.files.length > 0 : true }}",
  parentRowSpace: 38,
  isVisible: true,
  label: "Upload Files",
  maxFileSize: "",
  type: "FILE_PICKER_WIDGET",
  dynamicBindingPathList: [],
  isLoading: false,
  parentColumnSpace: 34.6875,
  leftColumn: 4,
  files: [],
  widgetName: Factory.each((i) => `FilePicker${i + 1}`),
  widgetId: generateReactKey(),
  renderMode: "CANVAS",
  version: 1,
});
