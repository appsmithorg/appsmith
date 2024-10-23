import {
  agHelper,
  draggableWidgets,
  deployMode,
  entityExplorer,
  locators,
  propPane,
  widgetLocators,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "InputV2 widget tests",
  { tags: ["@tag.Widget", "@tag.Input", "@tag.Binding"] },
  function () {
    let testcases,
      multilineData = `[
    {
      "label": "Blue",
      "value": "Blue"
    },
    {
      "label": "Green",
      "value": "Green"
    },
    {
      "label": "Red",
      "value": "RED"
    }
  ]`;
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2);
    });

    it("1. Data Type - Single Line Text", function () {
      propPane.AssertPropertiesDropDownCurrentValue(
        "Data type",
        "Single-line text",
      );
      propPane.AssertPropertiesDropDownValues("Data type", [
        "Single-line text",
        "Multi-line text",
        "Number",
        "Password",
        "Email",
      ]);

      //Assert that it doesn't display textarea for single line text
      agHelper.AssertElementAbsence(
        locators._widgetInCanvas(draggableWidgets.INPUT_V2) + " textarea",
      );

      //Default value
      propPane.UpdatePropertyFieldValue("Default value", "Enter input");

      //Position
      agHelper.AssertAttribute(
        locators._position("Top"),
        "data-selected",
        "true",
      );
      agHelper.AssertCSS(
        widgetLocators.inputWidgetLabel,
        "margin-bottom",
        "5px",
      );
      agHelper.AssertCSS(
        widgetLocators.inputWidgetLabel,
        "margin-right",
        "0px",
      );
      agHelper.GetNClick(locators._position("Left"));
      agHelper.AssertAttribute(
        locators._position("Left"),
        "data-selected",
        "true",
      );

      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2),
      );

      //Assert that it doesn't display textarea for single line text
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " textarea",
      );
      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "val",
        "Enter input",
      );
      agHelper.AssertCSS(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "height",
        "30px",
      );
      agHelper.AssertCSS(
        widgetLocators.inputWidgetLabel,
        "margin-bottom",
        "0px",
      );
      agHelper.AssertCSS(
        widgetLocators.inputWidgetLabel,
        "margin-right",
        "5px",
      );

      //Validate special characters & symbols
      agHelper.ClearNType(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "!@#$56&*().,:",
      );
      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "val",
        "!@#$56&*().,:",
      );

      //Assert widget height after text input
      agHelper.ClearNType(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        multilineData,
      );
      agHelper.AssertCSS(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "height",
        "30px",
      );
    });

    it("2. Data Type - Multi Line Text", function () {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      propPane.SelectPropertiesDropDown("Data type", "Multi-line text");

      //Assert that it should display textarea for multi line text
      agHelper.AssertElementVisibility(
        locators._widgetInCanvas(draggableWidgets.INPUT_V2) + " textarea",
      );

      //Default value
      propPane.UpdatePropertyFieldValue(
        "Default value",
        "Enter multi line input",
      );

      //Position
      agHelper.AssertAttribute(
        locators._position("Left"),
        "data-selected",
        "true",
      );
      agHelper.AssertCSS(
        widgetLocators.inputWidgetLabel,
        "margin-bottom",
        "0px",
      );
      agHelper.AssertCSS(
        widgetLocators.inputWidgetLabel,
        "margin-right",
        "5px",
      );
      agHelper.GetNClick(locators._position("Auto"));
      agHelper.AssertAttribute(
        locators._position("Auto"),
        "data-selected",
        "true",
      );

      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2),
      );

      //Assert that it should display textarea for multi line text
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " textarea",
      );
      agHelper.AssertContains(
        "Enter multi line input",
        "be.visible",
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " textarea",
      );
      agHelper.AssertCSS(
        widgetLocators.inputWidgetLabel,
        "margin-bottom",
        "5px",
      );
      agHelper.AssertCSS(
        widgetLocators.inputWidgetLabel,
        "margin-right",
        "0px",
      );
      agHelper.AssertCSS(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " textarea",
        "height",
        "62px",
      );

      //Validate text formatting
      agHelper.ClearNType(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " textarea",
        multilineData,
      );
      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " textarea",
        "text",
        multilineData,
      );

      //Assert widget height after text input
      agHelper.AssertCSS(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " textarea",
        "height",
        "314px",
      );
    });

    it("3. Data Type - Number", function () {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      propPane.SelectPropertiesDropDown("Data type", "Number");

      //Default value
      propPane.UpdatePropertyFieldValue("Default value", "0");

      //Min
      propPane.UpdatePropertyFieldValue("Min", "-1");

      //Max
      propPane.UpdatePropertyFieldValue("Max", "1000000");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2),
      );
      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "val",
        "0",
      );

      //Validate characters, decimals & negative numbers
      testcases = [
        {
          input: "!@#$56&*(),:",
          expected: "56",
        },
        {
          input: "0.12356578909",
          expected: "0.12356578909",
        },
        {
          input: "-0.12356578909",
          expected: "-0.12356578909",
        },
      ];
      testcases.forEach((testcase) => {
        agHelper.ClearNType(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
          testcase.input,
        );
        agHelper.AssertText(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
          "val",
          testcase.expected,
        );
      });

      //Validation for minimum and maximum values
      testcases = ["-12", "-1.1", "1000080", "1000000.001"];
      testcases.forEach((value) => {
        agHelper.ClearNType(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
          value,
        );
        agHelper.AssertPopoverTooltip("Invalid input");
      });

      testcases = ["-0.99", "-1", "1000000", "999999.999"];
      testcases.forEach((value) => {
        agHelper.ClearNType(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
          value,
        );
        agHelper.AssertContains(
          "Invalid input",
          "not.exist",
          locators._popoverToolTip,
        );
      });
    });

    it("4. Data Type - Password", function () {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      propPane.SelectPropertiesDropDown("Data type", "Password");

      //Default value
      propPane.UpdatePropertyFieldValue("Default value", "1234");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2),
      );
      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "val",
        "1234",
      );

      //Validate password is masked
      agHelper.ClearNType(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "password@123",
      );
      agHelper.AssertAttribute(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "type",
        "password",
      );
      agHelper.AssertProperty(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "nodeName",
        "INPUT",
      );
      //Unmask password
      agHelper.GetNClick(widgetLocators.inputWidgetUnMaskPassword);
      agHelper.AssertAttribute(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "type",
        "text",
      );
    });

    it("5. Data Type - Email", function () {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      propPane.SelectPropertiesDropDown("Data type", "Email");

      //Default value
      propPane.UpdatePropertyFieldValue("Default value", "test@gmail.com");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2),
      );
      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "val",
        "test@gmail.com",
      );

      //Validate different email formats
      testcases = [
        "user1@example.com",
        "user2@subdomain.example",
        "test3@outlook.in",
      ];
      testcases.forEach((email) => {
        agHelper.ClearNType(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
          email,
        );
        agHelper.AssertText(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
          "val",
          email,
        );
        agHelper.AssertContains(
          "Invalid input",
          "not.exist",
          locators._popoverToolTip,
        );
      });

      //Invalid email validation
      testcases = [
        "user1@example",
        "user2@subdomain.",
        "test3outlook.in",
        "testmail",
      ];
      testcases.forEach((email) => {
        agHelper.ClearNType(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
          email,
        );
        agHelper.AssertText(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
          "val",
          email,
        );
        agHelper.AssertPopoverTooltip("Invalid input");
      });
    });
  },
);
