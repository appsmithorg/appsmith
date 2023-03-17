import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const ModalFactory = Factory.Sync.makeFactory<WidgetProps>({
  rightColumn: 0,
  detachFromLayout: true,
  topRow: 0,
  bottomRow: 0,
  parentRowSpace: 1,
  isVisible: false,
  canOutsideClickClose: true,
  type: "MODAL_WIDGET",
  canEscapeKeyClose: true,
  parentId: "0",
  shouldScrollContents: true,
  blueprint: {
    view: [
      {
        position: {
          top: 0,
          left: 0,
        },
        type: "CANVAS_WIDGET",
        props: {
          shouldScrollContents: false,
          blueprint: {
            view: [
              {
                size: {
                  rows: 1,
                  cols: 1,
                },
                position: {
                  top: 0,
                  left: 15,
                },
                type: "ICON_WIDGET",
                props: {
                  color: "#040627",
                  iconName: "cross",
                  iconSize: 24,
                },
              },
              {
                size: {
                  rows: 1,
                  cols: 15,
                },
                position: {
                  top: 0,
                  left: 0,
                },
                type: "TEXT_WIDGET",
                props: {
                  text: "Modal Title",
                  textStyle: "HEADING",
                },
              },
              {
                size: {
                  rows: 1,
                  cols: 3,
                },
                position: {
                  top: 4,
                  left: 10,
                },
                type: "BUTTON_WIDGET",
                props: {
                  buttonStyle: "SECONDARY_BUTTON",
                  text: "Cancel",
                },
              },
              {
                size: {
                  rows: 1,
                  cols: 3,
                },
                position: {
                  top: 4,
                  left: 13,
                },
                type: "BUTTON_WIDGET",
                props: {
                  buttonStyle: "PRIMARY_BUTTON",
                  text: "Confirm",
                },
              },
            ],
            operations: [
              {
                type: "MODIFY_PROPS",
              },
            ],
          },
          detachFromLayout: true,
          children: [],
          isVisible: true,
          isDisabled: false,
          canExtend: true,
        },
      },
    ],
  },
  isLoading: false,
  parentColumnSpace: 1,
  size: "MODAL_SMALL",
  leftColumn: 0,
  children: [
    {
      widgetName: "Canvas1",
      rightColumn: 0,
      detachFromLayout: true,
      widgetId: "dma7flgdrm",
      topRow: 0,
      bottomRow: 0,
      parentRowSpace: 1,
      isVisible: true,
      canExtend: true,
      type: "CANVAS_WIDGET",
      parentId: "s8mtp5krfz",
      shouldScrollContents: false,
      blueprint: {
        view: [
          {
            size: {
              rows: 1,
              cols: 1,
            },
            position: {
              top: 0,
              left: 15,
            },
            type: "ICON_WIDGET",
            props: {
              color: "#040627",
              iconName: "cross",
              iconSize: 24,
            },
          },
          {
            size: {
              rows: 1,
              cols: 15,
            },
            position: {
              top: 0,
              left: 0,
            },
            type: "TEXT_WIDGET",
            props: {
              text: "Modal Title",
              textStyle: "HEADING",
            },
          },
          {
            size: {
              rows: 1,
              cols: 3,
            },
            position: {
              top: 4,
              left: 10,
            },
            type: "BUTTON_WIDGET",
            props: {
              buttonStyle: "SECONDARY_BUTTON",
              text: "Cancel",
            },
          },
          {
            size: {
              rows: 1,
              cols: 3,
            },
            position: {
              top: 4,
              left: 13,
            },
            type: "BUTTON_WIDGET",
            props: {
              buttonStyle: "PRIMARY_BUTTON",
              text: "Confirm",
            },
          },
        ],
        operations: [
          {
            type: "MODIFY_PROPS",
          },
        ],
      },
      minHeight: 0,
      isLoading: false,
      parentColumnSpace: 1,
      leftColumn: 0,
      children: [
        {
          widgetName: "Icon1",
          rightColumn: 16,
          onClick: "{{closeModal('TestModal')}}",
          color: "#040627",
          iconName: "cross",
          widgetId: "n5fc0ven2a",
          topRow: 0,
          bottomRow: 1,
          isVisible: true,
          type: "ICON_WIDGET",
          parentId: "dma7flgdrm",
          isLoading: false,
          leftColumn: 15,
          iconSize: 24,
        },
        {
          isLoading: false,
          widgetName: "Text1",
          rightColumn: 15,
          leftColumn: 0,
          widgetId: "s818l5hhvq",
          topRow: 0,
          bottomRow: 1,
          isVisible: true,
          text: "Modal Title",
          textStyle: "HEADING",
          type: "TEXT_WIDGET",
          parentId: "dma7flgdrm",
        },
        {
          widgetName: "Button1",
          rightColumn: 13,
          isDefaultClickDisabled: true,
          widgetId: "io777lh7bc",
          buttonStyle: "SECONDARY_BUTTON",
          topRow: 4,
          bottomRow: 5,
          isVisible: true,
          type: "BUTTON_WIDGET",
          parentId: "dma7flgdrm",
          isLoading: false,
          leftColumn: 10,
          text: "Cancel",
          isDisabled: false,
        },
        {
          widgetName: "Button2",
          rightColumn: 16,
          isDefaultClickDisabled: true,
          widgetId: "gexp49bfyb",
          buttonStyle: "PRIMARY_BUTTON",
          topRow: 4,
          bottomRow: 5,
          isVisible: true,
          type: "BUTTON_WIDGET",
          parentId: "dma7flgdrm",
          isLoading: false,
          leftColumn: 13,
          text: "Confirm",
          isDisabled: false,
        },
      ],
      isDisabled: false,
    },
  ],
  dynamicBindingPathList: [],
  widgetName: Factory.each((i) => `Modal${i + 1}`),
  widgetId: generateReactKey(),
  renderMode: "CANVAS",
  version: 1,
});
