import {
  generateTypeDef,
  dataTreeTypeDefCreator,
} from "utils/autocomplete/dataTreeTypeDefCreator";
import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";

describe("dataTreeTypeDefCreator", () => {
  it("creates the right def for a widget", () => {
    const dataTree: DataTree = {
      Input1: {
        widgetId: "yolo",
        widgetName: "Input1",
        parentId: "123",
        renderMode: "CANVAS",
        text: "yo",
        type: "INPUT_WIDGET",
        ENTITY_TYPE: ENTITY_TYPE.WIDGET,
        parentColumnSpace: 1,
        parentRowSpace: 2,
        leftColumn: 2,
        rightColumn: 3,
        topRow: 1,
        bottomRow: 2,
        isLoading: false,
      },
    };
    const def = dataTreeTypeDefCreator(dataTree);
    // TODO hetu: needs better general testing
    // instead of testing each widget maybe we can test to ensure
    // that defs are in a correct format
    expect(def.Input1).toBe(entityDefinitions.INPUT_WIDGET);
  });

  it("creates a correct def for an object", () => {
    const obj = {
      yo: "lo",
      someNumber: 12,
      someString: "123",
      someBool: false,
      unknownProp: undefined,
      nested: {
        someExtraNested: "yolo",
      },
    };
    const expected = {
      yo: "string",
      someNumber: "number",
      someString: "string",
      someBool: "bool",
      unknownProp: "?",
      nested: {
        someExtraNested: "string",
      },
    };

    const objType = generateTypeDef(obj);
    expect(objType).toStrictEqual(expected);
  });
});
