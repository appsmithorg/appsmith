import {
  agHelper,
  draggableWidgets,
  deployMode,
  entityExplorer,
  locators,
  propPane,
  widgetLocators,
} from "../../../../../support/Objects/ObjectsCore";

describe("InputV2 widget tests", function () {
  let testcases;
  before(() => {
    entityExplorer.DragNDropWidget(draggableWidgets.INPUT_V2);
  });

  it("1. Data Type - Single Line Text", function () {
    propPane.AssertPropertiesDropDownCurrentValue(
      "Data type",
      "Single-line text",
    );

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
    agHelper.AssertCSS(widgetLocators.inputWidgetLabel, "margin-bottom", "5px");
    agHelper.AssertCSS(widgetLocators.inputWidgetLabel, "margin-right", "0px");
    agHelper.GetNClick(locators._position("Left"));
    agHelper.AssertAttribute(
      locators._position("Left"),
      "data-selected",
      "true",
    );

    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.INPUT_V2));

    //Assert that it doesn't display textarea for single line text
    agHelper.AssertElementAbsence(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " textarea",
    );
    agHelper.AssertAttribute(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
      "value",
      "Enter input",
    );
    agHelper.AssertCSS(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
      "height",
      "30px",
    );
    agHelper.AssertCSS(widgetLocators.inputWidgetLabel, "margin-bottom", "0px");
    agHelper.AssertCSS(widgetLocators.inputWidgetLabel, "margin-right", "5px");

    //Validate special characters & symbols
    agHelper.ClearNType(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
      "!@#$56&*().,:",
    );
    agHelper.AssertAttribute(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
      "value",
      "!@#$56&*().,:",
    );

    //Assert widget height after text input
    agHelper.ClearNType(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
      `[
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
    ]`,
    );
    agHelper.AssertCSS(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
      "height",
      "30px",
    );
  });

  it("2. Data Type - Multi Line Text", function () {
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Input1", "Widgets");
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
    agHelper.AssertCSS(widgetLocators.inputWidgetLabel, "margin-bottom", "0px");
    agHelper.AssertCSS(widgetLocators.inputWidgetLabel, "margin-right", "5px");
    agHelper.GetNClick(locators._position("Auto"));
    agHelper.AssertAttribute(
      locators._position("Auto"),
      "data-selected",
      "true",
    );

    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.INPUT_V2));

    //Assert that it should display textarea for multi line text
    agHelper.AssertElementVisibility(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " textarea",
    );
    agHelper.AssertContains(
      "Enter multi line input",
      "be.visible",
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " textarea",
    );
    agHelper.AssertCSS(widgetLocators.inputWidgetLabel, "margin-bottom", "5px");
    agHelper.AssertCSS(widgetLocators.inputWidgetLabel, "margin-right", "0px");
    agHelper.AssertCSS(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " textarea",
      "height",
      "62px",
    );

    //Validate text formatting
    agHelper.ClearNType(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " textarea",
      `[
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
    ]`,
    );
    agHelper.AssertText(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " textarea",
      "text",
      `[
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
    ]`,
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
    entityExplorer.SelectEntityByName("Input1", "Widgets");
    propPane.SelectPropertiesDropDown("Data type", "Number");

    //Default value
    propPane.UpdatePropertyFieldValue("Default value", "0");

    //Min
    propPane.UpdatePropertyFieldValue("Min", "-1");

    //Max
    propPane.UpdatePropertyFieldValue("Max", "1000000");
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.INPUT_V2));
    agHelper.AssertAttribute(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
      "value",
      0,
    );

    //Validate characters, decimals & negative numbers
    testcases = [
      {
        input: "!@#$56&*(),:",
        expected: 56,
      },
      {
        input: "0.12356578909",
        expected: 0.12356578909,
      },
      {
        input: "-0.12356578909",
        expected: -0.12356578909,
      },
    ];
    testcases.forEach((testcase) => {
      agHelper.ClearNType(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        testcase.input,
      );
      agHelper.AssertAttribute(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "value",
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
    entityExplorer.SelectEntityByName("Input1", "Widgets");
    propPane.SelectPropertiesDropDown("Data type", "Password");

    //Default value
    propPane.UpdatePropertyFieldValue("Default value", "1234");
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.INPUT_V2));
    agHelper.AssertAttribute(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
      "value",
      1234,
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
    entityExplorer.SelectEntityByName("Input1", "Widgets");
    propPane.SelectPropertiesDropDown("Data type", "Email");

    //Default value
    propPane.UpdatePropertyFieldValue("Default value", "test@gmail.com");
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.INPUT_V2));
    agHelper.AssertAttribute(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
      "value",
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
      agHelper.AssertAttribute(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "value",
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
      agHelper.AssertAttribute(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "value",
        email,
      );
      agHelper.AssertPopoverTooltip("Invalid input");
    });
  });

  it("6. Validate Required field", function () {
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Input1", "Widgets");
    propPane.TogglePropertyState("Required", "On");
    propPane.UpdatePropertyFieldValue("Default value", "");

    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.INPUT_V2));
    agHelper.TypeText(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
      "test",
    );
    agHelper.ClearTextField(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
    );
    agHelper.AssertPopoverTooltip("This field is required");
  });

  it("7. Validate Max Characters (Single & Multi Line Text)", function () {
    //Single line text input
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Input1", "Widgets");
    propPane.SelectPropertiesDropDown("Data type", "Single-line text");
    propPane.UpdatePropertyFieldValue("Max characters", "10");

    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.INPUT_V2));
    agHelper.ClearNType(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
      "Hello! How are you?",
    );
    agHelper.AssertAttribute(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
      "value",
      "Hello! How",
    );

    //Multi line text input
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Input1", "Widgets");
    propPane.SelectPropertiesDropDown("Data type", "Multi-line text");
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.INPUT_V2));
    agHelper.ClearNType(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " textarea",
      "Hello! How are you?",
    );
    agHelper.AssertText(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " textarea",
      "text",
      "Hello! How",
    );
  });

  it("8. Validate Valid property", function () {
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Input1", "Widgets");
    propPane.UpdatePropertyFieldValue("Valid", "{{Input1.text.length > 5}}");

    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.INPUT_V2));
    agHelper.ClearNType(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " textarea",
      "test",
    );
    agHelper.AssertPopoverTooltip("Invalid input");
  });

  it("9. Verify Input widget styles", function () {
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Input1", "Widgets");
    propPane.MoveToTab("Style");
    propPane.SelectColorFromColorPicker("fontcolor", 11);
    propPane.SelectPropertiesDropDown("Font size", "M");
    agHelper.GetNClick(propPane._emphasisSelector("BOLD"));
    agHelper.ContainsNClick("Medium");
    agHelper.GetNClick(locators._borderRadius("1.5rem"));
    agHelper
      .GetWidgetCSSFrAttribute(widgetLocators.inputWidgetLabel, "color")
      .then((color) => {
        deployMode.DeployApp(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2),
        );
        agHelper.AssertCSS(widgetLocators.inputWidgetLabel, "color", color);
        agHelper.AssertCSS(
          widgetLocators.inputWidgetLabel,
          "font-size",
          "16px",
        );
        agHelper.AssertCSS(
          widgetLocators.inputWidgetLabel,
          "font-weight",
          "700",
        );
      });
    agHelper.AssertCSS(
      widgetLocators.inputWidgetWrapper,
      "box-shadow",
      "rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px",
    );
    agHelper.AssertCSS(
      widgetLocators.inputWidgetWrapper,
      "border-radius",
      "24px",
    );

    //JS conversion
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Input1", "Widgets");
    propPane.MoveToTab("Style");
    propPane.EnterJSContext("Font color", "#22c55e");
    propPane.EnterJSContext("Font size", "1.25rem");
    agHelper.GetNClick(propPane._emphasisSelector("ITALIC"));
    propPane.EnterJSContext("Border radius", "1rem");
    propPane.EnterJSContext(
      "Box shadow",
      "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    );
    agHelper
      .GetWidgetCSSFrAttribute(widgetLocators.inputWidgetLabel, "color")
      .then((color) => {
        deployMode.DeployApp(
          locators._widgetInDeployed(draggableWidgets.INPUT_V2),
        );
        agHelper.AssertCSS(widgetLocators.inputWidgetLabel, "color", color);
        agHelper.AssertCSS(
          widgetLocators.inputWidgetLabel,
          "font-size",
          "20px",
        );
        agHelper.AssertCSS(
          widgetLocators.inputWidgetLabel,
          "font-style",
          "italic",
        );
      });
    agHelper.AssertCSS(
      widgetLocators.inputWidgetWrapper,
      "box-shadow",
      "rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px",
    );
    agHelper.AssertCSS(
      widgetLocators.inputWidgetWrapper,
      "border-radius",
      "16px",
    );
  });
});
