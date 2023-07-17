import {
  PROPERTY_SELECTOR,
  WIDGET,
  getWidgetSelector,
} from "../../../../locators/WidgetLocators";

import {
  entityExplorer,
  jsEditor,
  agHelper,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";

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
      it(`1. DragDrop widget & Label/Text widgets and Verify the updated value`, () => {
        entityExplorer.DragDropWidgetNVerify(widget, 300, 200);
        entityExplorer.DragDropWidgetNVerify(WIDGET.BUTTON, 700, 200);

        propPane.EnterJSContext(
          PROPERTY_SELECTOR.onClickFieldName,
          actionBinding,
        );

        entityExplorer.DragDropWidgetNVerify(WIDGET.TEXT, 700, 400);

        propPane.UpdatePropertyFieldValue(
          PROPERTY_SELECTOR.TextFieldName,
          valueBinding,
        );

        agHelper.GetNClick(getWidgetSelector(WIDGET.BUTTON));

        agHelper.GetText(getWidgetSelector(WIDGET.TEXT)).then(($label) => {
          expect($label).to.eq(expectedValue);
        });
      });

      afterEach("Delete all the widgets on canvas", () => {
        agHelper.GetNClick(locators._widgetInCanvas(widget));
        agHelper.PressDelete();

        agHelper.GetNClick(getWidgetSelector(WIDGET.BUTTON));
        agHelper.AssertContains("is not defined"); // Since widget is removed & Button is still holding its reference
        agHelper.PressDelete();

        agHelper.GetNClick(getWidgetSelector(WIDGET.TEXT)).click();
        agHelper.GetNClick(propPane._deleteWidget);
      });
    });
  },
);

describe("Linting warning for setter methods", function () {
  it("Lint error when setter is used in a data field", function () {
    entityExplorer.DragDropWidgetNVerify(WIDGET.BUTTON, 200, 200);
    agHelper.GetNClick(getWidgetSelector(WIDGET.BUTTON));
    propPane.TypeTextIntoField("Label", "{{Button1.setLabel('Hello')}}");

    //Mouse hover to exact warning message
    agHelper.HoverElement(locators._lintErrorElement);
    agHelper.AssertContains("Data fields cannot execute async code");

    //Create a JS object
    jsEditor.CreateJSObject(
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
    entityExplorer.SelectEntityByName("Button1");
    propPane.TypeTextIntoField("Label", "{{JSObject1.myFun1()}}");

    agHelper.AssertContains(
      "Found an action invocation during evaluation. Data fields cannot execute actions.",
    );
  });
});
