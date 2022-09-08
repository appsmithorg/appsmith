import {
  generateTypeDef,
  dataTreeTypeDefCreator,
  flattenDef,
  getFunctionsArgsType,
} from "utils/autocomplete/dataTreeTypeDefCreator";
import {
  DataTreeWidget,
  ENTITY_TYPE,
  EvaluationSubstitutionType,
} from "entities/DataTree/dataTreeFactory";
import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";

describe("dataTreeTypeDefCreator", () => {
  it("creates the right def for a widget", () => {
    // @ts-expect-error: meta property not provided
    const dataTreeEntity: DataTreeWidget = {
      widgetId: "yolo",
      widgetName: "Input1",
      parentId: "123",
      renderMode: "CANVAS",
      text: "yo",
      type: "INPUT_WIDGET_V2",
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
      reactivePaths: {
        defaultText: EvaluationSubstitutionType.TEMPLATE,
      },
      triggerPaths: {
        onTextChange: true,
      },
      validationPaths: {},
      logBlackList: {},
      propertyOverrideDependency: {},
      overridingPropertyPaths: {},
      privateWidgets: {},
    };
    const { def, entityInfo } = dataTreeTypeDefCreator(
      {
        Input1: dataTreeEntity,
      },
      false,
    );
    // TODO hetu: needs better general testing
    // instead of testing each widget maybe we can test to ensure
    // that defs are in a correct format
    expect(def.Input1).toBe(entityDefinitions.INPUT_WIDGET_V2);
    expect(def).toHaveProperty("Input1.isDisabled");
    expect(entityInfo.get("Input1")).toStrictEqual({
      type: ENTITY_TYPE.WIDGET,
      subType: "INPUT_WIDGET_V2",
    });
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

  it("creates a correct def for a complex array of object", () => {
    const data = [
      {
        nested: [
          {
            nested: [
              {
                nested: [
                  {
                    nested: [
                      {
                        nested: [
                          {
                            nested: [
                              {
                                name: "",
                                email: "",
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    const expected = "[def_6]";

    const extraDef = {};
    const expectedExtraDef = {
      def_1: { nested: "[?]" },
      def_2: { nested: "[def_1]" },
      def_3: { nested: "[def_2]" },
      def_4: { nested: "[def_3]" },
      def_5: { nested: "[def_4]" },
      def_6: { nested: "[def_5]" },
    };

    const dataType = generateTypeDef(data, extraDef);

    expect(dataType).toStrictEqual(expected);

    expect(extraDef).toStrictEqual(expectedExtraDef);

    const extraDef2 = {};
    const expected2 = "[def_10]";
    const dataType2 = generateTypeDef(
      data[0].nested[0].nested[0].nested,
      extraDef2,
    );

    const expectedExtraDef2 = {
      def_7: { name: "string", email: "string" },
      def_8: { nested: "[def_7]" },
      def_9: { nested: "[def_8]" },
      def_10: { nested: "[def_9]" },
    };

    expect(dataType2).toStrictEqual(expected2);
    expect(extraDef2).toStrictEqual(expectedExtraDef2);
  });

  it("creates a correct def for an array of array of object", () => {
    const array = [[{ name: "", email: "" }]];
    const expected = "[[def_11]]";

    const extraDefsToDefine = {};
    const expectedExtraDef = {
      def_11: { name: "string", email: "string" },
    };

    const objType = generateTypeDef(array, extraDefsToDefine);

    expect(objType).toStrictEqual(expected);
    expect(extraDefsToDefine).toStrictEqual(expectedExtraDef);
  });

  it("flatten def", () => {
    const def = {
      entity1: {
        someNumber: "number",
        someString: "string",
        someBool: "bool",
        nested: {
          someExtraNested: "string",
        },
      },
    };

    const expected = {
      entity1: {
        someNumber: "number",
        someString: "string",
        someBool: "bool",
        nested: {
          someExtraNested: "string",
        },
      },
      "entity1.someNumber": "number",
      "entity1.someString": "string",
      "entity1.someBool": "bool",
      "entity1.nested": {
        someExtraNested: "string",
      },
      "entity1.nested.someExtraNested": "string",
    };

    const value = flattenDef(def, "entity1");
    expect(value).toStrictEqual(expected);
  });
});

describe("getFunctionsArgsType", () => {
  const testCases = {
    testCase1: {
      arguments: [
        { name: "a", value: undefined },
        { name: "b", value: undefined },
        { name: "c", value: undefined },
        { name: "d", value: undefined },
        { name: "", value: undefined },
      ],
      expectedOutput: "fn(a: ?, b: ?, c: ?, d: ?)",
    },
    testCase2: {
      arguments: [],
      expectedOutput: "fn()",
    },
    testCase3: {
      arguments: [
        { name: "a", value: undefined },
        { name: "b", value: undefined },
        { name: "", value: undefined },
        { name: "", value: undefined },
      ],
      expectedOutput: "fn(a: ?, b: ?)",
    },
  };

  it("function with 4 args", () => {
    expect(getFunctionsArgsType(testCases.testCase1.arguments)).toEqual(
      testCases.testCase1.expectedOutput,
    );
  });

  it("function with no args", () => {
    expect(getFunctionsArgsType(testCases.testCase2.arguments)).toEqual(
      testCases.testCase2.expectedOutput,
    );
  });

  it("function with 2 args", () => {
    expect(getFunctionsArgsType(testCases.testCase3.arguments)).toEqual(
      testCases.testCase3.expectedOutput,
    );
  });
});
