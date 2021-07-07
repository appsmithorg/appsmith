{
}

import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const FormFactory = Factory.Sync.makeFactory<WidgetProps>({
  backgroundColor: "Gray",
  rightColumn: 11,
  topRow: 0,
  bottomRow: 13,
  parentRowSpace: 38,
  isVisible: true,
  type: "FORM_WIDGET",
  dynamicBindingPathList: [],
  blueprint: {
    view: [
      {
        position: {
          top: 0,
          left: 0,
        },
        type: "CANVAS_WIDGET",
        props: {
          blueprint: {
            view: [
              {
                size: {
                  rows: 1,
                  cols: 12,
                },
                position: {
                  top: 0,
                  left: 0,
                },
                type: "TEXT_WIDGET",
                props: {
                  text: "Title",
                  textStyle: "HEADING",
                },
              },
              {
                size: {
                  rows: 1,
                  cols: 4,
                },
                position: {
                  top: 11,
                  left: 12,
                },
                type: "FORM_BUTTON_WIDGET",
                props: {
                  resetFormOnClick: false,
                  disabledWhenInvalid: true,
                  buttonStyle: "PRIMARY_BUTTON",
                  text: "Submit",
                },
              },
              {
                size: {
                  rows: 1,
                  cols: 4,
                },
                position: {
                  top: 11,
                  left: 8,
                },
                type: "FORM_BUTTON_WIDGET",
                props: {
                  resetFormOnClick: true,
                  disabledWhenInvalid: false,
                  buttonStyle: "SECONDARY_BUTTON",
                  text: "Reset",
                },
              },
            ],
          },
          detachFromLayout: true,
          children: [],
          containerStyle: "none",
          canExtend: false,
        },
      },
    ],
  },
  isLoading: false,
  parentColumnSpace: 71.75,
  leftColumn: 5,
  children: [
    {
      widgetName: "Canvas1",
      rightColumn: 430.5,
      detachFromLayout: true,
      widgetId: "nxlutw2g3v",
      containerStyle: "none",
      topRow: 0,
      bottomRow: 494,
      parentRowSpace: 1,
      isVisible: true,
      canExtend: false,
      type: "CANVAS_WIDGET",
      dynamicBindingPathList: [],
      blueprint: {
        view: [
          {
            size: {
              rows: 1,
              cols: 12,
            },
            position: {
              top: 0,
              left: 0,
            },
            type: "TEXT_WIDGET",
            props: {
              text: "Title",
              textStyle: "HEADING",
            },
          },
          {
            size: {
              rows: 1,
              cols: 4,
            },
            position: {
              top: 11,
              left: 12,
            },
            type: "FORM_BUTTON_WIDGET",
            props: {
              resetFormOnClick: false,
              disabledWhenInvalid: true,
              buttonStyle: "PRIMARY_BUTTON",
              text: "Submit",
            },
          },
          {
            size: {
              rows: 1,
              cols: 4,
            },
            position: {
              top: 11,
              left: 8,
            },
            type: "FORM_BUTTON_WIDGET",
            props: {
              resetFormOnClick: true,
              disabledWhenInvalid: false,
              buttonStyle: "SECONDARY_BUTTON",
              text: "Reset",
            },
          },
        ],
      },
      minHeight: 494,
      isLoading: false,
      parentColumnSpace: 1,
      leftColumn: 0,
      children: [
        {
          isLoading: false,
          widgetName: "Text1",
          rightColumn: 12,
          leftColumn: 0,
          widgetId: "uvz6hzdz7c",
          topRow: 0,
          bottomRow: 1,
          isVisible: true,
          text: "Title",
          textStyle: "HEADING",
          type: "TEXT_WIDGET",
          dynamicBindingPathList: [],
        },
        {
          resetFormOnClick: false,
          widgetName: "FormButton1",
          rightColumn: 16,
          isDefaultClickDisabled: true,
          widgetId: "tf20n9k4z2",
          buttonStyle: "PRIMARY_BUTTON",
          topRow: 11,
          bottomRow: 12,
          isVisible: true,
          type: "FORM_BUTTON_WIDGET",
          dynamicBindingPathList: [],
          isLoading: false,
          disabledWhenInvalid: true,
          leftColumn: 12,
          text: "Submit",
        },
        {
          resetFormOnClick: true,
          widgetName: "FormButton2",
          rightColumn: 12,
          isDefaultClickDisabled: true,
          widgetId: "6xnpe13jie",
          buttonStyle: "SECONDARY_BUTTON",
          topRow: 11,
          bottomRow: 12,
          isVisible: true,
          type: "FORM_BUTTON_WIDGET",
          dynamicBindingPathList: [],
          isLoading: false,
          disabledWhenInvalid: false,
          leftColumn: 8,
          text: "Reset",
        },
      ],
    },
  ],
  widgetName: Factory.each((i) => `Form${i + 1}`),
  widgetId: generateReactKey(),
  renderMode: "CANVAS",
  version: 1,
});
