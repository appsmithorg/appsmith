import { getWidgetSelector } from "../../../../../locators/WidgetLocators";
import {
  agHelper,
  dataSources,
  draggableWidgets,
  deployMode,
  entityExplorer,
  locators,
  propPane,
  widgetLocators,
} from "../../../../../support/Objects/ObjectsCore";

describe("Select widget tests", function () {
  before(() => {
    entityExplorer.DragNDropWidget(draggableWidgets.SELECT);
  });

  it("1. Validate Label properties - Text , Position , Alignment , Width(in columns)", function () {
    //Text
    propPane.TypeTextIntoField("Text", "Select Value");

    //Position
    agHelper.AssertAttribute(
      locators._position("Top"),
      "data-selected",
      "true",
    );
    agHelper.AssertCSS(
      widgetLocators.selectWidgetLabel,
      "margin-bottom",
      "5px",
    );
    agHelper.AssertCSS(widgetLocators.selectWidgetLabel, "margin-right", "0px");
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
      widgetLocators.selectWidgetLabel +
        "//parent::span/parent::span/parent::div",
      "width",
      "59.765625px",
    );
    agHelper.GetNClick(widgetLocators.selectWidgetWidthPlusBtn);
    agHelper.GetNClick(widgetLocators.selectWidgetWidthPlusBtn);

    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.SELECT));
    agHelper.AssertCSS(
      widgetLocators.selectWidgetLabel,
      "margin-bottom",
      "0px",
    );
    agHelper.AssertCSS(widgetLocators.selectWidgetLabel, "margin-right", "5px");
    agHelper.AssertCSS(widgetLocators.selectWidgetLabel, "text-align", "right");
    agHelper.AssertCSS(
      widgetLocators.selectWidgetLabel +
        "//parent::span/parent::span/parent::div",
      "width",
      "129.65625px",
    );
    agHelper.AssertText(
      widgetLocators.selectWidgetLabel,
      "text",
      "Select Value",
    );
  });

  it("2. When user selects another option the previous selected option is removed and update with current selection", function () {
    agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
      expect($selectedValue).to.eq("Green");
    });
    agHelper.SelectDropDown("Blue");
    agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
      expect($selectedValue).to.eq("Blue");
      expect($selectedValue).not.to.contain("Green");
    });
  });

  it("3. Validate tooltip and placeholder", function () {
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Select1", "Widgets");
    propPane.UpdatePropertyFieldValue("Tooltip", "{{Input1.text}}");
    propPane.UpdatePropertyFieldValue("Placeholder", "{{Input1.text}}");
    entityExplorer.DragNDropWidget(draggableWidgets.INPUT_V2, 300, 200);
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.INPUT_V2));
    agHelper.TypeText(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
      "Input text",
    );
    agHelper.GetNClick(widgetLocators.selectWidgetClear);
    agHelper.AssertContains(
      "Input text",
      "be.visible",
      widgetLocators.selectWidgetBtn,
    );
    agHelper.HoverElement(locators._tooltipIcon);
    agHelper.AssertPopoverTooltip("Input text");
  });

  it("4. Verify Visible property", () => {
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Select1", "Widgets");
    agHelper.AssertExistingToggleState("Visible", "true");
    propPane.EnterJSContext("Visible", "{{(55>45)?false:true}}", true, true);
    deployMode.DeployApp();
    agHelper.AssertElementAbsence(
      locators._widgetInDeployed(draggableWidgets.SELECT),
    );
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Select1", "Widgets");
    propPane.EnterJSContext("Visible", "", false);
    propPane.ToggleJSMode("Visible", false);
    propPane.TogglePropertyState("Visible", "On");
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.SELECT));
    agHelper.AssertElementVisibility(
      locators._widgetInDeployed(draggableWidgets.SELECT),
    );
  });

  it("5. Verify Disabled property", () => {
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Select1", "Widgets");
    agHelper.AssertExistingToggleState("Disabled", "false");
    propPane.EnterJSContext("Disabled", "{{(45>55)?false:true}}", true, true);
    deployMode.DeployApp();
    agHelper
      .GetElement(widgetLocators.selectWidgetBtn)
      .should("have.attr", "disabled");
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Select1", "Widgets");
    propPane.EnterJSContext("Disabled", "", false);
    propPane.ToggleJSMode("Disabled", false);
    propPane.TogglePropertyState("Disabled", "Off");
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.SELECT));
    agHelper
      .GetElement(widgetLocators.selectWidgetBtn)
      .should("not.have.attr", "disabled");
  });

  it("6. Verify Height property", () => {
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Select1", "Widgets");
    propPane.AssertPropertiesDropDownCurrentValue("Height", "Fixed");
    propPane.AssertPropertiesDropDownValues("Height", [
      "Auto Height",
      "Auto Height with limits",
      "Fixed",
    ]);
    propPane.SelectPropertiesDropDown("Height", "Auto Height");
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.SELECT));
    agHelper.AssertCSS(
      getWidgetSelector(draggableWidgets.SELECT),
      "height",
      "40px",
    );
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Select1", "Widgets");
    propPane.SelectPropertiesDropDown("Height", "Auto Height with limits");
    agHelper.AssertElementVisibility(locators.autoHeightHandles);
    agHelper.AssertElementVisibility(locators.autoHeightMin);
    agHelper.AssertElementVisibility(locators.autoHeightMax);
    propPane.SelectPropertiesDropDown("Height", "Fixed");
  });

  it("7. Validate OnOptionChange , OnDropdownOpen , OnDropdownClose events are JS convertible", () => {
    propPane.EnterJSContext(
      "onOptionChange",
      "{{showAlert('Option changed!','success')}}",
      true,
    );
    propPane.ToggleJSMode("onOptionChange", false);
    propPane.EnterJSContext(
      "onDropdownOpen",
      "{{showAlert('Dropdown opened!','success')}}",
      true,
    );
    propPane.ToggleJSMode("onDropdownOpen", false);
    propPane.EnterJSContext(
      "onDropdownClose",
      "{{showAlert('Dropdown closed!','success')}}",
      true,
    );
    propPane.ToggleJSMode("onDropdownClose", false);
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.SELECT));
    agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.SELECT));
    agHelper.ValidateToastMessage("Dropdown opened!");
    agHelper.AssertElementVisibility(locators._selectOptionValue("Red"), true);
    agHelper.GetNClick(locators._selectOptionValue("Red"));
    agHelper.ValidateToastMessage("Dropdown closed!");
    agHelper.ValidateToastMessage("Option changed!");
  });

  it("8. Verify select widget styles", function () {
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Select1", "Widgets");
    propPane.MoveToTab("Style");
    propPane.SelectColorFromColorPicker("fontcolor", 9);
    propPane.SelectPropertiesDropDown("Font size", "M");
    agHelper.GetNClick(propPane._emphasisSelector("BOLD"));
    agHelper.ContainsNClick("Medium");
    agHelper.GetNClick(locators._borderRadius("1.5rem"));
    agHelper
      .GetWidgetCSSFrAttribute(widgetLocators.selectWidgetLabel, "color")
      .then((color) => {
        deployMode.DeployApp(
          locators._widgetInDeployed(draggableWidgets.SELECT),
        );
        agHelper.AssertCSS(widgetLocators.selectWidgetLabel, "color", color);
        agHelper.AssertCSS(
          widgetLocators.selectWidgetLabel,
          "font-size",
          "16px",
        );
        agHelper.AssertCSS(
          widgetLocators.selectWidgetLabel,
          "font-weight",
          "700",
        );
      });
    agHelper.AssertCSS(
      widgetLocators.selectWidgetBtn,
      "box-shadow",
      "rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px",
    );
    agHelper.AssertCSS(widgetLocators.selectWidgetBtn, "border-radius", "24px");

    //JS conversion
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Select1", "Widgets");
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
      .GetWidgetCSSFrAttribute(widgetLocators.selectWidgetLabel, "color")
      .then((color) => {
        deployMode.DeployApp(
          locators._widgetInDeployed(draggableWidgets.SELECT),
        );
        agHelper.AssertCSS(widgetLocators.selectWidgetLabel, "color", color);
        agHelper.AssertCSS(
          widgetLocators.selectWidgetLabel,
          "font-size",
          "20px",
        );
        agHelper.AssertCSS(
          widgetLocators.selectWidgetLabel,
          "font-style",
          "italic",
        );
      });
    agHelper.AssertCSS(
      widgetLocators.selectWidgetBtn,
      "box-shadow",
      "rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px",
    );
    agHelper.AssertCSS(widgetLocators.selectWidgetBtn, "border-radius", "16px");
  });

  it("9. Validate Validation required property", function () {
    deployMode.NavigateBacktoEditor();
    entityExplorer.DragNDropWidget(draggableWidgets.FORM, 300, 400);
    entityExplorer.DragNDropWidget(draggableWidgets.SELECT, 200, 500);
    entityExplorer.SelectEntityByName("Select2", "Widgets");
    agHelper.AssertExistingToggleState("Required", "false");
    propPane.TogglePropertyState("Required", "On");
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.FORM));
    agHelper.GetNClick(widgetLocators.selectWidgetClear, 1);
    agHelper.AssertCSS(
      widgetLocators.selectWidgetBtn,
      "border-color",
      "rgb(217, 25, 33)",
      1,
    );
  });

  it("10. Validate Server side filtering", () => {
    //Create postgres datasource
    deployMode.NavigateBacktoEditor();
    dataSources.CreateDataSource("Postgres");
    dataSources.CreateQueryAfterDSSaved(
      "SELECT * FROM public.astronauts {{this.params.filterText ? `WHERE name LIKE '%${this.params.filterText}%'` : ''}} LIMIT 10;",
    );
    dataSources.ToggleUsePreparedStatement(false);
    dataSources.RunQuery();

    //Bind it to select widget
    entityExplorer.SelectEntityByName("Select1", "Widgets");
    propPane.TogglePropertyState("Server side filtering", "On");
    propPane.ToggleJSMode("Server side filtering", true);
    propPane
      .EvaluateExistingPropertyFieldValue("Server side filtering")
      .then((val: any) => {
        expect(val).to.eq("true");
      });
    propPane.ToggleJSMode("Server side filtering", false);
    propPane.EnterJSContext(
      "Source Data",
      `
    {{Query1.data.map((d) => ({
      name: d.name,
      code: d.name
    }))}}
  `,
      true,
    );
    propPane.EnterJSContext(
      "onFilterUpdate",
      `
  {{Query1.run({filterText: Select1.filterText})}}
`,
      true,
    );
    propPane.ToggleJSMode("onFilterUpdate", false);
    propPane.SelectPlatformFunction("onFilterUpdate", "Show alert");
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Message"),
      "Value changed!",
    );
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.SELECT));

    //Validate filtered data
    agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.SELECT));
    agHelper.TypeText(widgetLocators.selectWidgetFilter, "Anil");
    agHelper.AssertElementVisibility(
      locators._selectOptionValue("Anil Menon"),
      true,
    );
    agHelper.GetNClick(locators._selectOptionValue("Anil Menon"));
    agHelper.ValidateToastMessage("Value changed!");
    agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
      expect($selectedValue).to.eq("Anil Menon");
    });
  });

  it("11. Validate renaming, duplication(copy, paste) & deletion of select widget", function () {
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Select1", "Widgets");
    //Rename widget
    propPane.RenameWidget("Select1", "Select_Widget");
    agHelper.AssertContains(
      "Select_Widget",
      "be.visible",
      widgetLocators.widgetNameTag,
    );
    agHelper.GetNClick(locators._widgetInCanvas(draggableWidgets.SELECT));

    //Duplicate with hotkeys
    entityExplorer.CopyPasteWidget("Select_Widget");
    agHelper.ValidateToastMessage("Copied Select_Widget");
    agHelper.AssertContains(
      "Select_WidgetCopy",
      "be.visible",
      widgetLocators.widgetNameTag,
    );
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.SELECT));
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.SELECT))
      .should("have.length", 3);
    deployMode.NavigateBacktoEditor();

    //Duplicate from property pane
    entityExplorer.SelectEntityByName("Select_WidgetCopy", "Widgets");
    propPane.CopyPasteWidgetFromPropertyPane("Select_WidgetCopy");
    agHelper.ValidateToastMessage("Copied Select_WidgetCopy");
    agHelper.AssertContains(
      "Select_WidgetCopyCopy",
      "be.visible",
      widgetLocators.widgetNameTag,
    );
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.SELECT));
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.SELECT))
      .should("have.length", 4);
    deployMode.NavigateBacktoEditor();

    //Delete widget from property pane
    propPane.DeleteWidgetFromPropertyPane("Select_WidgetCopyCopy");

    //Delete widget using hotkeys
    entityExplorer.SelectEntityByName("Select_WidgetCopy", "Widgets");
    agHelper.PressDelete();
    agHelper.AssertContains(
      "Select_WidgetCopyCopy",
      "not.exist",
      widgetLocators.widgetNameTag,
    );
    agHelper.AssertContains(
      "Select_WidgetCopy",
      "not.exist",
      widgetLocators.widgetNameTag,
    );
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.SELECT));
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.SELECT))
      .should("have.length", 2);
  });
});
