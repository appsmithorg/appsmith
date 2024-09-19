import {
  Positioning,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import type { DSLWidget } from "WidgetProvider/constants";
import {
  fitChildWidgetsIntoLayers,
  getAutoCanvasWidget,
  getCondensedGroupedWidgets,
  getTopLeftMostWidget,
  processGroupedWidgets,
} from "../fixedToAutoLayout";

jest.mock("WidgetProvider/factory/index", () => ({
  widgetConfigMap: {
    get: jest.fn(() => {
      /**/
    }),
  },
  getWidgetAutoLayoutConfig: jest.fn(() => {
    /**/
  }),
}));

describe("test fixed to Auto Conversion methods", () => {
  const childWidgets = [
    {
      boxShadow: "none",
      widgetName: "Button1",
      topRow: 0.0,
      bottomRow: 4.0,
      type: "BUTTON_WIDGET",
      leftColumn: 0.0,
      rightColumn: 16.0,
      widgetId: "oc0e52x3mq",
    },
    {
      widgetName: "Button3",
      topRow: 0.0,
      bottomRow: 4.0,
      type: "BUTTON_WIDGET",
      leftColumn: 48.0,
      rightColumn: 64.0,
      widgetId: "em4ubqs787",
    },
    {
      widgetName: "Input1",
      topRow: 2.0,
      bottomRow: 9.0,
      type: "INPUT_WIDGET_V2",
      leftColumn: 23.0,
      rightColumn: 43.0,
      widgetId: "50rdpq2yow",
    },
    {
      widgetName: "Form1",
      topRow: 11.0,
      bottomRow: 50.0,
      type: "FORM_WIDGET",
      leftColumn: 2.0,
      children: [
        {
          widgetName: "Canvas1",
          topRow: 0.0,
          bottomRow: 390.0,
          type: "CANVAS_WIDGET",
          minHeight: 390.0,
          leftColumn: 0.0,
          children: [
            {
              widgetName: "Text1",
              topRow: 1.0,
              bottomRow: 5.0,
              type: "TEXT_WIDGET",
              leftColumn: 1.5,
              rightColumn: 25.5,
              widgetId: "y1u22x7gj9",
              parentId: "lwl0t7o358",
            },
            {
              widgetName: "Button4",
              topRow: 33.0,
              bottomRow: 37.0,
              type: "BUTTON_WIDGET",
              leftColumn: 46.0,
              rightColumn: 62.0,
              widgetId: "7dnsyyas3b",
              parentId: "lwl0t7o358",
            },
            {
              widgetName: "Button5",
              topRow: 33.0,
              bottomRow: 37.0,
              type: "BUTTON_WIDGET",
              leftColumn: 30.0,
              rightColumn: 46.0,
              parentId: "lwl0t7o358",
            },
          ],
          widgetId: "lwl0t7o358",
          parentId: "quvrkp960y",
        },
      ],
      rightColumn: 26.0,
      widgetId: "quvrkp960y",
      parentId: "0",
    },
    {
      widgetName: "Button6",
      topRow: 26.0,
      bottomRow: 30.0,
      parentRowSpace: 10.0,
      type: "BUTTON_WIDGET",
      leftColumn: 30.0,
      rightColumn: 46.0,
      widgetId: "e9fhrq8uvf",
      parentId: "0",
    },
    {
      widgetName: "Modal1",
      topRow: 16.0,
      bottomRow: 256.0,
      parentRowSpace: 10.0,
      type: "MODAL_WIDGET",
      leftColumn: 9.0,
      children: [],
      rightColumn: 33.0,
      widgetId: "tf847brtfd",
      parentId: "0",
    },
    {
      widgetName: "Container1",
      topRow: 36.0,
      bottomRow: 61.0,
      type: "CONTAINER_WIDGET",
      leftColumn: 38.0,
      children: [
        {
          widgetName: "Canvas3",
          topRow: 0.0,
          bottomRow: 250.0,
          type: "CANVAS_WIDGET",
          minHeight: 250.0,
          leftColumn: 0.0,
          children: [
            {
              widgetName: "Container2Copy",
              topRow: 0.0,
              bottomRow: 13.0,
              type: "CONTAINER_WIDGET",
              leftColumn: 36.0,
              children: [
                {
                  widgetName: "Canvas4Copy",
                  topRow: 0.0,
                  bottomRow: 130.0,
                  type: "CANVAS_WIDGET",
                  minHeight: 130.0,
                  leftColumn: 0.0,
                  children: [
                    {
                      widgetName: "Button9Copy",
                      topRow: 0.0,
                      bottomRow: 4.0,
                      type: "BUTTON_WIDGET",
                      leftColumn: 2.0,
                      rightColumn: 18.0,
                      widgetId: "rbgq3cl9j0",
                      parentId: "vap4aivehm",
                    },
                    {
                      widgetName: "Button10Copy",
                      topRow: 7.0,
                      bottomRow: 11.0,
                      type: "BUTTON_WIDGET",
                      leftColumn: 33.0,
                      rightColumn: 49.0,
                      widgetId: "to5e5cr2ph",
                      parentId: "vap4aivehm",
                    },
                  ],
                  rightColumn: 105.5625,
                  widgetId: "vap4aivehm",
                  parentId: "pd2zln825w",
                },
              ],
              rightColumn: 60.0,
              widgetId: "pd2zln825w",
              parentId: "b6wgydyko8",
              renderMode: "CANVAS",
            },
            {
              widgetName: "Container2",
              topRow: 10.0,
              bottomRow: 23.0,
              type: "CONTAINER_WIDGET",
              leftColumn: 0.0,
              children: [
                {
                  widgetName: "Canvas4",
                  topRow: 0.0,
                  bottomRow: 130.0,
                  type: "CANVAS_WIDGET",
                  minHeight: 130.0,
                  leftColumn: 0.0,
                  children: [
                    {
                      widgetName: "Button9",
                      topRow: 0.0,
                      bottomRow: 4.0,
                      type: "BUTTON_WIDGET",
                      leftColumn: 2.0,
                      rightColumn: 18.0,
                      widgetId: "o529pnktws",
                      parentId: "se4m3djd2t",
                    },
                    {
                      widgetName: "Button10",
                      topRow: 7.0,
                      bottomRow: 11.0,
                      type: "BUTTON_WIDGET",
                      leftColumn: 33.0,
                      rightColumn: 49.0,
                      widgetId: "vf1wsdypci",
                      parentId: "se4m3djd2t",
                    },
                  ],

                  rightColumn: 105.5625,
                  widgetId: "se4m3djd2t",
                  parentId: "x7ahy6olyf",
                },
              ],
              rightColumn: 24.0,
              widgetId: "x7ahy6olyf",
              parentId: "b6wgydyko8",
            },
          ],
          rightColumn: 301.5,
          widgetId: "b6wgydyko8",
          parentId: "vibz0hwj64",
        },
      ],
      rightColumn: 62.0,
      parentId: "0",
    },
  ] as unknown as DSLWidget[];

  const convertedChildren = [
    {
      alignment: "start",
      bottomRow: 4,
      boxShadow: "none",
      flexVerticalAlignment: "end",
      leftColumn: 0,
      responsiveBehavior: "hug",
      rightColumn: 16,
      topRow: 0,
      type: "BUTTON_WIDGET",
      widgetId: "oc0e52x3mq",
      widgetName: "Button1",
    },
    {
      alignment: "end",
      bottomRow: 9,
      flexVerticalAlignment: "end",
      leftColumn: 23,
      responsiveBehavior: "hug",
      rightColumn: 43,
      topRow: 2,
      type: "INPUT_WIDGET_V2",
      widgetId: "50rdpq2yow",
      widgetName: "Input1",
    },
    {
      alignment: "end",
      bottomRow: 4,
      flexVerticalAlignment: "end",
      leftColumn: 48,
      responsiveBehavior: "hug",
      rightColumn: 64,
      topRow: 0,
      type: "BUTTON_WIDGET",
      widgetId: "em4ubqs787",
      widgetName: "Button3",
    },
    {
      alignment: "start",
      bottomRow: 50,
      children: [
        {
          bottomRow: 100,
          children: [
            {
              alignment: "start",
              bottomRow: 5,
              flexVerticalAlignment: "end",
              leftColumn: 1.5,
              parentId: "lwl0t7o358",
              responsiveBehavior: "hug",
              rightColumn: 25.5,
              topRow: 1,
              type: "TEXT_WIDGET",
              widgetId: "y1u22x7gj9",
              widgetName: "Text1",
            },
            {
              alignment: "end",
              bottomRow: 37,
              flexVerticalAlignment: "end",
              leftColumn: 30,
              parentId: "lwl0t7o358",
              responsiveBehavior: "hug",
              rightColumn: 46,
              topRow: 33,
              type: "BUTTON_WIDGET",
              widgetName: "Button5",
            },
            {
              alignment: "end",
              bottomRow: 37,
              flexVerticalAlignment: "end",
              leftColumn: 46,
              parentId: "lwl0t7o358",
              responsiveBehavior: "hug",
              rightColumn: 62,
              topRow: 33,
              type: "BUTTON_WIDGET",
              widgetId: "7dnsyyas3b",
              widgetName: "Button4",
            },
          ],
          flexLayers: [
            {
              children: [
                {
                  align: "start",
                  id: "y1u22x7gj9",
                },
              ],
            },
            {
              children: [
                {
                  align: "end",
                  id: undefined,
                },
                {
                  align: "end",
                  id: "7dnsyyas3b",
                },
              ],
            },
          ],
          leftColumn: 0,
          minHeight: 100,
          parentId: "quvrkp960y",
          positioning: "vertical",
          responsiveBehavior: "fill",
          topRow: 0,
          type: "CANVAS_WIDGET",
          useAutoLayout: true,
          widgetId: "lwl0t7o358",
          widgetName: "Canvas1",
        },
      ],
      flexVerticalAlignment: "end",
      leftColumn: 2,
      parentId: "0",
      responsiveBehavior: "hug",
      rightColumn: 26,
      topRow: 11,
      type: "FORM_WIDGET",
      widgetId: "quvrkp960y",
      widgetName: "Form1",
    },
    {
      alignment: "start",
      bottomRow: 30,
      flexVerticalAlignment: "end",
      leftColumn: 30,
      parentId: "0",
      parentRowSpace: 10,
      responsiveBehavior: "hug",
      rightColumn: 46,
      topRow: 26,
      type: "BUTTON_WIDGET",
      widgetId: "e9fhrq8uvf",
      widgetName: "Button6",
    },
    {
      alignment: "end",
      bottomRow: 61,
      children: [
        {
          bottomRow: 250,
          children: [
            {
              alignment: "start",
              bottomRow: 23,
              children: [
                {
                  bottomRow: 100,
                  children: [
                    {
                      alignment: "start",
                      bottomRow: 4,
                      flexVerticalAlignment: "end",
                      leftColumn: 2,
                      parentId: "se4m3djd2t",
                      responsiveBehavior: "hug",
                      rightColumn: 18,
                      topRow: 0,
                      type: "BUTTON_WIDGET",
                      widgetId: "o529pnktws",
                      widgetName: "Button9",
                    },
                    {
                      alignment: "center",
                      bottomRow: 11,
                      flexVerticalAlignment: "end",
                      leftColumn: 33,
                      parentId: "se4m3djd2t",
                      responsiveBehavior: "hug",
                      rightColumn: 49,
                      topRow: 7,
                      type: "BUTTON_WIDGET",
                      widgetId: "vf1wsdypci",
                      widgetName: "Button10",
                    },
                  ],
                  flexLayers: [
                    {
                      children: [
                        {
                          align: "start",
                          id: "o529pnktws",
                        },
                      ],
                    },
                    {
                      children: [
                        {
                          align: "center",
                          id: "vf1wsdypci",
                        },
                      ],
                    },
                  ],
                  leftColumn: 0,
                  minHeight: 100,
                  parentId: "x7ahy6olyf",
                  positioning: "vertical",
                  responsiveBehavior: "fill",
                  rightColumn: 105.5625,
                  topRow: 0,
                  type: "CANVAS_WIDGET",
                  useAutoLayout: true,
                  widgetId: "se4m3djd2t",
                  widgetName: "Canvas4",
                },
              ],
              flexVerticalAlignment: "end",
              leftColumn: 0,
              parentId: "b6wgydyko8",
              responsiveBehavior: "hug",
              rightColumn: 24,
              topRow: 10,
              type: "CONTAINER_WIDGET",
              widgetId: "x7ahy6olyf",
              widgetName: "Container2",
            },
            {
              alignment: "end",
              bottomRow: 13,
              children: [
                {
                  bottomRow: 100,
                  children: [
                    {
                      alignment: "start",
                      bottomRow: 4,
                      flexVerticalAlignment: "end",
                      leftColumn: 2,
                      parentId: "vap4aivehm",
                      responsiveBehavior: "hug",
                      rightColumn: 18,
                      topRow: 0,
                      type: "BUTTON_WIDGET",
                      widgetId: "rbgq3cl9j0",
                      widgetName: "Button9Copy",
                    },
                    {
                      alignment: "center",
                      bottomRow: 11,
                      flexVerticalAlignment: "end",
                      leftColumn: 33,
                      parentId: "vap4aivehm",
                      responsiveBehavior: "hug",
                      rightColumn: 49,
                      topRow: 7,
                      type: "BUTTON_WIDGET",
                      widgetId: "to5e5cr2ph",
                      widgetName: "Button10Copy",
                    },
                  ],
                  flexLayers: [
                    {
                      children: [
                        {
                          align: "start",
                          id: "rbgq3cl9j0",
                        },
                      ],
                    },
                    {
                      children: [
                        {
                          align: "center",
                          id: "to5e5cr2ph",
                        },
                      ],
                    },
                  ],
                  leftColumn: 0,
                  minHeight: 100,
                  parentId: "pd2zln825w",
                  positioning: "vertical",
                  responsiveBehavior: "fill",
                  rightColumn: 105.5625,
                  topRow: 0,
                  type: "CANVAS_WIDGET",
                  useAutoLayout: true,
                  widgetId: "vap4aivehm",
                  widgetName: "Canvas4Copy",
                },
              ],
              flexVerticalAlignment: "end",
              leftColumn: 36,
              parentId: "b6wgydyko8",
              renderMode: "CANVAS",
              responsiveBehavior: "hug",
              rightColumn: 60,
              topRow: 0,
              type: "CONTAINER_WIDGET",
              widgetId: "pd2zln825w",
              widgetName: "Container2Copy",
            },
          ],
          flexLayers: [
            {
              children: [
                {
                  align: "start",
                  id: "x7ahy6olyf",
                },
                {
                  align: "end",
                  id: "pd2zln825w",
                },
              ],
            },
          ],
          leftColumn: 0,
          minHeight: 250,
          parentId: "vibz0hwj64",
          positioning: "vertical",
          responsiveBehavior: "fill",
          rightColumn: 301.5,
          topRow: 0,
          type: "CANVAS_WIDGET",
          useAutoLayout: true,
          widgetId: "b6wgydyko8",
          widgetName: "Canvas3",
        },
      ],
      flexVerticalAlignment: "end",
      leftColumn: 38,
      parentId: "0",
      responsiveBehavior: "hug",
      rightColumn: 62,
      topRow: 36,
      type: "CONTAINER_WIDGET",
      widgetName: "Container1",
    },
    {
      bottomRow: 256,
      children: [],
      leftColumn: 9,
      parentId: "0",
      parentRowSpace: 10,
      responsiveBehavior: "hug",
      rightColumn: 33,
      topRow: 16,
      type: "MODAL_WIDGET",
      widgetId: "tf847brtfd",
      widgetName: "Modal1",
    },
  ];

  it("test getAutoCanvasWidget method to add responsive props to dsl", () => {
    const canvasDsl = {
      type: "CANVAS_WIDGET",
      widgetId: "0",
      leftColumn: 40,
      rightColumn: 340,
      topRow: 20,
      bottomRow: 400,
      minHeight: 400,
      children: [],
    };

    const responsiveCanvasDsl = {
      type: "CANVAS_WIDGET",
      widgetId: "0",
      leftColumn: 40,
      rightColumn: 340,
      topRow: 20,
      bottomRow: 400,
      minHeight: 400,
      children: [],
      useAutoLayout: true,
      responsiveBehavior: ResponsiveBehavior.Fill,
      positioning: Positioning.Vertical,
      flexLayers: [],
    };

    expect(getAutoCanvasWidget(canvasDsl as unknown as DSLWidget)).toEqual(
      responsiveCanvasDsl,
    );
  });

  it("test fitChildWidgetsIntoLayers method", () => {
    const flexLayers = [
      {
        children: [
          {
            align: "start",
            id: "oc0e52x3mq",
          },
          {
            align: "end",
            id: "50rdpq2yow",
          },
          {
            align: "end",
            id: "em4ubqs787",
          },
        ],
      },
      {
        children: [
          {
            align: "start",
            id: "quvrkp960y",
          },
          {
            align: "start",
            id: "e9fhrq8uvf",
          },
        ],
      },
      {
        children: [
          {
            align: "end",
            id: undefined,
          },
        ],
      },
      {
        children: [
          {
            align: "center",
            id: "tf847brtfd",
          },
        ],
      },
    ];

    const calculatedBottomRow = 75;

    expect(
      fitChildWidgetsIntoLayers(childWidgets as unknown as DSLWidget[]),
    ).toEqual({ children: convertedChildren, flexLayers, calculatedBottomRow });
  });

  it("test getTopLeftMostWidget method should return the left most widget in the layer", () => {
    const topLeftMostWidget = {
      bottomRow: 4,
      boxShadow: "none",
      leftColumn: 0,
      rightColumn: 16,
      topRow: 0,
      type: "BUTTON_WIDGET",
      widgetId: "oc0e52x3mq",
      widgetName: "Button1",
    };

    expect(getTopLeftMostWidget(childWidgets)).toEqual({
      topLeftMostWidget,
      index: 0,
    });
  });

  it("test processGroupedWidgets and condensedGroupedWidgets to get Alignments based on groups", () => {
    const groups = [
      {
        widgets: ["1", "2"],
        leftColumn: 3,
        rightColumn: 11, //7
      },
      {
        widgets: ["3", "4"],
        leftColumn: 18,
        rightColumn: 27, //9
      },
      {
        widgets: ["5", "6"],
        leftColumn: 36,
        rightColumn: 43, //7
      },
      {
        widgets: ["7", "8"],
        leftColumn: 50,
        rightColumn: 54, //8
      },
      {
        widgets: ["9", "10"],
        leftColumn: 62,
        rightColumn: 64,
      },
    ];
    const condensedGroups = [
      {
        leftColumn: 3,
        rightColumn: 27,
        widgets: ["1", "2", "3", "4"],
      },
      {
        leftColumn: 3,
        rightColumn: 54,
        widgets: ["5", "6", "7", "8"],
      },
      {
        leftColumn: 3,
        rightColumn: 64,
        widgets: ["9", "10"],
      },
    ];
    const widgetAlignments = {
      "1": "start",
      "2": "start",
      "3": "start",
      "4": "start",
      "5": "center",
      "6": "center",
      "7": "center",
      "8": "center",
      "9": "end",
      "10": "end",
    };

    expect(getCondensedGroupedWidgets(groups)).toEqual(condensedGroups);
    expect(processGroupedWidgets(groups)).toEqual(widgetAlignments);
  });
});
