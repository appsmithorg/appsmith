import type { WidgetEntityConfig } from "ee/entities/DataTree/types";
import { DataTreeDiffEvent } from "ee/workers/Evaluation/evaluationUtils";
import { RenderModes } from "constants/WidgetConstants";
import { ENTITY_TYPE } from "ee/entities/DataTree/types";
import type { ConfigTree } from "entities/DataTree/dataTreeTypes";
import { generateDataTreeWidget } from "entities/DataTree/dataTreeWidget";
import { create } from "mutative";
import { klona } from "klona/json";
import type { WidgetEntity } from "plugins/Linting/lib/entity/WidgetEntity";
import type { UpdateDataTreeMessageData } from "sagas/types";
import DataTreeEvaluator from "workers/common/DataTreeEvaluator";
import * as evalTreeWithChanges from "./evalTreeWithChanges";
import { APP_MODE } from "entities/App";
import { updateEvalProps } from "./helpers";
export const BASE_WIDGET = {
  widgetId: "randomID",
  widgetName: "randomWidgetName",
  bottomRow: 0,
  isLoading: false,
  leftColumn: 0,
  parentColumnSpace: 0,
  parentRowSpace: 0,
  renderMode: RenderModes.CANVAS,
  rightColumn: 0,
  topRow: 0,
  type: "SKELETON_WIDGET",
  parentId: "0",
  version: 1,
  ENTITY_TYPE: ENTITY_TYPE.WIDGET,
  meta: {},
} as unknown as WidgetEntity;

export const BASE_WIDGET_CONFIG = {
  logBlackList: {},
  widgetId: "randomID",
  type: "SKELETON_WIDGET",
  ENTITY_TYPE: ENTITY_TYPE.WIDGET,
} as unknown as WidgetEntityConfig;

const WIDGET_CONFIG_MAP = {
  TEXT_WIDGET: {
    defaultProperties: {},
    derivedProperties: {
      value: "{{ this.text }}",
    },
    metaProperties: {},
  },
};

const configTree: ConfigTree = {
  Text1: generateDataTreeWidget(
    {
      ...BASE_WIDGET_CONFIG,
      ...BASE_WIDGET,
      widgetName: "Text1",
      text: "Label",
      type: "TEXT_WIDGET",
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    {},
    new Set(),
  ).configEntity,
  Text2: generateDataTreeWidget(
    {
      ...BASE_WIDGET_CONFIG,
      ...BASE_WIDGET,
      widgetName: "Text2",
      text: "{{Text1.text}}",
      dynamicBindingPathList: [{ key: "text" }],
      type: "TEXT_WIDGET",
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    {},
    new Set(),
  ).configEntity,
};

const unEvalTree = {
  Text1: generateDataTreeWidget(
    {
      ...BASE_WIDGET_CONFIG,
      ...BASE_WIDGET,
      widgetName: "Text1",
      text: "Label",
      type: "TEXT_WIDGET",
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    {},
    new Set(),
  ).unEvalEntity,
  Text2: generateDataTreeWidget(
    {
      ...BASE_WIDGET_CONFIG,
      ...BASE_WIDGET,
      widgetName: "Text2",
      text: "{{Text1.text}}",
      dynamicBindingPathList: [{ key: "text" }],
      type: "TEXT_WIDGET",
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    {},
    new Set(),
  ).unEvalEntity,
};

describe("evaluateAndPushResponse", () => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pushResponseToMainThreadMock: any;

  beforeAll(() => {
    pushResponseToMainThreadMock = jest
      .spyOn(evalTreeWithChanges, "pushResponseToMainThread")
      .mockImplementation(() => {}); // spy on foo
  });
  beforeAll(() => {
    jest.clearAllMocks();
  });
  test("should call pushResponseToMainThread when we evaluate and push updates", () => {
    evalTreeWithChanges.evaluateAndPushResponse(
      undefined,
      {
        unEvalUpdates: [],
        evalOrder: [],
        jsUpdates: {},
      },
      [],
      [],
    );
    // check if push response has been called
    expect(pushResponseToMainThreadMock).toHaveBeenCalled();
  });
});

describe("getAffectedNodesInTheDataTree", () => {
  test("should merge paths from unEvalUpdates and evalOrder", () => {
    const result = evalTreeWithChanges.getAffectedNodesInTheDataTree(
      [
        {
          event: DataTreeDiffEvent.NOOP,
          payload: {
            propertyPath: "Text2.text",
            value: "",
          },
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ],
      ["Text1.text"],
    );

    expect(result).toEqual(["Text2.text", "Text1.text"]);
  });
  test("should extract unique paths from unEvalUpdates and evalOrder", () => {
    const result = evalTreeWithChanges.getAffectedNodesInTheDataTree(
      [
        {
          event: DataTreeDiffEvent.NOOP,
          payload: {
            propertyPath: "Text1.text",
            value: "",
          },
        },
      ],
      ["Text1.text"],
    );

    expect(result).toEqual(["Text1.text"]);
  });
});
describe("evaluateAndGenerateResponse", () => {
  let evaluator: DataTreeEvaluator;
  const UPDATED_LABEL = "updated Label";

  const getParsedUpdatesFromWebWorkerResp = (
    webworkerResponse: UpdateDataTreeMessageData,
  ) => {
    const updates = JSON.parse(webworkerResponse.workerResponse.updates);

    //scrub out all __evaluation__ patches
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return updates.filter((p: any) => !p.rhs.__evaluation__);
  };

  beforeEach(async () => {
    // we are mimicking the first tree evaluation flow here
    evaluator = new DataTreeEvaluator(WIDGET_CONFIG_MAP);
    await evaluator.setupFirstTree(
      unEvalTree,
      configTree,
      {},
      {
        appId: "appId",
        pageId: "pageId",
        timestamp: "timestamp",
        appMode: APP_MODE.PUBLISHED,
        instanceId: "instanceId",
      },
    );
    evaluator.evalAndValidateFirstTree();
    const dataTree = updateEvalProps(evaluator) || {};

    // over here we are setting the prevState through a klona but in the first tree we set by parsing the serialised update which is functionally the same
    evaluator?.setPrevState(klona(dataTree));
  });

  test("inital evaluation successful should be successful", () => {
    expect(evaluator.evalTree).toHaveProperty("Text2.text", "Label");
  });

  test("should respond with default values when dataTreeEvaluator is not provided", () => {
    const webworkerResponse = evalTreeWithChanges.evaluateAndGenerateResponse(
      undefined,
      {
        unEvalUpdates: [],
        evalOrder: [],
        jsUpdates: {},
      },
      [],
      [],
    );
    const parsedUpdates = getParsedUpdatesFromWebWorkerResp(webworkerResponse);

    expect(parsedUpdates).toEqual([]);
    expect(webworkerResponse).toEqual({
      workerResponse: {
        dependencies: {},
        errors: [],
        evalMetaUpdates: [],
        evaluationOrder: [],
        isCreateFirstTree: false,
        isNewWidgetAdded: false,
        jsUpdates: {},
        jsVarsCreatedEvent: [],
        logs: [],
        removedPaths: [],
        staleMetaIds: [],
        unEvalUpdates: [],
        undefinedEvalValuesMap: {},
        updates: "[]",
      },
    });
  });
  test("should generate no updates when the updateTreeResponse is empty", () => {
    const webworkerResponse = evalTreeWithChanges.evaluateAndGenerateResponse(
      evaluator,
      {
        unEvalUpdates: [],
        evalOrder: [],
        jsUpdates: {},
      },
      [],
      [],
    );
    const parsedUpdates = getParsedUpdatesFromWebWorkerResp(webworkerResponse);

    expect(parsedUpdates).toEqual([]);
  });

  describe("updates", () => {
    test("should generate updates based on the unEvalUpdates", () => {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedLabelUnevalTree = create(unEvalTree, (draft: any) => {
        draft.Text1.text = UPDATED_LABEL;
        draft.Text1.label = UPDATED_LABEL;
      });
      const updateTreeResponse = evaluator.setupUpdateTree(
        updatedLabelUnevalTree,
        configTree,
      );

      // ignore label Text1.label uneval update and just include Text1.text uneval update
      updateTreeResponse.unEvalUpdates = [
        {
          event: DataTreeDiffEvent.NOOP,
          payload: {
            propertyPath: "Text1.text",
            value: "",
          },
        },
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any;
      // the eval tree should have the uneval update but the diff should not be generated because the unEvalUpdates has been altered
      expect(evaluator.evalTree).toHaveProperty("Text1.text", UPDATED_LABEL);

      const webworkerResponse = evalTreeWithChanges.evaluateAndGenerateResponse(
        evaluator,
        updateTreeResponse,
        [],
        [],
      );

      expect(webworkerResponse.workerResponse.dependencies).toEqual({
        "Text1.text": ["Text2.text", "Text1"],
        "Text2.text": ["Text2"],
      });
      const parsedUpdates =
        getParsedUpdatesFromWebWorkerResp(webworkerResponse);

      // Text1.label update should be ignored
      expect(parsedUpdates).not.toEqual(
        expect.arrayContaining([
          {
            kind: "N",
            path: ["Text1", "label"],
            rhs: UPDATED_LABEL,
          },
        ]),
      );
    });
    test("should generate updates based on the evalOrder", () => {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedLabelUnevalTree = create(unEvalTree, (draft: any) => {
        draft.Text1.text = UPDATED_LABEL;
      });
      const updateTreeResponse = evaluator.setupUpdateTree(
        updatedLabelUnevalTree,
        configTree,
      );

      // ignore label Text1.label uneval update and just include Text1.text uneval update
      // expect(updateTreeResponse.evalOrder).toEqual([]);
      updateTreeResponse.evalOrder = [];

      const webworkerResponse = evalTreeWithChanges.evaluateAndGenerateResponse(
        evaluator,
        updateTreeResponse,
        [],
        [],
      );
      const parsedUpdates =
        getParsedUpdatesFromWebWorkerResp(webworkerResponse);

      // Text1.label update should be ignored
      expect(parsedUpdates).not.toEqual(
        expect.arrayContaining([
          {
            kind: "N",
            path: ["Text2", "text"],
            rhs: "updated Label",
          },
        ]),
      );
    });
    test("should generate the correct updates to be sent to the main thread's state when the value tied to a binding changes ", () => {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedLabelUnevalTree = create(unEvalTree, (draft: any) => {
        if (draft.Text1?.text) {
          draft.Text1.text = UPDATED_LABEL;
        }
      });
      const updateTreeResponse = evaluator.setupUpdateTree(
        updatedLabelUnevalTree,
        configTree,
      );

      const webworkerResponse = evalTreeWithChanges.evaluateAndGenerateResponse(
        evaluator,
        updateTreeResponse,
        [],
        [],
      );

      const parsedUpdates =
        getParsedUpdatesFromWebWorkerResp(webworkerResponse);

      expect(parsedUpdates).toEqual(
        expect.arrayContaining([
          {
            kind: "E",
            path: ["Text1", "text"],
            rhs: "updated Label",
          },
          {
            kind: "E",
            path: ["Text2", "text"],
            rhs: "updated Label",
          },
        ]),
      );

      expect(evaluator.evalTree).toHaveProperty("Text2.text", UPDATED_LABEL);
    });
    test("should merge additional updates to the dataTree as well as push the updates back to the main thread's state when unEvalUpdates is ignored", () => {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedLabelUnevalTree = create(unEvalTree, (draft: any) => {
        if (draft.Text1?.text) {
          draft.Text1.text = UPDATED_LABEL;
        }
      });
      const updateTreeResponse = evaluator.setupUpdateTree(
        updatedLabelUnevalTree,
        configTree,
      );

      //set the unEvalUpdates is empty so that evaluation ignores diffing the node
      updateTreeResponse.unEvalUpdates = [];

      const webworkerResponse = evalTreeWithChanges.evaluateAndGenerateResponse(
        evaluator,
        updateTreeResponse,
        [],
        ["Text1.text"],
      );
      const parsedUpdates =
        getParsedUpdatesFromWebWorkerResp(webworkerResponse);

      expect(parsedUpdates).toEqual(
        expect.arrayContaining([
          {
            kind: "N",
            path: ["Text1", "text"],
            rhs: UPDATED_LABEL,
          },
        ]),
      );

      expect(evaluator.evalTree).toHaveProperty("Text1.text", UPDATED_LABEL);
    });
  });

  describe("evalMetaUpdates", () => {
    test("should add metaUpdates in the webworker's response", () => {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedLabelUnevalTree = create(unEvalTree, (draft: any) => {
        if (draft.Text1?.text) {
          draft.Text1.text = UPDATED_LABEL;
        }
      });
      const response = evaluator.setupUpdateTree(
        updatedLabelUnevalTree,
        configTree,
      );

      const metaUpdates = [
        {
          widgetId: unEvalTree.Text1.widgetId,
          metaPropertyPath: ["someMetaValuePath"],
          value: "someValue",
        },
      ];
      const { workerResponse } =
        evalTreeWithChanges.evaluateAndGenerateResponse(
          evaluator,
          response,
          metaUpdates,
          [],
        );

      expect(workerResponse.evalMetaUpdates).toEqual(metaUpdates);
    });
    test("should sanitise metaUpdates in the webworker's response and strip out non serialisable properties", () => {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedLabelUnevalTree = create(unEvalTree, (draft: any) => {
        if (draft.Text1?.text) {
          draft.Text1.text = UPDATED_LABEL;
        }
      });
      const response = evaluator.setupUpdateTree(
        updatedLabelUnevalTree,
        configTree,
      );

      const metaUpdates = [
        {
          widgetId: unEvalTree.Text1.widgetId,
          metaPropertyPath: ["someMetaValuePath"],
          value: function () {},
        },
      ];
      const { workerResponse } =
        evalTreeWithChanges.evaluateAndGenerateResponse(
          evaluator,
          response,
          metaUpdates,
          [],
        );

      // the function properties should be stripped out
      expect(workerResponse.evalMetaUpdates).toEqual([
        {
          widgetId: unEvalTree.Text1.widgetId,
          metaPropertyPath: ["someMetaValuePath"],
        },
      ]);
    });
  });

  describe("unEvalUpdates", () => {
    test("should add unEvalUpdates to the web worker response", () => {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedLabelUnevalTree = create(unEvalTree, (draft: any) => {
        if (draft.Text1?.text) {
          draft.Text1.text = UPDATED_LABEL;
        }
      });
      const updateTreeResponse = evaluator.setupUpdateTree(
        updatedLabelUnevalTree,
        configTree,
      );

      const webworkerResponse = evalTreeWithChanges.evaluateAndGenerateResponse(
        evaluator,
        updateTreeResponse,
        [],
        [],
      );

      const parsedUpdates =
        getParsedUpdatesFromWebWorkerResp(webworkerResponse);

      expect(webworkerResponse.workerResponse.unEvalUpdates).toEqual([
        {
          event: DataTreeDiffEvent.NOOP,
          payload: { propertyPath: "Text1.text", value: "" },
        },
      ]);
      expect(parsedUpdates).toEqual([
        { kind: "E", path: ["Text1", "text"], rhs: UPDATED_LABEL },
        // Text2 is updated because of the binding
        { kind: "E", path: ["Text2", "text"], rhs: UPDATED_LABEL },
      ]);
    });
    test("should ignore generating updates when unEvalUpdates is empty", () => {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedLabelUnevalTree = create(unEvalTree, (draft: any) => {
        if (draft.Text1?.text) {
          draft.Text1.text = UPDATED_LABEL;
        }
      });
      const updateTreeResponse = evaluator.setupUpdateTree(
        updatedLabelUnevalTree,
        configTree,
      );

      //set the evalOrder is empty so that evaluation ignores diffing the node
      updateTreeResponse.unEvalUpdates = [];

      const webworkerResponse = evalTreeWithChanges.evaluateAndGenerateResponse(
        evaluator,
        updateTreeResponse,
        [],
        [],
      );
      const parsedUpdates =
        getParsedUpdatesFromWebWorkerResp(webworkerResponse);

      expect(parsedUpdates).not.toEqual(
        expect.arrayContaining([
          {
            kind: "N",
            path: ["Text1", "text"],
            rhs: UPDATED_LABEL,
          },
        ]),
      );
    });
  });
});
