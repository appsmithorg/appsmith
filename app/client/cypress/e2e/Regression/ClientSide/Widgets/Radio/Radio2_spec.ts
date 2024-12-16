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
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Radio Widget test cases",
  { tags: ["@tag.Widget", "@tag.Radio", "@tag.Binding"] },
  function () {
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

      propPane.ToggleJSModeByIndex("options", true, 1);
      propPane.EnterJSContext("Options", "{{JSObject1.myFun1()}}");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
      );
      agHelper.AssertExistingCheckedState(
        locators._checkboxTypeByOption("test"),
        "false",
      );
      deployMode.NavigateBacktoEditor();

      //API
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
      );
      apiPage.RunAPI();
      EditorNavigation.SelectEntityByName("RadioGroup1", EntityType.Widget);
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
      cy.get("@postExecute").then((interception: any) => {
        agHelper.Sleep();
        const name = interception.response.body.data.body[0].name;
        agHelper.AssertExistingCheckedState(
          locators._checkboxTypeByOption(name),
          "false",
        );
      });
      agHelper.AssertElementLength(widgetLocators.radioBtn, 10);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("RadioGroup1", EntityType.Widget);

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
      agHelper.AssertExistingCheckedState(
        locators._checkboxTypeByOption("Blue"),
        "false",
      );
      agHelper.AssertExistingCheckedState(
        locators._checkboxTypeByOption("Green"),
        "false",
      );
    });

    it("2. Validate validation errors evaluated value poup", () => {
      //String
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("RadioGroup1", EntityType.Widget);
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
      EditorNavigation.SelectEntityByName("RadioGroup1", EntityType.Widget);
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
      EditorNavigation.SelectEntityByName("RadioGroup1", EntityType.Widget);
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
      EditorNavigation.SelectEntityByName("RadioGroup1", EntityType.Widget);
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
      EditorNavigation.SelectEntityByName("RadioGroup1", EntityType.Widget);
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
        locators._checkboxTypeByOption("Blue"),
        "false",
      );
      agHelper.AssertExistingCheckedState(
        locators._checkboxTypeByOption("Green"),
        "false",
      );

      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("RadioGroup1", EntityType.Widget);
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
      agHelper.AssertExistingCheckedState(
        locators._checkboxTypeByOption("test"),
      );
    });

    it("4. Validate Label properties - Text , Position , Alignment , Width(in columns)", function () {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("RadioGroup1", EntityType.Widget);
      //Text
      propPane.TypeTextIntoField("Text", "Select Value");

      //Position
      agHelper.AssertAttribute(
        locators._position("Top"),
        "data-selected",
        "true",
      );
      agHelper.AssertCSS(
        widgetLocators.radioWidgetLabel,
        "margin-bottom",
        "5px",
      );
      agHelper.AssertCSS(
        widgetLocators.radioWidgetLabel,
        "margin-right",
        "0px",
      );
      agHelper.GetNClick(locators._position("Left"));

      //Alignment
      agHelper.AssertAttribute(
        locators._alignment("left"),
        "data-selected",
        "true",
      );
      agHelper.GetNClick(locators._alignment("right"));

      agHelper.GetNClick(widgetLocators.selectWidgetWidthPlusBtn);
      agHelper.GetNClick(widgetLocators.selectWidgetWidthPlusBtn);

      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
      );
      agHelper.AssertCSS(
        widgetLocators.radioWidgetLabel,
        "margin-bottom",
        "0px",
      );
      agHelper.AssertCSS(
        widgetLocators.radioWidgetLabel,
        "margin-right",
        "5px",
      );
      agHelper.AssertCSS(
        widgetLocators.radioWidgetLabel,
        "text-align",
        "right",
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
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 300, 300);
      propPane.UpdatePropertyFieldValue("Text", "Tooltip text");
      EditorNavigation.SelectEntityByName("RadioGroup1", EntityType.Widget);
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
      agHelper.Sleep(2000); //for Radio Group to load fully, for CI flakyness
      agHelper.HoverElement(locators._tooltipIcon);
      agHelper.AssertPopoverTooltip("Tooltip text");
      agHelper.AssertElementEnabledDisabled(
        locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
        0,
        false,
      );
      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
      );

      agHelper.GetHeight(
        locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
      );
      cy.get("@eleHeight").then(($currentHeight: any) => {
        expect($currentHeight).to.be.greaterThan(130);
      });

      agHelper.GetWidth(
        locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
      );
      cy.get("@eleWidth").then(($currentWidth) => {
        expect($currentWidth).to.be.greaterThan(420);
      });
    });

    it("6. Validate general section in radio group - Part2", function () {
      //Disable - should throw error for non boolean values
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("RadioGroup1", EntityType.Widget);
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

      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Text", "false");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TEXT));
      agHelper.Sleep(2000); //for Radio Group to load fully, for CI flakyness
      agHelper.WaitUntilEleAppear(
        locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
      );
      agHelper.AssertElementEnabledDisabled(
        locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
        0,
        true,
      );
    });

    it("7. Validate set property methods for Radio group", () => {
      deployMode.NavigateBacktoEditor();
      //JS Object
      jsEditor.CreateJSObject(
        `export default {
        myVar1: [{
          label:'test',
          value:'test'}],
        myFun1 () {
          RadioGroup1.setData(this.myVar1);
          RadioGroup1.isVisible? RadioGroup1.setDisabled(true):RadioGroup1.setVisibility(false)
        }
      }`,
        {
          paste: true,
          completeReplace: true,
          toRun: false,
          shouldCreateNewJSObj: true,
        },
      );
      EditorNavigation.SelectEntityByName("RadioGroup1", EntityType.Widget);
      propPane.EnterJSContext("Disabled", "false", true, true);
      propPane.EnterJSContext("onSelectionChange", "{{JSObject3.myFun1();}}");

      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
      );

      cy.get("@postExecute").then((interception: any) => {
        agHelper.Sleep();
        const name = interception.response.body.data.body[0].name;
        agHelper.AssertExistingCheckedState(
          locators._checkboxTypeByOption(name),
          "false",
        );
      });
      agHelper.GetNClick(widgetLocators.radioBtn, 1);
      agHelper.AssertExistingCheckedState(
        locators._checkboxTypeByOption("test"),
        "false",
      );
      agHelper.AssertElementEnabledDisabled(
        locators._widgetInDeployed(draggableWidgets.RADIO_GROUP),
        0,
        true,
      );
    });
  },
);
