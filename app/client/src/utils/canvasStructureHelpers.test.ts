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

describe("Immutable Canvas structures", () => {
  it("generates the same object if it is run with the same dsl", () => {
    const nextState = compareAndGenerateImmutableCanvasStructure(
      canvasStructure,
      simpleDSL,
    );

    expect(nextState).toBe(canvasStructure);
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
