import {
  agHelper,
  apiPage,
  dataManager,
  deployMode,
  draggableWidgets,
  entityExplorer,
  jsEditor,
  locators,
  propPane,
  widgetLocators,
} from "../../../../../support/Objects/ObjectsCore";

describe("Radio Widget test cases", function () {
  it("1. Validate radio widget bindings", () => {
    //JS Object
    jsEditor.CreateJSObject(
      `export default {
      myFun1 () {
        const myVar1= [{
          label:'test',
          value:'test'}]
        return myVar1
      }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.RADIO_GROUP);
    propPane.EnterJSContext("Options", "{{JSObject1.myFun1()}}");

    deployMode.DeployApp(
      locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
    );
    agHelper.GetNAssertContains(widgetLocators.radioWidgetContainer, "test");
    deployMode.NavigateBacktoEditor();

    //API
    apiPage.CreateAndFillApi(
      dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
    );
    apiPage.RunAPI();
    entityExplorer.SelectEntityByName("RadioGroup1", "Widgets");
    propPane.EnterJSContext(
      "Options",
      `{{Api1.data.map((s)=>{
         return {label: s.name,
         value: s.name}
        })}}`,
    );
    deployMode.DeployApp(
      locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
    );
    agHelper.GetElement("@postExecute").then((interception: any) => {
      agHelper.Sleep();
      const name = interception.response.body.data.body[0].name;
      agHelper.GetNAssertContains(widgetLocators.radioWidgetContainer, name);
    });
    agHelper.AssertElementLength(widgetLocators.radioBtn, 10);
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("RadioGroup1", "Widgets");

    //Array
    propPane.EnterJSContext(
      "Options",
      `[{
        "label": "Blue",
        "value": "BLUE"
      },
      {
        "label": "Green",
        "value": "GREEN"
      }]`,
    );
    deployMode.DeployApp(
      locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
    );
    agHelper.GetNAssertContains(widgetLocators.radioWidgetContainer, "Blue");
    agHelper.GetNAssertContains(widgetLocators.radioWidgetContainer, "Green");
  });

  it("2. Validate validation errors evaluated value poup", () => {
    //String
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("RadioGroup1", "Widgets");
    propPane.EnterJSContext("Options", "test");
    agHelper.VerifyEvaluatedErrorMessage(
      `This value does not evaluate to type Array<{ "label": "string", "value": "string" | number }>`,
    );

    deployMode.DeployApp(
      locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
    );
    agHelper.GetNAssertContains(
      widgetLocators.radioWidgetContainer,
      "test",
      "not.exist",
    );

    //Non array
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("RadioGroup1", "Widgets");
    propPane.EnterJSContext("Options", `[{name:1,class:10}]`);
    agHelper.VerifyEvaluatedErrorMessage(
      `This value does not evaluate to type Array<{ "label": "string", "value": "string" | number }>`,
    );

    deployMode.DeployApp(
      locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
    );
    agHelper.GetNAssertContains(
      widgetLocators.radioWidgetContainer,
      "10",
      "not.exist",
    );

    //Non array api data
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("RadioGroup1", "Widgets");
    propPane.EnterJSContext(
      "Options",
      `{{Api1.data.map((s)=>{
      return value: s.name
     }})}`,
    );
    agHelper.VerifyEvaluatedErrorMessage(
      `This value does not evaluate to type Array<{ "label": "string", "value": "string" | number }>`,
    );

    //Non array JS data
    jsEditor.CreateJSObject(
      `export default {
      myFun1 () {
        const myVar1= {
          label:'test',
          value:'test'}
        return myVar1
      }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    entityExplorer.SelectEntityByName("RadioGroup1", "Widgets");
    propPane.EnterJSContext("Options", `"{{JSObject2.myFun1()}}"`);
    agHelper.VerifyEvaluatedErrorMessage(
      `This value does not evaluate to type Array<{ "label": "string", "value": "string" | number }>`,
    );
    deployMode.DeployApp(
      locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
    );
    agHelper.GetNAssertContains(
      widgetLocators.radioWidgetContainer,
      "test",
      "not.exist",
    );
  });

  it("3. Verify default selected value property", () => {
    //String
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("RadioGroup1", "Widgets");
    propPane.EnterJSContext(
      "Options",
      `[{
      "label": "Blue",
      "value": "BLUE"
    },
    {
      "label": "Green",
      "value": "GREEN"
    }]`,
    );
    propPane.UpdatePropertyFieldValue("Default selected value", "red");
    deployMode.DeployApp(
      locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
    );
    agHelper.AssertExistingCheckedState(
      widgetLocators.radioBtn + " input",
      "false",
    );

    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("RadioGroup1", "Widgets");
    propPane.EnterJSContext("Options", "{{JSObject1.myFun1()}}");
    propPane.UpdatePropertyFieldValue(
      "Default selected value",
      "{{JSObject1.myFun1()[0]}}",
    );
    agHelper.VerifyEvaluatedErrorMessage(
      "This value does not evaluate to type: string or number",
    );

    propPane.UpdatePropertyFieldValue(
      "Default selected value",
      "{{JSObject1.myFun1()[0].label}}",
    );
    deployMode.DeployApp(
      locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
    );
    agHelper.AssertExistingCheckedState(widgetLocators.radioBtn + " input");
  });

  it("4. Validate Label properties - Text , Position , Alignment , Width(in columns)", function () {
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("RadioGroup1", "Widgets");
    //Text
    propPane.TypeTextIntoField("Text", "Select Value");

    //Position
    agHelper.AssertAttribute(
      locators._position("Top"),
      "data-selected",
      "true",
    );
    agHelper.AssertCSS(widgetLocators.radioWidgetLabel, "margin-bottom", "5px");
    agHelper.AssertCSS(widgetLocators.radioWidgetLabel, "margin-right", "0px");
    agHelper.GetNClick(locators._position("Left"));

    //Alignment
    agHelper.AssertAttribute(
      locators._alignment("left"),
      "data-selected",
      "true",
    );
    agHelper.GetNClick(locators._alignment("right"));

    //Width
    agHelper.AssertCSS(
      widgetLocators.radioWidgetLabelContainer,
      "width",
      "59.765625px",
    );
    agHelper.GetNClick(widgetLocators.selectWidgetWidthPlusBtn);
    agHelper.GetNClick(widgetLocators.selectWidgetWidthPlusBtn);

    deployMode.DeployApp(
      locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
    );
    agHelper.AssertCSS(widgetLocators.radioWidgetLabel, "margin-bottom", "0px");
    agHelper.AssertCSS(widgetLocators.radioWidgetLabel, "margin-right", "5px");
    agHelper.AssertCSS(widgetLocators.radioWidgetLabel, "text-align", "right");
    agHelper.AssertCSS(
      widgetLocators.radioWidgetLabelContainer,
      "width",
      "151.265625px",
    );
    agHelper.AssertText(
      widgetLocators.radioWidgetLabel,
      "text",
      "Select Value",
    );
  });

  it("5. Validate general section in radio group", function () {
    deployMode.NavigateBacktoEditor();

    //Tooltip
    entityExplorer.DragNDropWidget(draggableWidgets.TEXT, 300, 300);
    propPane.UpdatePropertyFieldValue("Text", "Tooltip text");
    entityExplorer.SelectEntityByName("RadioGroup1", "Widgets");
    propPane.EnterJSContext(
      "Options",
      `{{Api1.data.map((s)=>{
         return {label: s.name,
         value: s.name}
        })}}`,
    );
    propPane.UpdatePropertyFieldValue("Tooltip", "{{Text1.text}}");
    agHelper.AssertExistingToggleState("Disabled", "false");
    agHelper.AssertExistingToggleState("Inline", "true");
    agHelper.AssertExistingToggleState("Visible", "true");
    deployMode.DeployApp(
      locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
    );
    agHelper.HoverElement(locators._tooltipIcon);
    agHelper.AssertPopoverTooltip("Tooltip text");
    agHelper.AssertElementEnabledDisabled(
      locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
      0,
      false,
    );
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.RADIO_GROUP))
      .invoke("height")
      .should("be.greaterThan", 130);
    agHelper.AssertCSS(
      locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
      "width",
      "432.1875px",
    );

    //Disable - should throw error for non boolean values
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("RadioGroup1", "Widgets");
    propPane.EnterJSContext("Disabled", "test", true, true);
    agHelper.VerifyEvaluatedErrorMessage(
      `This value does not evaluate to type boolean`,
    );
    propPane.EnterJSContext("Disabled", "{{!!(Text1.text)}}", true, true);

    //Inline - should throw error for non boolean values
    propPane.EnterJSContext("Inline", "test", true, true);
    agHelper.VerifyEvaluatedErrorMessage(
      `This value does not evaluate to type boolean`,
    );
    propPane.EnterJSContext("Inline", "{{Text1.text}}", true, true);

    //Visible - should throw error for non boolean values
    propPane.EnterJSContext("Visible", "test", true, true);
    agHelper.VerifyEvaluatedErrorMessage(
      `This value does not evaluate to type boolean`,
    );
    propPane.EnterJSContext("Visible", "{{!!(Text1.text)}}", true, true);

    entityExplorer.SelectEntityByName("Text1", "Widgets");
    propPane.UpdatePropertyFieldValue("Text", "false");
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TEXT));
    agHelper.AssertElementEnabledDisabled(
      locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
      0,
      true,
    );
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.RADIO_GROUP))
      .invoke("height")
      .should("be.greaterThan", 270);
    agHelper.AssertCSS(
      locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
      "width",
      "432.1875px",
    );
  });
});
