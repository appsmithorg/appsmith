import { DataTreeEvaluator } from "./evaluation.worker";
import { DataTree, ENTITY_TYPE } from "../entities/DataTree/dataTreeFactory";
import WidgetFactory from "../utils/WidgetFactory";
import WidgetBuilderRegistry from "../utils/WidgetRegistry";

WidgetBuilderRegistry.registerWidgetBuilders();
const WIDGET_CONFIG_MAP = WidgetFactory.getWidgetTypeConfigMap();

it("evaluates the tree", () => {
  const unEvalTree: DataTree = {
    Text1: {
      name: "Text1",
      type: "TEXT_WIDGET",
      text: "Label",
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    },
    Text3: {
      name: "Text3",
      type: "TEXT_WIDGET",
      text: "{{Text1.text}}",
      dynamicBindingPathList: [{ key: "text" }],
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    },
    Table1: {
      name: "Table1",
      tableData: "{{Api1.data}}",
      type: "TABLE_WIDGET",
      dynamicBindingPathList: [{ key: "tableData" }],
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    },
    Api1: {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      data: [],
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
    },
    Text2: {
      name: "Text2",
      type: "TEXT_WIDGET",
      text: "{{Text1.text}}",
      dynamicBindingPathList: [{ key: "text" }],
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    },
    Text5: {
      name: "Text5",
      type: "TEXT_WIDGET",
      text: "{{Text6.text}}",
      dynamicBindingPathList: [{ key: "text" }],
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    },
    Text6: {
      name: "Text6",
      type: "TEXT_WIDGET",
      text: "Label 6",
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    },
    Text4: {
      name: "Text4",
      type: "TEXT_WIDGET",
      text: "Label 4",
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    },
  };
  const evaluator = new DataTreeEvaluator(unEvalTree, WIDGET_CONFIG_MAP);
  const evaluation = evaluator.evalTree;
  const dependencyMap = evaluator.dependencyMap;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  expect(evaluation.Text2.text).toBe("Label");
  expect(dependencyMap).toStrictEqual({
    "Text2.text": ["Text1.text"],
    "Table1.tableData": ["Api1.data"],
    "Text3.text": ["Text1.text"],
    "Text5.text": ["Text6.text"],
  });

  const updatedUnEvalTree: DataTree = {
    ...unEvalTree,
    Text1: {
      ...unEvalTree.Text1,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      text: "Label 1",
    },
  };

  const updatedEvalTree = evaluator.updateDataTree(updatedUnEvalTree);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  expect(updatedEvalTree.Text2.text).toBe("Label 1");
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  expect(updatedEvalTree.Text3.text).toBe("Label 1");
  expect(evaluator.dependencyMap).toStrictEqual({
    "Text2.text": ["Text1.text"],
    "Table1.tableData": ["Api1.data"],
    "Text3.text": ["Text1.text"],
    "Text5.text": ["Text6.text"],
  });

  const updatedUnEvalTree2: DataTree = {
    ...updatedUnEvalTree,
    Text1: {
      ...unEvalTree.Text1,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      text: "{{Text4.text}}",
      dynamicBindingPathList: [{ key: "text" }],
    },
    Text6: {
      ...unEvalTree.Text6,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      text: "Value change 6",
    },
    Text2: {
      ...unEvalTree.Text2,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      text: "{{Text3.text}}",
    },
  };

  const updatedEvalTree2 = evaluator.updateDataTree(updatedUnEvalTree2);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  expect(updatedEvalTree2.Text5.text).toBe("Value change 6");
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  expect(updatedEvalTree2.Text1.text).toBe("Label 4");
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  expect(updatedEvalTree2.Text2.text).toBe("Label 4");
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  expect(updatedEvalTree2.Text3.text).toBe("Label 4");
  expect(evaluator.dependencyMap).toStrictEqual({
    "Text1.text": ["Text4.text"],
    "Text2.text": ["Text3.text"],
    "Table1.tableData": ["Api1.data"],
    "Text3.text": ["Text1.text"],
    "Text5.text": ["Text6.text"],
  });
});

// it("overrides with default value", () => {});

// it("check for value changes for nested diff paths", () => {});
