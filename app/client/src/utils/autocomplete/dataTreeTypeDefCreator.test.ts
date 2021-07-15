import {
  generateTypeDef,
  dataTreeTypeDefCreator,
  flattenObjKeys,
} from "utils/autocomplete/dataTreeTypeDefCreator";
import {
  DataTreeWidget,
  ENTITY_TYPE,
  EvaluationSubstitutionType,
} from "entities/DataTree/dataTreeFactory";
import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";
import { WidgetTypes } from "../../constants/WidgetConstants";

describe("dataTreeTypeDefCreator", () => {
  it("creates the right def for a widget", () => {
    const dataTreeEntity: DataTreeWidget = {
      widgetId: "yolo",
      widgetName: "Input1",
      parentId: "123",
      renderMode: "CANVAS",
      text: "yo",
      type: WidgetTypes.INPUT_WIDGET,
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      parentColumnSpace: 1,
      parentRowSpace: 2,
      leftColumn: 2,
      rightColumn: 3,
      topRow: 1,
      bottomRow: 2,
      isLoading: false,
      version: 1,
      bindingPaths: {
        defaultText: EvaluationSubstitutionType.TEMPLATE,
      },
      triggerPaths: {
        onTextChange: true,
      },
      validationPaths: {},
      logBlackList: {},
    };
    const { def } = dataTreeTypeDefCreator(dataTreeEntity, "Input1");
    // TODO hetu: needs better general testing
    // instead of testing each widget maybe we can test to ensure
    // that defs are in a correct format
    expect(def.Input1).toBe(entityDefinitions.INPUT_WIDGET);
    expect(def).toHaveProperty("Input1.isDisabled");
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

  it("flatten object", () => {
    const options = {
      someNumber: "number",
      someString: "string",
      someBool: "bool",
      nested: {
        someExtraNested: "string",
      },
    };

    const expected = {
      "entity1.someNumber": "number",
      "entity1.someString": "string",
      "entity1.someBool": "bool",
      "entity1.nested": {
        someExtraNested: "string",
      },
    };

    const value = flattenObjKeys(options, "entity1");
    expect(value).toStrictEqual(expected);
  });
});
