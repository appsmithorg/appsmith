import { migrateInitialValues } from "../migrations/018-migrate-initial-values";
import { migrateToNewMultiSelect } from "../migrations/029-migrate-to-new-multiselect";

describe("Initial value migration test", () => {
  const containerWidget = {
    widgetName: "MainContainer",
    backgroundColor: "none",
    rightColumn: 1118,
    snapColumns: 16,
    detachFromLayout: true,
    widgetId: "0",
    topRow: 0,
    bottomRow: 560,
    snapRows: 33,
    isLoading: false,
    parentRowSpace: 1,
    type: "CANVAS_WIDGET",
    renderMode: "CANVAS",
    canExtend: true,
    version: 18,
    minHeight: 600,
    parentColumnSpace: 1,
    dynamicTriggerPathList: [],
    dynamicBindingPathList: [],
    leftColumn: 0,
  };

  it("Input widget", () => {
    const input = {
      ...containerWidget,
      children: [
        {
          widgetName: "Input1",
          rightColumn: 8,
          widgetId: "ra3vyy3nt2",
          topRow: 1,
          bottomRow: 2,
          parentRowSpace: 40,
          isVisible: true,
          label: "",
          type: "INPUT_WIDGET",
          version: 1,
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 3,
          inputType: "TEXT",
          renderMode: "CANVAS",
          resetOnSubmit: false,
        },
      ],
    };
    const output = {
      ...containerWidget,
      children: [
        {
          widgetName: "Input1",
          rightColumn: 8,
          widgetId: "ra3vyy3nt2",
          topRow: 1,
          bottomRow: 2,
          parentRowSpace: 40,
          isVisible: true,
          label: "",
          type: "INPUT_WIDGET",
          version: 1,
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          renderMode: "CANVAS",
          leftColumn: 3,
          inputType: "TEXT",
          // will not override existing property
          resetOnSubmit: false,
          // following properties get added
          isRequired: false,
          isDisabled: false,
        },
      ],
    };

    expect(migrateInitialValues(input)).toEqual(output);
  });

  it("MULTI_SELECT_WIDGET", () => {
    const input = {
      ...containerWidget,
      children: [
        {
          widgetName: "Select2",
          rightColumn: 59,
          isFilterable: true,
          widgetId: "zvgz9h4fh4",
          topRow: 10,
          bottomRow: 14,
          parentRowSpace: 10,
          isVisible: true,
          label: "",
          type: "DROP_DOWN_WIDGET",
          version: 1,
          parentId: "0y8sg136kg",
          isLoading: false,
          defaultOptionValue: "GREEN",
          selectionType: "MULTI_SELECT",
          parentColumnSpace: 8.35546875,
          dynamicTriggerPathList: [],
          leftColumn: 39,
          dynamicBindingPathList: [],
          renderMode: "CANVAS",
          options: [
            {
              label: "Blue",
              value: "BLUE",
            },
            {
              label: "Green",
              value: "GREEN",
            },
            {
              label: "Red",
              value: "RED",
            },
          ],
        },
      ],
    };

    const output = {
      ...containerWidget,
      children: [
        {
          renderMode: "CANVAS",
          type: "MULTI_SELECT_WIDGET",
          widgetName: "Select2",
          rightColumn: 59,
          widgetId: "zvgz9h4fh4",
          topRow: 10,
          bottomRow: 14,
          parentRowSpace: 10,
          isVisible: true,
          label: "",
          version: 1,
          parentId: "0y8sg136kg",
          isLoading: false,
          defaultOptionValue: "GREEN",
          parentColumnSpace: 8.35546875,
          dynamicTriggerPathList: [],
          leftColumn: 39,
          dynamicBindingPathList: [],
          options: [
            {
              label: "Blue",
              value: "BLUE",
            },
            {
              label: "Green",
              value: "GREEN",
            },
            {
              label: "Red",
              value: "RED",
            },
          ],
        },
      ],
    };

    expect(migrateToNewMultiSelect(input)).toEqual(output);
  });

  it("DATE_PICKER_WIDGET2", () => {
    const input = {
      ...containerWidget,
      children: [
        {
          widgetName: "DatePicker1",
          defaultDate: "2021-05-12T06:50:51.743Z",
          rightColumn: 7,
          dateFormat: "YYYY-MM-DD HH:mm",
          widgetId: "5jbfazqnca",
          topRow: 2,
          bottomRow: 3,
          parentRowSpace: 40,
          isVisible: true,
          datePickerType: "DATE_PICKER",
          label: "",
          type: "DATE_PICKER_WIDGET2",
          renderMode: "CANVAS",
          version: 2,
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 2,
          isDisabled: false,
        },
      ],
    };

    const output = {
      ...containerWidget,
      children: [
        {
          widgetName: "DatePicker1",
          defaultDate: "2021-05-12T06:50:51.743Z",
          rightColumn: 7,
          dateFormat: "YYYY-MM-DD HH:mm",
          widgetId: "5jbfazqnca",
          topRow: 2,
          bottomRow: 3,
          parentRowSpace: 40,
          isVisible: true,
          datePickerType: "DATE_PICKER",
          label: "",
          type: "DATE_PICKER_WIDGET2",
          renderMode: "CANVAS",
          version: 2,
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 2,
          isDisabled: false,
          // following properties get added
          isRequired: false,
          minDate: "2001-01-01 00:00",
          maxDate: "2041-12-31 23:59",
        },
      ],
    };

    expect(migrateInitialValues(input)).toEqual(output);
  });

  it("SWITCH_WIDGET", () => {
    const input = {
      ...containerWidget,
      children: [
        {
          widgetName: "Switch1",
          rightColumn: 5,
          widgetId: "4ksqurxmwn",
          topRow: 2,
          bottomRow: 3,
          parentRowSpace: 40,
          isVisible: true,
          label: "Label",
          type: "SWITCH_WIDGET",
          renderMode: "CANVAS",
          defaultSwitchState: true,
          version: 1,
          alignWidget: "LEFT",
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 3,
        },
      ],
    };

    const output = {
      ...containerWidget,
      children: [
        {
          widgetName: "Switch1",
          rightColumn: 5,
          widgetId: "4ksqurxmwn",
          topRow: 2,
          bottomRow: 3,
          parentRowSpace: 40,
          isVisible: true,
          label: "Label",
          type: "SWITCH_WIDGET",
          renderMode: "CANVAS",
          defaultSwitchState: true,
          version: 1,
          alignWidget: "LEFT",
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 3,
          // following properties get added
          isDisabled: false,
        },
      ],
    };

    expect(migrateInitialValues(input)).toEqual(output);
  });

  it("Video widget", () => {
    const input = {
      ...containerWidget,
      children: [
        {
          widgetName: "Video1",
          rightColumn: 9,
          dynamicPropertyPathList: [],
          widgetId: "ti5b5f5hvq",
          topRow: 3,
          bottomRow: 10,
          parentRowSpace: 40,
          isVisible: true,
          type: "VIDEO_WIDGET",
          renderMode: "CANVAS",
          version: 1,
          onPlay: "",
          url: `https://assets.appsmith.com/widgets/bird.mp4`,
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 2,
          autoPlay: false,
        },
      ],
    };
    const output = {
      ...containerWidget,
      children: [
        {
          widgetName: "Video1",
          rightColumn: 9,
          dynamicPropertyPathList: [],
          widgetId: "ti5b5f5hvq",
          topRow: 3,
          bottomRow: 10,
          parentRowSpace: 40,
          isVisible: true,
          type: "VIDEO_WIDGET",
          renderMode: "CANVAS",
          version: 1,
          onPlay: "",
          url: `https://assets.appsmith.com/widgets/bird.mp4`,
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 2,
          autoPlay: false,
          // following properties get added
          isRequired: false,
          isDisabled: false,
        },
      ],
    };

    expect(migrateInitialValues(input)).toEqual(output);
  });

  it("CHECKBOX_WIDGET", () => {
    const input = {
      ...containerWidget,
      children: [
        {
          widgetName: "Checkbox1",
          rightColumn: 8,
          widgetId: "djxhhl1p7t",
          topRow: 4,
          bottomRow: 5,
          parentRowSpace: 40,
          isVisible: true,
          label: "Label",
          type: "CHECKBOX_WIDGET",
          renderMode: "CANVAS",
          version: 1,
          alignWidget: "LEFT",
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 5,
          defaultCheckedState: true,
        },
      ],
    };
    const output = {
      ...containerWidget,
      children: [
        {
          widgetName: "Checkbox1",
          rightColumn: 8,
          widgetId: "djxhhl1p7t",
          topRow: 4,
          bottomRow: 5,
          parentRowSpace: 40,
          isVisible: true,
          label: "Label",
          type: "CHECKBOX_WIDGET",
          renderMode: "CANVAS",
          version: 1,
          alignWidget: "LEFT",
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 5,
          defaultCheckedState: true,
          // following properties get added
          isDisabled: false,
          isRequired: false,
        },
      ],
    };

    expect(migrateInitialValues(input)).toEqual(output);
  });

  it("RADIO_GROUP_WIDGET", () => {
    const input = {
      ...containerWidget,
      children: [
        {
          widgetName: "RadioGroup1",
          rightColumn: 5,
          widgetId: "4ixyqnw2no",
          topRow: 3,
          bottomRow: 5,
          parentRowSpace: 40,
          isVisible: true,
          label: "",
          type: "RADIO_GROUP_WIDGET",
          renderMode: "CANVAS",
          version: 1,
          parentId: "0",
          isLoading: false,
          defaultOptionValue: "Y",
          parentColumnSpace: 67.375,
          leftColumn: 2,
          options: [
            {
              label: "Yes",
              value: "Y",
            },
            {
              label: "No",
              value: "N",
            },
          ],
        },
      ],
    };
    const output = {
      ...containerWidget,
      children: [
        {
          widgetName: "RadioGroup1",
          rightColumn: 5,
          widgetId: "4ixyqnw2no",
          topRow: 3,
          bottomRow: 5,
          parentRowSpace: 40,
          isVisible: true,
          label: "",
          type: "RADIO_GROUP_WIDGET",
          renderMode: "CANVAS",
          version: 1,
          parentId: "0",
          isLoading: false,
          defaultOptionValue: "Y",
          parentColumnSpace: 67.375,
          leftColumn: 2,
          options: [
            {
              label: "Yes",
              value: "Y",
            },
            {
              label: "No",
              value: "N",
            },
          ],
          // following properties get added
          isDisabled: false,
          isRequired: false,
        },
      ],
    };

    expect(migrateInitialValues(input)).toEqual(output);
  });

  it("FILE_PICKER_WIDGET", () => {
    const input = {
      ...containerWidget,
      children: [
        {
          widgetName: "FilePicker1",
          rightColumn: 5,
          isDefaultClickDisabled: true,
          widgetId: "fzajyy8qft",
          topRow: 4,
          bottomRow: 5,
          parentRowSpace: 40,
          isVisible: true,
          label: "Select Files",
          maxFileSize: 5,
          type: "FILE_PICKER_WIDGET",
          renderMode: "CANVAS",
          version: 1,
          fileDataType: "Base64",
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 1,
          files: [],
          maxNumFiles: 1,
        },
      ],
    };

    const output = {
      ...containerWidget,
      children: [
        {
          widgetName: "FilePicker1",
          rightColumn: 5,
          isDefaultClickDisabled: true,
          widgetId: "fzajyy8qft",
          topRow: 4,
          bottomRow: 5,
          parentRowSpace: 40,
          isVisible: true,
          label: "Select Files",
          maxFileSize: 5,
          type: "FILE_PICKER_WIDGET",
          renderMode: "CANVAS",
          version: 1,
          fileDataType: "Base64",
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 1,
          files: [],
          maxNumFiles: 1,
          // following properties get added
          isDisabled: false,
          isRequired: false,
          allowedFileTypes: [],
        },
      ],
    };

    expect(migrateInitialValues(input)).toEqual(output);
  });
});
