import { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import { compareAndGenerateImmutableCanvasStructure } from "./canvasStructureHelpers";
const canvasStructure: CanvasStructure = {
  widgetId: "x",
  widgetName: "x",
  type: "CONTAINER_WIDGET",
  children: [
    {
      widgetId: "y",
      widgetName: "y",
      type: "CONTAINER_WIDGET",
      children: [
        {
          widgetId: "z",
          widgetName: "z",
          type: "CONTAINER_WIDGET",
        },
      ],
    },
    {
      widgetId: "m",
      widgetName: "m",
      type: "CONTAINER_WIDGET",
      children: [
        {
          widgetId: "n",
          widgetName: "n",
          type: "CONTAINER_WIDGET",
          children: [
            {
              widgetId: "o",
              widgetName: "o",
              type: "CONTAINER_WIDGET",
            },
          ],
        },
      ],
    },
  ],
};

const simpleDSL: any = {
  widgetId: "x",
  widgetName: "x",
  type: "CONTAINER_WIDGET",
  children: [
    {
      widgetId: "y",
      widgetName: "y",
      type: "CONTAINER_WIDGET",

      children: [
        {
          widgetId: "z",
          widgetName: "z",
          type: "CONTAINER_WIDGET",
        },
      ],
    },
    {
      widgetId: "m",
      widgetName: "m",
      type: "CONTAINER_WIDGET",

      children: [
        {
          widgetId: "n",
          widgetName: "n",
          type: "CONTAINER_WIDGET",

          children: [
            {
              widgetId: "o",
              widgetName: "o",
              type: "CONTAINER_WIDGET",
            },
          ],
        },
      ],
    },
  ],
};

const newDSL: any = {
  widgetName: "MainContainer",
  backgroundColor: "none",
  rightColumn: 1224,
  snapColumns: 16,
  detachFromLayout: true,
  widgetId: "0",
  topRow: 0,
  bottomRow: 4320,
  containerStyle: "none",
  snapRows: 33,
  parentRowSpace: 1,
  type: "CANVAS_WIDGET",
  canExtend: true,
  dynamicBindingPathList: [],
  version: 6,
  minHeight: 1292,
  parentColumnSpace: 1,
  leftColumn: 0,
  children: [
    {
      isVisible: true,
      text: "Submit",
      buttonStyle: "PRIMARY_BUTTON",
      widgetName: "Button16",
      isDisabled: false,
      isDefaultClickDisabled: true,
      type: "BUTTON_WIDGET",
      isLoading: false,
      parentColumnSpace: 74,
      parentRowSpace: 40,
      leftColumn: 0,
      rightColumn: 10,
      topRow: 43,
      bottomRow: 50,
      parentId: "0",
      widgetId: "77rkwd5hm7",
      dynamicTriggerPathList: [{ key: "onClick" }],
      onClick: "{{showModal('Modal1')}}",
    },
    {
      isVisible: true,
      text: "Submit",
      buttonStyle: "PRIMARY_BUTTON",
      widgetName: "Button17",
      isDisabled: false,
      isDefaultClickDisabled: true,
      type: "BUTTON_WIDGET",
      isLoading: false,
      parentColumnSpace: 74,
      parentRowSpace: 40,
      leftColumn: 0,
      rightColumn: 10,
      topRow: 51,
      bottomRow: 58,
      parentId: "0",
      widgetId: "atvf7cgber",
    },
    {
      isVisible: true,
      text: "Submit",
      buttonStyle: "PRIMARY_BUTTON",
      widgetName: "Button20",
      isDisabled: false,
      isDefaultClickDisabled: true,
      type: "BUTTON_WIDGET",
      isLoading: false,
      parentColumnSpace: 74,
      parentRowSpace: 40,
      leftColumn: 0,
      rightColumn: 10,
      topRow: 59,
      bottomRow: 66,
      parentId: "0",
      widgetId: "c09qn063tc",
    },
    {
      isVisible: true,
      text: "Submit",
      buttonStyle: "PRIMARY_BUTTON",
      widgetName: "Button21",
      isDisabled: false,
      isDefaultClickDisabled: true,
      type: "BUTTON_WIDGET",
      isLoading: false,
      parentColumnSpace: 74,
      parentRowSpace: 40,
      leftColumn: 0,
      rightColumn: 10,
      topRow: 67,
      bottomRow: 74,
      parentId: "0",
      widgetId: "cu7873x1s6",
    },
    {
      isVisible: true,
      text: "Submit",
      buttonStyle: "PRIMARY_BUTTON",
      widgetName: "Button22",
      isDisabled: false,
      isDefaultClickDisabled: true,
      type: "BUTTON_WIDGET",
      isLoading: false,
      parentColumnSpace: 74,
      parentRowSpace: 40,
      leftColumn: 0,
      rightColumn: 10,
      topRow: 75,
      bottomRow: 82,
      parentId: "0",
      widgetId: "qgxdk87yiw",
    },
    {
      isVisible: true,
      text: "Submit",
      buttonStyle: "PRIMARY_BUTTON",
      widgetName: "Button23",
      isDisabled: false,
      isDefaultClickDisabled: true,
      type: "BUTTON_WIDGET",
      isLoading: false,
      parentColumnSpace: 74,
      parentRowSpace: 40,
      leftColumn: 0,
      rightColumn: 10,
      topRow: 83,
      bottomRow: 90,
      parentId: "0",
      widgetId: "oeu2eud3q4",
    },
    {
      isVisible: true,
      text: "Submit",
      buttonStyle: "PRIMARY_BUTTON",
      widgetName: "Button24",
      isDisabled: false,
      isDefaultClickDisabled: true,
      type: "BUTTON_WIDGET",
      isLoading: false,
      parentColumnSpace: 74,
      parentRowSpace: 40,
      leftColumn: 0,
      rightColumn: 10,
      topRow: 91,
      bottomRow: 98,
      parentId: "0",
      widgetId: "11sgnzdckq",
    },
    {
      isVisible: true,
      text: "Submit",
      buttonStyle: "PRIMARY_BUTTON",
      widgetName: "Button25",
      isDisabled: false,
      isDefaultClickDisabled: true,
      type: "BUTTON_WIDGET",
      isLoading: false,
      parentColumnSpace: 74,
      parentRowSpace: 40,
      leftColumn: 0,
      rightColumn: 10,
      topRow: 99,
      bottomRow: 106,
      parentId: "0",
      widgetId: "rs2c4g4g0o",
    },
    {
      isVisible: true,
      text: "Submit",
      buttonStyle: "PRIMARY_BUTTON",
      widgetName: "Button13",
      isDisabled: false,
      isDefaultClickDisabled: true,
      type: "BUTTON_WIDGET",
      isLoading: false,
      parentColumnSpace: 34.5,
      parentRowSpace: 40,
      leftColumn: 7,
      rightColumn: 9,
      topRow: 7,
      bottomRow: 8,
      parentId: "0",
      widgetId: "iwsi8fleku",
      dynamicTriggerPathList: [{ key: "onClick" }],
      onClick: "{{showModal('Modal1')}}",
    },
    {
      isVisible: true,
      shouldScrollContents: false,
      widgetName: "Tabs1",
      tabs:
        '[{"id":"tab2","widgetId":"377zsl4rgg","label":"Tab 2"},{"id":"tab1","widgetId":"9augj62fwd","label":"Tab 1"}]',
      shouldShowTabs: true,
      defaultTab: "Tab 1",
      blueprint: { operations: [{ type: "MODIFY_PROPS" }] },
      type: "TABS_WIDGET",
      isLoading: false,
      parentColumnSpace: 74,
      parentRowSpace: 40,
      leftColumn: 3,
      rightColumn: 11,
      topRow: 11,
      bottomRow: 18,
      parentId: "0",
      widgetId: "g3s5k86c8v",
      children: [
        {
          type: "CANVAS_WIDGET",
          tabId: "tab2",
          tabName: "Tab 2",
          widgetId: "377zsl4rgg",
          parentId: "g3s5k86c8v",
          detachFromLayout: true,
          children: [],
          parentRowSpace: 1,
          parentColumnSpace: 1,
          leftColumn: 0,
          rightColumn: 592,
          topRow: 0,
          bottomRow: 280,
          isLoading: false,
          widgetName: "Canvas1",
          renderMode: "CANVAS",
        },
        {
          type: "CANVAS_WIDGET",
          tabId: "tab1",
          tabName: "Tab 1",
          widgetId: "9augj62fwd",
          parentId: "g3s5k86c8v",
          detachFromLayout: true,
          children: [
            {
              isVisible: true,
              text: "Submit",
              buttonStyle: "PRIMARY_BUTTON",
              widgetName: "Button26",
              isDisabled: false,
              isDefaultClickDisabled: true,
              type: "BUTTON_WIDGET",
              isLoading: false,
              parentColumnSpace: 34.5,
              parentRowSpace: 40,
              leftColumn: 2,
              rightColumn: 4,
              topRow: 1,
              bottomRow: 2,
              parentId: "9augj62fwd",
              widgetId: "o87mpa118i",
            },
          ],
          parentRowSpace: 1,
          parentColumnSpace: 1,
          leftColumn: 0,
          rightColumn: 592,
          topRow: 0,
          bottomRow: 280,
          isLoading: false,
          widgetName: "Canvas1",
          renderMode: "CANVAS",
        },
      ],
      dynamicBindingPathList: [{ key: "selectedTab" }],
    },
  ],
};
describe("Immutable Canvas structures", () => {
  it("generates the same object if it is run with the same dsl", () => {
    const nextState = compareAndGenerateImmutableCanvasStructure(
      canvasStructure,
      simpleDSL,
    );

    expect(nextState).toBe(canvasStructure);
  });
  it("calculates 100 simple diffs in less than 30ms", () => {
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      compareAndGenerateImmutableCanvasStructure(canvasStructure, newDSL);
    }
    console.log("Time taken for 100 runs: ", performance.now() - start, "ms");
    const timeTaken = performance.now() - start;
    expect(timeTaken).toBeLessThanOrEqual(100);
  });
  it("updates the diff appropriately", () => {
    const dsl: any = {
      widgetId: "x",
      widgetName: "x",
      children: [
        {
          widgetId: "y",
          widgetName: "y",
          children: [
            {
              widgetId: "z",
              widgetName: "z",
            },
          ],
        },
        {
          widgetId: "m",
          widgetName: "newName",
          children: [
            {
              widgetId: "n",
              widgetName: "n",
              children: [
                {
                  widgetId: "o",
                  widgetName: "o",
                },
              ],
            },
          ],
        },
      ],
    };
    const expectedCanvasStructure = {
      widgetId: "x",
      widgetName: "x",
      children: [
        {
          widgetId: "y",
          widgetName: "y",
          children: [
            {
              widgetId: "z",
              widgetName: "z",
            },
          ],
        },
        {
          widgetId: "m",
          widgetName: "newName",
          children: [
            {
              widgetId: "n",
              widgetName: "n",
              children: [
                {
                  widgetId: "o",
                  widgetName: "o",
                },
              ],
            },
          ],
        },
      ],
    };

    const nextState = compareAndGenerateImmutableCanvasStructure(
      canvasStructure,
      dsl,
    );
    expect(nextState).not.toBe(expectedCanvasStructure);
    expect(JSON.stringify(nextState)).toBe(
      JSON.stringify(expectedCanvasStructure),
    );
  });
});
