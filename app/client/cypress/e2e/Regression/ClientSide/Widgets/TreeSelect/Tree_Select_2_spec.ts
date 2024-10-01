import {
  agHelper,
  locators,
  deployMode,
  entityExplorer,
  propPane,
  apiPage,
  dataSources,
  draggableWidgets,
  assertHelper,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Tree Select widget Tests",
  { tags: ["@tag.Widget", "@tag.Select"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify("formwidget", 500, 100);
      entityExplorer.DragDropWidgetNVerify("singleselecttreewidget", 350, 300);
      entityExplorer.DragDropWidgetNVerify("buttonwidget", 450, 350);
    });

    let options = `[
        {
          "label": "Blue",
          "value": "BLUE",
          "children": [
            {
              "label": "Dark Blue",
              "value": "DARK BLUE"
            },
            {
              "label": "Light Blue",
              "value": "LIGHT BLUE"
            }
          ]
        },
        {
          "label": "Green",
          "value": "GREEN"
        },
        {
          "label": "Red",
          "value": "RED"
        }
      ]`;

    it("1. Verify required field", function () {
      EditorNavigation.SelectEntityByName(
        "TreeSelect1",
        EntityType.Widget,
        {},
        ["Form1"],
      );
      propPane.TogglePropertyState("required", "On");
      propPane.UpdatePropertyFieldValue("Default selected value", "");
      agHelper.AssertElementEnabledDisabled(locators._buttonInDeployedMode, 1);
      // Binding with Button
      propPane.ToggleJSMode("required", true);
      propPane.UpdatePropertyFieldValue(
        "Required",
        "{{Button3.isDisabled?false:true}}",
      );
      EditorNavigation.SelectEntityByName("Button3", EntityType.Widget);
      propPane.TogglePropertyState("disabled", "On");
      agHelper.AssertElementEnabledDisabled(
        locators._buttonInDeployedMode,
        1,
        false,
      );
      propPane.TogglePropertyState("disabled", "Off");
      agHelper.AssertElementEnabledDisabled(
        locators._buttonInDeployedMode,
        1,
        true,
      );
    });

    it("2. Verify placeholder", function () {
      EditorNavigation.SelectEntityByName(
        "TreeSelect1",
        EntityType.Widget,
        {},
        ["Form1"],
      );
      propPane.UpdatePropertyFieldValue("Options", "");
      propPane.UpdatePropertyFieldValue("Placeholder", "Select new option");
      agHelper.AssertText(
        locators._treeSelectPlaceholder,
        "text",
        "Select new option",
      );
      // Binding with Text widget
      entityExplorer.DragDropWidgetNVerify("textwidget", 550, 500);
      propPane.UpdatePropertyFieldValue("Text", "Select value");
      EditorNavigation.SelectEntityByName(
        "TreeSelect1",
        EntityType.Widget,
        {},
        ["Form1"],
      );
      propPane.UpdatePropertyFieldValue("Placeholder", "{{Text2.text}}");
      agHelper.AssertText(
        locators._treeSelectPlaceholder,
        "text",
        "Select value",
      );
    });

    it("3. Verify expand all by default", function () {
      propPane.UpdatePropertyFieldValue("Options", options);
      propPane.TogglePropertyState("expandallbydefault", "On");
      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.TREESELECT),
      );
      agHelper.AssertElementExist(
        locators._dropDownMultiTreeValue("Dark Blue"),
      );
    });

    it("4. Verify Full color picker and font size", () => {
      // Verify font color picker opens up
      propPane.MoveToTab("Style");
      agHelper.GetNClick(propPane._propertyControlColorPicker("fontcolor"));
      agHelper.AssertElementVisibility(propPane._colorPickerV2Color);
      // Verify full color picker
      agHelper.AssertAttribute(propPane._colorPickerInput, "type", "text", 0);
      propPane.TogglePropertyState("fontcolor", "On", "");
      agHelper.AssertAttribute(propPane._colorPickerInput, "type", "color", 0);
      // Font size
      propPane.SelectPropertiesDropDown("fontsize", "L");
      propPane.AssertPropertiesDropDownCurrentValue("fontsize", "L");
      propPane.ToggleJSMode("fontsize", true);
      propPane.UpdatePropertyFieldValue("Font size", "1rem");
      propPane.ToggleJSMode("fontsize", false);
      propPane.AssertPropertiesDropDownCurrentValue("fontsize", "M");
      // Verify Emphasis
      agHelper.GetNClick(propPane._emphasisSelector("BOLD"));
      agHelper.AssertAttribute(locators._label, "font-style", "BOLD");
      agHelper.GetNClick(propPane._emphasisSelector("BOLD"));
      propPane.ToggleJSMode("emphasis", true);
      propPane.UpdatePropertyFieldValue("Emphasis", "ITALIC");
      agHelper.AssertAttribute(locators._label, "font-style", "ITALIC");

      // Preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.AssertAttribute(locators._label, "font-style", "ITALIC");
      agHelper.GetNClick(locators._exitPreviewMode);

      // Deploy mode
      deployMode.DeployApp();
      agHelper.AssertAttribute(locators._label, "font-style", "ITALIC");
      deployMode.NavigateBacktoEditor();

      // entityExplorer.SelectEntityByName("Form1");
      EditorNavigation.SelectEntityByName(
        "TreeSelect1",
        EntityType.Widget,
        {},
        ["Form1"],
      );
      propPane.MoveToTab("Style");

      // Verify border
      agHelper.GetNClick(propPane._segmentedControl("0px"));
      agHelper.AssertCSS(".rc-tree-select", "border-radius", "0px");
    });

    it("5. Verify Api binding", () => {
      apiPage.CreateAndFillApi(
        "http://host.docker.internal:5001/v1/dynamicrecords/getrecordsArray",
      );
      apiPage.RunAPI();
      EditorNavigation.SelectEntityByName(
        "TreeSelect1",
        EntityType.Widget,
        {},
        ["Form1"],
      );
      propPane.MoveToTab("Content");
      propPane.UpdatePropertyFieldValue(
        "Options",
        `{{JSON.parse(Api1.data).map((item) => {return {"label":item.value, "value":item.abbr};})}}`,
      );
      agHelper.GetNClick(
        `${locators._widgetInDeployed("singleselecttreewidget")}`,
      );
      agHelper.AssertElementExist(locators._treeSelectTitle);
    });

    it("6. Verify onOptionChange with query", () => {
      entityExplorer.DragDropWidgetNVerify("checkboxwidget", 300, 600);
      entityExplorer.DragDropWidgetNVerify("inputwidgetv2", 500, 700);
      entityExplorer.DragDropWidgetNVerify("iframewidget", 550, 800);
      // Execute the query
      let postgresDatasourceName: any;
      dataSources.StartDataSourceRoutes();
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("PostgreSQL");
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        postgresDatasourceName = uid;
        agHelper.GetNClick(locators._dsName);
        agHelper.TypeText(locators._dsNameTxt, postgresDatasourceName);
        dataSources.FillPostgresDSForm();
        dataSources.SaveDatasource();
        dataSources.CreateQueryAfterDSSaved();
      });
      dataSources.RunQuery();

      EditorNavigation.SelectEntityByName(
        "TreeSelect1",
        EntityType.Widget,
        {},
        ["Form1"],
      );
      propPane.UpdatePropertyFieldValue("Options", options);
      propPane.SelectPlatformFunction("onOptionChange", "Execute a query");
      agHelper.GetNClick(`${locators._dropDownValue("Query1")}`, 0, true);
      agHelper.GetNClick(locators._callbackAddBtn, 0, true);
      agHelper.GetNClick(locators._dropDownValue("Show alert"));
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Success",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      deployMode.DeployApp();
      agHelper.GetNClick(
        `${locators._widgetInDeployed("singleselecttreewidget")}`,
      );
      agHelper.GetNClick(locators._dropDownMultiTreeValue("Green"));
      agHelper.ValidateToastMessage("Success");
    });

    it("7. Verify onOptionChange with Navigate To", () => {
      deployMode.NavigateBacktoEditor();
      // Navigate To
      EditorNavigation.SelectEntityByName("Form1", EntityType.Widget);
      EditorNavigation.SelectEntityByName(
        "TreeSelect1",
        EntityType.Widget,
        {},
        ["Form1"],
      );
      propPane.ToggleJSMode("onOptionChange", true);
      propPane.UpdatePropertyFieldValue(
        "onOptionChange",
        "{{navigateTo('www.google.com', {}, 'NEW_WINDOW');}}",
      );
      deployMode.DeployApp();
      agHelper.GetNClick(
        `${locators._widgetInDeployed("singleselecttreewidget")}`,
      );

      cy.window().then((win) => {
        // Stub `window.open` to prevent new tabs
        cy.stub(win, "open").as("windowOpenStub");
        agHelper
          .GetElement(locators._dropDownMultiTreeValue("Red"))
          .then(($link) => {
            cy.wrap($link).click();
            cy.get("@windowOpenStub").should("have.been.called");
          });
      });
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Form1", EntityType.Widget);
      EditorNavigation.SelectEntityByName(
        "TreeSelect1",
        EntityType.Widget,
        {},
        ["Form1"],
      );
    });

    it("8. Verify onOptionChange with Alert", () => {
      // Alert
      EditorNavigation.SelectEntityByName("Form1", EntityType.Widget);
      EditorNavigation.SelectEntityByName(
        "TreeSelect1",
        EntityType.Widget,
        {},
        ["Form1"],
      );
      propPane.ToggleJSMode("onOptionChange", true);
      propPane.UpdatePropertyFieldValue(
        "onOptionChange",
        "{{showAlert('Option Changed', '');}}",
      );
      deployMode.DeployApp();
      agHelper.GetNClick(
        `${locators._widgetInDeployed("singleselecttreewidget")}`,
      );
      agHelper.GetNClick(locators._dropDownMultiTreeValue("Green"));
      agHelper.ValidateToastMessage("Option Changed");
    });

    it("9. Verify onOptionChange with download", () => {
      deployMode.NavigateBacktoEditor();
      // Download
      EditorNavigation.SelectEntityByName("Form1", EntityType.Widget);
      EditorNavigation.SelectEntityByName(
        "TreeSelect1",
        EntityType.Widget,
        {},
        ["Form1"],
      );
      propPane.ToggleJSMode("onOptionChange", true);
      propPane.UpdatePropertyFieldValue(
        "onOptionChange",
        `{{download('http://host.docker.internal:4200/photo-1503469432756-4aae2e18d881.jpeg', 'flower.svg', 'image/svg+xml').then(() => {
            showAlert('Download Success', '');
          });}}`,
      );
      agHelper.GetNClick(
        `${locators._widgetInDeployed("singleselecttreewidget")}`,
      );
      agHelper.GetNClick(locators._dropDownMultiTreeValue("Red"));
      agHelper.ValidateToastMessage("Download Success");
    });

    it("10. Verify onOptionChange with Reset", () => {
      // Reset Widget
      EditorNavigation.SelectEntityByName("Form1", EntityType.Widget);
      EditorNavigation.SelectEntityByName(
        "TreeSelect1",
        EntityType.Widget,
        {},
        ["Form1"],
      );
      propPane.ToggleJSMode("onOptionChange", true);
      propPane.UpdatePropertyFieldValue(
        "onOptionChange",
        '{{resetWidget("Checkbox1", true);}}',
      );
      deployMode.DeployApp();
      agHelper.GetNClick(`${locators._widgetInDeployed("checkbox1")}`);
      agHelper.AssertExistingCheckedState(
        locators._checkboxInDeployedMode,
        "false",
      );
      agHelper.GetNClick(
        `${locators._widgetInDeployed("singleselecttreewidget")}`,
      );
      agHelper.GetNClick(locators._dropDownMultiTreeValue("Green"));
      agHelper.AssertExistingCheckedState(locators._checkboxInDeployedMode);
    });

    it("11. Verify onOptionChange with Modal", () => {
      deployMode.NavigateBacktoEditor();
      // Modal
      EditorNavigation.SelectEntityByName("Form1", EntityType.Widget);
      EditorNavigation.SelectEntityByName(
        "TreeSelect1",
        EntityType.Widget,
        {},
        ["Form1"],
      );
      propPane.ToggleJSMode("onOptionChange", false);
      propPane.SelectPlatformFunction("onOptionChange", "Show modal");
      agHelper.GetNClick(propPane._actionOpenDropdownSelectModal);
      agHelper.GetNClick(propPane._createModalButton);
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.GetNClick(locators._closeModal, 0, true);
      deployMode.DeployApp();
      agHelper.GetNClick(
        `${locators._widgetInDeployed("singleselecttreewidget")}`,
      );
      agHelper.GetNClick(locators._dropDownMultiTreeValue("Red"));
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.GetNClick(locators._closeModal, 0, true);
      agHelper.Sleep(3000);
      agHelper.AssertElementAbsence(locators._modal);
    });

    it("12. Verify onOptionChange with iframe", () => {
      deployMode.NavigateBacktoEditor();
      // Postmessage on iframe
      EditorNavigation.SelectEntityByName("Iframe1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "srcDoc",
        `<div id="target"></div>

            <script>
            window.addEventListener('message', (event) => {
                const tgt = document.querySelector("#target")
                    tgt.textContent = event.data
                });
            </script>`,
      );
      EditorNavigation.SelectEntityByName("Form1", EntityType.Widget);
      EditorNavigation.SelectEntityByName(
        "TreeSelect1",
        EntityType.Widget,
        {},
        ["Form1"],
      );
      propPane.ToggleJSMode("onOptionChange", true);
      propPane.UpdatePropertyFieldValue(
        "onOptionChange",
        `{{postWindowMessage('Test', 'Iframe1', "*");}}`,
      );
      deployMode.DeployApp();
      agHelper.GetNClick(
        `${locators._widgetInDeployed("singleselecttreewidget")}`,
      );
      agHelper.GetNClick(locators._dropDownMultiTreeValue("Green"));

      agHelper.GetElement('iframe[id="iframe-Iframe1"]').then(($iframe) => {
        const iframe = $iframe.contents();

        cy.wrap(iframe).find("#target").should("have.text", "Test");
      });
    });
  },
);
