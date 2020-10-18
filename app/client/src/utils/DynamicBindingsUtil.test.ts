// import {
//   mockExecute,
//   mockRegisterLibrary,
// } from "../../test/__mocks__/RealmExecutorMock";
// import {
//   dependencySortedEvaluateDataTree,
//   getDynamicValue,
//   getEntityDependencies,
//   parseDynamicString,
// } from "./DynamicBindingUtils";
// import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
// import { RenderModes, WidgetTypes } from "constants/WidgetConstants";
//
// beforeAll(() => {
//   mockRegisterLibrary.mockClear();
//   mockExecute.mockClear();
// });
//
// it("Gets the value from the data tree", () => {
//   const dynamicBinding = "{{GetUsers.data}}";
//   const nameBindingsWithData: DataTree = {
//     GetUsers: {
//       data: { text: "correct data" },
//       config: {
//         pluginId: "",
//         id: "id",
//         name: "text",
//         actionConfiguration: {},
//         pageId: "",
//         jsonPathKeys: [],
//         datasource: { id: "" },
//         pluginType: "1",
//       },
//       isLoading: false,
//       ENTITY_TYPE: ENTITY_TYPE.ACTION,
//       run: jest.fn(),
//     },
//   };
//   const actualValue = { result: { text: "correct data" } };
//
//   const value = getDynamicValue(dynamicBinding, nameBindingsWithData);
//
//   expect(value).toEqual(actualValue);
// });
//
// describe.each([
//   ["{{A}}", ["{{A}}"]],
//   ["A {{B}}", ["A ", "{{B}}"]],
//   [
//     "Hello {{Customer.Name}}, the status for your order id {{orderId}} is {{status}}",
//     [
//       "Hello ",
//       "{{Customer.Name}}",
//       ", the status for your order id ",
//       "{{orderId}}",
//       " is ",
//       "{{status}}",
//     ],
//   ],
//   [
//     "{{data.map(datum => {return {id: datum}})}}",
//     ["{{data.map(datum => {return {id: datum}})}}"],
//   ],
//   ["{{}}{{}}}", ["{{}}", "{{}}", "}"]],
//   ["{{{}}", ["{{{}}"]],
//   ["{{ {{", ["{{ {{"]],
//   ["}} }}", ["}} }}"]],
//   ["}} {{", ["}} {{"]],
// ])("Parse the dynamic string(%s, %j)", (dynamicString, expected) => {
//   test(`returns ${expected}`, () => {
//     expect(parseDynamicString(dynamicString as string)).toStrictEqual(expected);
//   });
// });
//
// const baseWidgetProps = {
//   parentColumnSpace: 0,
//   parentRowSpace: 0,
//   parentId: "0",
//   type: WidgetTypes.BUTTON_WIDGET,
//   renderMode: RenderModes.CANVAS,
//   leftColumn: 0,
//   rightColumn: 0,
//   topRow: 0,
//   bottomRow: 0,
//   isLoading: false,
// };
//
// it("evaluates the data tree", () => {
//   const input: DataTree = {
//     widget1: {
//       ...baseWidgetProps,
//       widgetId: "1",
//       widgetName: "widget1",
//       displayValue: "{{widget2.computedProperty}}",
//       ENTITY_TYPE: ENTITY_TYPE.WIDGET,
//     },
//     widget2: {
//       ...baseWidgetProps,
//       widgetId: "2",
//       widgetName: "widget2",
//       computedProperty: "{{ widget2.data[widget2.index] }}",
//       data: "{{ apiData.data }}",
//       index: 2,
//       ENTITY_TYPE: ENTITY_TYPE.WIDGET,
//     },
//     apiData: {
//       config: {
//         id: "123",
//         pageId: "1234",
//         datasource: {},
//         name: "api",
//         actionConfiguration: {},
//         jsonPathKeys: [],
//         pluginId: "plugin",
//       },
//       run: (onSuccess, onError) => ({
//         type: "RUN_ACTION",
//         payload: {
//           actionId: "",
//           onSuccess: "",
//           onError: "",
//         },
//       }),
//       isLoading: false,
//       data: ["wrong value", "still wrong", "correct"],
//       ENTITY_TYPE: ENTITY_TYPE.ACTION,
//     },
//   };
//
//   const dynamicBindings = {
//     "widget1.displayValue": ["widget2.computedProperty"],
//     "widget2.computedProperty": ["widget2.data", "widget2.index"],
//     "widget2.data": ["apiData.data"],
//   };
//
//   const sortedDeps = [
//     "apiData.data",
//     "widget2.data",
//     "widget2.index",
//     "widget2.computedProperty",
//     "widget1.displayValue",
//   ];
//
//   const output: DataTree = {
//     widget1: {
//       ...baseWidgetProps,
//       widgetId: "1",
//       widgetName: "widget1",
//       displayValue: "correct",
//       ENTITY_TYPE: ENTITY_TYPE.WIDGET,
//     },
//     widget2: {
//       ...baseWidgetProps,
//       widgetId: "2",
//       widgetName: "widget2",
//       computedProperty: "correct",
//       data: ["wrong value", "still wrong", "correct"],
//       index: 2,
//       ENTITY_TYPE: ENTITY_TYPE.WIDGET,
//     },
//     apiData: {
//       config: {
//         id: "123",
//         pageId: "1234",
//         datasource: {},
//         name: "api",
//         actionConfiguration: {},
//         jsonPathKeys: [],
//         pluginId: "plugin",
//       },
//       run: (onSuccess, onError) => ({
//         type: "RUN_ACTION",
//         payload: {
//           actionId: "",
//           onSuccess: "",
//           onError: "",
//         },
//       }),
//       isLoading: false,
//       data: ["wrong value", "still wrong", "correct"],
//       ENTITY_TYPE: ENTITY_TYPE.ACTION,
//     },
//   };
//
//   const result = dependencySortedEvaluateDataTree(
//     input,
//     dynamicBindings,
//     sortedDeps,
//   );
//   expect(result).toEqual(output);
// });
//
// it("finds dependencies of a entity", () => {
//   const depMap: Array<[string, string]> = [
//     ["Widget5.text", "Widget2.data.visible"],
//     ["Widget1.options", "Action1.data"],
//     ["Widget2.text", "Widget1.selectedOption"],
//     ["Widget3.text", "Widget4.selectedRow.name"],
//     ["Widget6.label", "Action1.data.label"],
//   ];
//   const entity = "Action1";
//   const result = ["Widget1", "Widget2", "Widget5", "Widget6"];
//
//   const actual = getEntityDependencies(depMap, entity);
//
//   expect(actual).toEqual(result);
// });

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
it("does nothing. needs implementing", () => {
  expect(1 + 1).toEqual(2);
});
