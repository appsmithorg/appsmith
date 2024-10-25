import {
  getWidgetSelector,
  PROPERTY_SELECTOR,
  WIDGET,
} from "../../../../locators/WidgetLocators";

import {
  agHelper,
  entityExplorer,
  jsEditor,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

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
      "{{Audio1.setURL('http://host.docker.internal:4200/bird.mp4')}}",
    valueBinding: "{{Audio1.url}}",
    expectedValue: "http://host.docker.internal:4200/bird.mp4",
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
  {
    name: "setValue",
    property: "value",
    widget: WIDGET.CURRENCY_INPUT,
    actionBinding: "{{CurrencyInput1.setValue(100)}}",
    valueBinding: "{{CurrencyInput1.value}}",
    expectedValue: "100",
  },
];

Object.values(setterMethodsToTest).forEach(
  (
    { actionBinding, expectedValue, name, property, valueBinding, widget },
    index,
  ) => {
    describe(
      `${index + 1}. ${name} method test`,
      { tags: ["@tag.Widget", "@tag.JS"] },
      () => {
        beforeEach("Adding new pag & DragDrop widget", () => {
          PageList.AddNewPage();
          entityExplorer.DragDropWidgetNVerify(widget, 300, 200);
        });
        it(`1. DragDrop Label/Text widgets and Verify the updated value`, () => {
          entityExplorer.DragDropWidgetNVerify(WIDGET.BUTTON, 500, 100);

          propPane.EnterJSContext(
            PROPERTY_SELECTOR.onClickFieldName,
            actionBinding,
          );

          entityExplorer.DragDropWidgetNVerify(WIDGET.TEXT, 500, 300);

          propPane.UpdatePropertyFieldValue(
            PROPERTY_SELECTOR.TextFieldName,
            valueBinding,
          );
          agHelper.GetNClick(getWidgetSelector(WIDGET.BUTTON));

          agHelper.GetText(getWidgetSelector(WIDGET.TEXT)).then(($label) => {
            expect($label).to.eq(expectedValue);
          });
        });
      },
    );
  },
);

describe(
  "Linting warning for setter methods",
  { tags: ["@tag.Widget", "@tag.Binding"] },
  function () {
    it("Lint error when setter is used in a data field", function () {
      entityExplorer.DragDropWidgetNVerify(WIDGET.BUTTON, 200, 200);
      entityExplorer.DragDropWidgetNVerify(WIDGET.TEXT, 400, 400);

      agHelper.GetNClick(getWidgetSelector(WIDGET.BUTTON));
      propPane.TypeTextIntoField("Label", "{{Button1.setLabel('Hello')}}");

      //Mouse hover to exact warning message
      agHelper.AssertElementVisibility(locators._lintErrorElement);
      agHelper.HoverElement(locators._lintErrorElement);
      agHelper.AssertContains("Data fields cannot execute async code");
      agHelper.Sleep();

      //Create a JS object
      jsEditor.CreateJSObject(
        `export default {
        myFun1: () => {
          Button1.setLabel('Hello');
          Button1.isVisible = false;
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

      agHelper.AssertElementVisibility(locators._lintErrorElement);
      agHelper.GetElement(locators._lintErrorElement).realHover();
      agHelper.AssertContains(
        "Direct mutation of widget properties is not supported. Use Button1.setVisibility(value) instead.",
      );
      agHelper.Sleep();

      //Add myFun1 to onClick
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.TypeTextIntoField("Label", "{{JSObject1.myFun1()}}");

      agHelper.AssertContains(
        "Found an action invocation during evaluation. Data fields cannot execute actions.",
      );
      agHelper.Sleep();
    });
  },
);
