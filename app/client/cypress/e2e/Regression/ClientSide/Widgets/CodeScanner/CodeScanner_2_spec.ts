import widgetLocators from "../../../../../locators/Widgets.json";
import {
  agHelper,
  assertHelper,
  deployMode,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe("Code scanner widget tests", () => {
  it("1. Verify properties in Always scan mode", () => {
    entityExplorer.DragNDropWidget(draggableWidgets.CODESCANNER);
    agHelper
      .GetElement(propPane._mode("Always on"))
      .should("have.attr", "data-selected", "true");
    agHelper.AssertExistingToggleState("Visible", "true");
    propPane.EnterJSContext("Visible", "{{(55>45)?false:true}}", true, true);
    propPane.ToggleJSMode("Visible", false);
    deployMode.DeployApp();
    agHelper.AssertElementAbsence(
      locators._widgetInDeployed(draggableWidgets.CODESCANNER),
    );
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("CodeScanner1");
    propPane.EnterJSContext("Visible", "", false);
    propPane.ToggleJSMode("Visible", false);
    propPane.TogglePropertyState("Visible", "On");

    agHelper.AssertExistingToggleState("Disabled", "false");
    propPane.ToggleJSMode("Disabled", true);
    propPane.EnterJSContext("Disabled", "{{(45>55)?false:true}}", true, true);
    agHelper
      .GetElement(widgetLocators.codeScannerScreen)
      .should("have.attr", "disabled");
    deployMode.DeployApp();
    agHelper.AssertElementAbsence(widgetLocators.codeScannerVideo);
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("CodeScanner1");
    propPane.EnterJSContext("Disabled", "", false);
    propPane.ToggleJSMode("Disabled", false);
    propPane.TogglePropertyState("Disabled", "Off");

    agHelper.AssertExistingToggleState("animateloading", "true");
    propPane.ToggleJSMode("animateloading", true);
    propPane.EnterJSContext(
      "Animate loading",
      "{{(45>55)?false:true}}",
      true,
      true,
    );
    propPane.ValidatePropertyFieldValue(
      "Animate loading",
      "{{(45>55)?false:true}}",
    );
    propPane.EnterJSContext("Animate loading", "", false);
    propPane.ToggleJSMode("animateloading", false);
    propPane.TogglePropertyState("animateloading", "On");
  });

  it(
    "2 a) Validate onCodeDetected event of Always scan mode\n" +
      "b) Open the Code Scanner modal and Scan a QR using fake webcam video.\n" +
      "c) Verify that the scanned data is correctly displayed on the app's screen",
    () => {
      entityExplorer.DragNDropWidget(draggableWidgets.TEXT, 300, 500);
      propPane.TypeTextIntoField("Text", "{{CodeScanner1.value}}");
      entityExplorer.SelectEntityByName("CodeScanner1");
      propPane.ToggleJSMode("onCodeDetected", true);
      propPane.EnterJSContext(
        "onCodeDetected",
        "{{showAlert('Code scanned successfully!','success')}}",
      );
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.CODESCANNER),
      );
      cy.task("changeVideoSource", "qrCodeVideo.y4m");
      agHelper.RefreshPage("viewPage");
      agHelper.ValidateToastMessage("Code scanned successfully!");
      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.TEXT),
        "text",
        "https://docs.appsmith.com/",
      );
      cy.task("resetVideoSource");
    },
  );

  it("3. Verify properties in Click to Scan mode", () => {
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("CodeScanner1");
    agHelper.GetNClick(propPane._mode("Click to scan"));
    agHelper.AssertExistingToggleState("Visible", "true");
    propPane.EnterJSContext("Visible", "{{(55>45)?false:true}}", true, true);
    propPane.ToggleJSMode("Visible", false);
    deployMode.DeployApp();
    agHelper.AssertElementAbsence(
      locators._widgetInDeployed(draggableWidgets.CODESCANNER),
    );
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("CodeScanner1");
    propPane.EnterJSContext("Visible", "", false);
    propPane.ToggleJSMode("Visible", false);
    propPane.TogglePropertyState("Visible", "On");

    agHelper.AssertExistingToggleState("Disabled", "false");
    propPane.ToggleJSMode("Disabled", true);
    propPane.EnterJSContext("Disabled", "{{(45>55)?false:true}}", true, true);
    deployMode.DeployApp();
    agHelper.AssertElementEnabledDisabled(
      locators._widgetInDeployed(draggableWidgets.CODESCANNER) + " button",
      0,
      true,
    );
    agHelper.AssertElementAbsence(widgetLocators.codeScannerVideo);
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("CodeScanner1");
    propPane.EnterJSContext("Disabled", "", false);
    propPane.ToggleJSMode("Disabled", false);
    propPane.TogglePropertyState("Disabled", "Off");

    agHelper.AssertExistingToggleState("animateloading", "true");
    propPane.ToggleJSMode("animateloading", true);
    propPane.EnterJSContext(
      "Animate loading",
      "{{(45>55)?false:true}}",
      true,
      true,
    );
    propPane.ValidatePropertyFieldValue(
      "Animate loading",
      "{{(45>55)?false:true}}",
    );
    propPane.EnterJSContext("Animate loading", "", false, true);
    propPane.ToggleJSMode("animateloading", false);

    agHelper.AssertElementVisible(widgetLocators.codeScannerScanButton);
    propPane.UpdatePropertyFieldValue("Text", "Scan Code");
    propPane.UpdatePropertyFieldValue("Tooltip", "Code scanner tooltip");

    deployMode.DeployApp(
      locators._widgetInDeployed(draggableWidgets.CODESCANNER),
    );
    agHelper.AssertElementVisible(widgetLocators.codeScannerNewScanButton);
    agHelper
      .GetElement(locators._widgetInDeployed(draggableWidgets.CODESCANNER))
      .trigger("mouseover");
    assertHelper.AssertContains("Code scanner tooltip", "be.visible");
  });

  it(
    "4 a) Validate onCodeDetected event of click to scan mode.\n" +
      "b) Open the Code Scanner modal and Scan a QR using fake webcam video.\n" +
      "c) Verify that the scanned data is correctly displayed on the app's screen",
    () => {
      // deployMode.NavigateBacktoEditor();
      agHelper.VisitNAssert(
        "http://localhost/app/05b5b4e9/page1-64d392bc4dc2916368b2edd4/edit/widgets/4qohopfpe0",
      );
      entityExplorer.SelectEntityByName("CodeScanner1");
      propPane.EnterJSContext("onCodeDetected", "");
      propPane.EnterJSContext(
        "onCodeDetected",
        "{{showAlert('Code scanned using click to scan mode!','success')}}",
      );
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.CODESCANNER),
      );
      cy.task("changeVideoSource", "qrCodeVideo.y4m");
      agHelper.RefreshPage("viewPage");
      agHelper.AssertElementVisible(widgetLocators.codeScannerNewScanButton);
      agHelper.GetNClick(widgetLocators.codeScannerNewScanButton, 0, true);
      agHelper.AssertElementVisible(widgetLocators.codeScannerModal);
      agHelper.ValidateToastMessage("Code scanned using click to scan mode!");
      agHelper.AssertElementAbsence(widgetLocators.codeScannerModal);
      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.TEXT),
        "text",
        "https://docs.appsmith.com/",
      );
      cy.task("resetVideoSource");
    },
  );
});
