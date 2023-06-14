import {
  PROPERTY_SELECTOR,
  WIDGET,
  getWidgetSelector,
} from "../../../../locators/WidgetLocators";

import { ObjectsRegistry as _ } from "../../../../support/Objects/Registry";

const setterMethodsToTest = [
  {
    name: "setVisibility",
    property: "isVisible",
    widget: WIDGET.INPUT_V2,
    actionBinding: "{{Input1.setVisibility(false)}}",
    valueBinding: "{{Input1.isVisible}}",
    expectedValue: "false",
  },
  {
    name: "setDisabled",
    property: "isDisabled",
    widget: WIDGET.INPUT_V2,
    actionBinding: "{{Input1.setDisabled(false)}}",
    valueBinding: "{{Input1.isDisabled}}",
    expectedValue: "false",
  },
  {
    name: "setRequired",
    property: "isRequired",
    widget: WIDGET.INPUT_V2,
    actionBinding: "{{Input1.setRequired(false)}}",
    valueBinding: "{{Input1.isRequired}}",
    expectedValue: "false",
  },
  {
    name: "setURL",
    property: "url",
    widget: WIDGET.AUDIO,
    actionBinding:
      "{{Audio1.setURL('https://www.youtube.com/watch?v=JGwWNGJdvx8')}}",
    valueBinding: "{{Audio1.url}}",
    expectedValue: "https://www.youtube.com/watch?v=JGwWNGJdvx8",
  },
  {
    name: "setPlaying",
    property: "playing",
    widget: WIDGET.AUDIO,
    actionBinding: "{{Audio1.setPlaying(true)}}",
    valueBinding: "{{Audio1.playing}}",
    expectedValue: "true",
  },
  {
    name: "setSelectedRowIndex",
    property: "selectedRowIndex",
    widget: WIDGET.TABLE,
    actionBinding: "{{Table1.setSelectedRowIndex(1)}}",
    valueBinding: "{{Table1.selectedRowIndex}}",
    expectedValue: "1",
  },
  {
    name: "setSelectedOption",
    property: "selectedOptionLabel",
    widget: WIDGET.SELECT,
    actionBinding: "{{Select1.setSelectedOption('BLUE')}}",
    valueBinding: "{{Select1.selectedOptionLabel}}",
    expectedValue: "Blue",
  },
  {
    name: "setProgress",
    property: "progress",
    widget: WIDGET.PROGRESS,
    actionBinding: "{{Progress1.setProgress(50)}}",
    valueBinding: "{{Progress1.progress}}",
    expectedValue: "50",
  },
  {
    name: "setText",
    property: "text",
    widget: WIDGET.TEXT,
    actionBinding: "{{Text1.setText('Hello World')}}",
    valueBinding: "{{Text1.text}}",
    expectedValue: "Hello World",
  },
  {
    name: "setValue",
    property: "text",
    widget: WIDGET.INPUT_V2,
    actionBinding: "{{Input1.setValue('Hello World')}}",
    valueBinding: "{{Input1.text}}",
    expectedValue: "Hello World",
  },
  {
    name: "setData",
    property: "tableData",
    widget: WIDGET.TABLE,
    actionBinding: "{{Table1.setData([{name: 'test'}])}}",
    valueBinding: "{{JSON.stringify(Table1.tableData)}}",
    expectedValue: '[{"name":"test"}]',
  },
];

Object.values(setterMethodsToTest).forEach(
  (
    { actionBinding, expectedValue, name, property, valueBinding, widget },
    index,
  ) => {
    describe(`${index + 1}. ${name} method test`, () => {
      it(`1. DragDrop widget & Label/Text widgets`, () => {
        _.EntityExplorer.DragDropWidgetNVerify(widget, 300, 200);
        _.EntityExplorer.DragDropWidgetNVerify(WIDGET.BUTTON, 700, 200);

        _.PropertyPane.EnterJSContext(
          PROPERTY_SELECTOR.onClickFieldName,
          actionBinding,
        );

        _.EntityExplorer.DragDropWidgetNVerify(WIDGET.TEXT, 700, 400);

        _.PropertyPane.UpdatePropertyFieldValue(
          PROPERTY_SELECTOR.TextFieldName,
          valueBinding,
        );
      });

      it("2. Verify the updated value", () => {
        _.AggregateHelper.GetNClick(getWidgetSelector(WIDGET.BUTTON));

        _.AggregateHelper.GetText(getWidgetSelector(WIDGET.TEXT)).then(
          ($label) => {
            expect($label).to.eq(expectedValue);
          },
        );
      });

      it("3. Delete all the widgets on canvas", () => {
        _.AggregateHelper.GetNClick(_.CommonLocators._widgetInCanvas(widget));
        _.AggregateHelper.PressDelete();

        _.AggregateHelper.GetNClick(getWidgetSelector(WIDGET.BUTTON));
        _.AggregateHelper.AssertContains("is not defined"); // Since widget is removed & Button is still holding its reference
        _.AggregateHelper.PressDelete();

        _.AggregateHelper.GetNClick(getWidgetSelector(WIDGET.TEXT)).click();
        _.AggregateHelper.GetNClick(_.PropertyPane._deleteWidget);
      });
    });
  },
);

describe("Linting warning for setter methods", function () {
  it("Lint error when setter is used in a data field", function () {
    _.EntityExplorer.DragDropWidgetNVerify(WIDGET.BUTTON, 200, 200);
    _.AggregateHelper.GetNClick(getWidgetSelector(WIDGET.BUTTON));
    _.PropertyPane.TypeTextIntoField("Label", "{{Button1.setLabel('Hello')}}");

    //Mouse hover to exact warning message
    _.AggregateHelper.GetElement(_.CommonLocators._lintErrorElement).trigger(
      "mouseover",
    );
    _.AggregateHelper.AssertContains("Data fields cannot execute async code");

    //Create a JS object
    _.JSEditor.CreateJSObject(
      `export default {
        myFun1: () => {
          Button1.setLabel('Hello');
        },
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: false,
      },
    );

    //Add myFun1 to onClick
    _.EntityExplorer.SelectEntityByName("Button1");
    _.PropertyPane.TypeTextIntoField("Label", "{{JSObject1.myFun1()}}");

    _.AggregateHelper.AssertContains(
      "Found an action invocation during evaluation. Data fields cannot execute actions.",
    );
  });
});
