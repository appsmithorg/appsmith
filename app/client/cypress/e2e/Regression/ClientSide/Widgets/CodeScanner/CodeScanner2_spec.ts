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
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Code scanner widget tests",
  { tags: ["@tag.Widget", "@tag.Scanner", "@tag.Binding"] },
  () => {
    before(() => {
      //Reset video source to default
      cy.task("resetVideoSource");
    });

    it("1. Verify properties in Always scan mode", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.CODESCANNER);
      agHelper.AssertAttribute(
        propPane._mode("Always on"),
        "data-selected",
        "true",
      );

      //Visible property - JS convertible
      agHelper.AssertExistingToggleState("Visible", "true");
      propPane.EnterJSContext("Visible", "{{(55>45)?false:true}}", true, true);
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed(draggableWidgets.CODESCANNER),
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("CodeScanner1", EntityType.Widget);
      propPane.EnterJSContext("Visible", "", false);
      propPane.ToggleJSMode("Visible", false);
      propPane.TogglePropertyState("Visible", "On");

      //Disabled property - JS convertible
      agHelper.AssertExistingToggleState("Disabled", "false");
      propPane.EnterJSContext("Disabled", "{{(45>55)?false:true}}", true, true);
      agHelper
        .GetElement(widgetLocators.codeScannerScreen)
        .should("have.attr", "disabled");
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(widgetLocators.codeScannerVideo);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("CodeScanner1", EntityType.Widget);
      propPane.EnterJSContext("Disabled", "", false);
      propPane.ToggleJSMode("Disabled", false);
      propPane.TogglePropertyState("Disabled", "Off");

      //Animate loading property - JS convertible
      agHelper.AssertExistingToggleState("Animate loading", "true");
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
      propPane.ToggleJSMode("Animate loading", false);
      propPane.TogglePropertyState("Animate loading", "On");
    });

    it(
      "2 a) Validate onCodeDetected event of Always scan mode\n" +
        "b) Open the Code Scanner modal and Scan a QR using fake webcam video.\n" +
        "c) Verify that the scanned data is correctly displayed on the app's screen",
      () => {
        //Add an action in onCodeDetected event
        entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 300, 500);
        propPane.TypeTextIntoField("Text", "{{CodeScanner1.value}}");
        EditorNavigation.SelectEntityByName("CodeScanner1", EntityType.Widget);
        propPane.EnterJSContext(
          "onCodeDetected",
          "{{showAlert('Code scanned successfully!','success')}}",
          true,
        );
        deployMode.DeployApp(
          locators._widgetInDeployed(draggableWidgets.CODESCANNER),
        );

        //Open the Code Scanner modal and Scan a QR using fake webcam video
        cy.task("changeVideoSource", "qrCodeVideo.y4m");
        agHelper.RefreshPage("getConsolidatedData");
        agHelper.ValidateToastMessage("Code scanned successfully!");

        //Verify that the scanned data is correctly displayed on the app's screen
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
      EditorNavigation.SelectEntityByName("CodeScanner1", EntityType.Widget);
      agHelper.GetNClick(propPane._mode("Click to scan"));

      //Visible property - JS convertible
      agHelper.AssertExistingToggleState("Visible", "true");
      propPane.EnterJSContext("Visible", "{{(55>45)?false:true}}", true, true);
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed(draggableWidgets.CODESCANNER),
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("CodeScanner1", EntityType.Widget);
      propPane.EnterJSContext("Visible", "", false);
      propPane.ToggleJSMode("Visible", false);
      propPane.TogglePropertyState("Visible", "On");

      //Disabled property - JS convertible
      agHelper.AssertExistingToggleState("Disabled", "false");
      propPane.EnterJSContext("Disabled", "{{(45>55)?false:true}}", true, true);
      deployMode.DeployApp();
      agHelper.AssertElementEnabledDisabled(
        locators._widgetInDeployed(draggableWidgets.CODESCANNER) + " button",
        0,
        true,
      );
      agHelper.AssertElementAbsence(widgetLocators.codeScannerVideo);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("CodeScanner1", EntityType.Widget);
      propPane.EnterJSContext("Disabled", "", false);
      propPane.ToggleJSMode("Disabled", false);
      propPane.TogglePropertyState("Disabled", "Off");

      //Animate loading property - JS convertible
      agHelper.AssertExistingToggleState("Animate loading", "true");
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
      propPane.ToggleJSMode("Animate loading", false);

      // Text & tooltip properties
      agHelper.AssertElementVisibility(widgetLocators.codeScannerScanButton);
      propPane.UpdatePropertyFieldValue("Text", "Scan Code");
      propPane.UpdatePropertyFieldValue("Tooltip", "Code scanner tooltip");

      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.CODESCANNER),
      );
      agHelper.AssertElementVisibility(widgetLocators.codeScannerNewScanButton);
      agHelper
        .GetElement(locators._widgetInDeployed(draggableWidgets.CODESCANNER))
        .trigger("mouseover");
      assertHelper.AssertContains("Code scanner tooltip", "be.visible");
    });

    it(
      "4. a) Validate onCodeDetected event of click to scan mode.\n" +
        "b) Open the Code Scanner modal and Scan a Valid QR containing encoded URL using fake webcam video.\n" +
        "c) Verify that the scanned data is correctly displayed on the app's screen",
      () => {
        deployMode.NavigateBacktoEditor();
        EditorNavigation.SelectEntityByName("CodeScanner1", EntityType.Widget);

        //Modify action in onCodeDetected event
        propPane.EnterJSContext("onCodeDetected", "");
        propPane.EnterJSContext(
          "onCodeDetected",
          "{{showAlert('Code scanned using click to scan mode!','success')}}",
        );
        deployMode.DeployApp(
          locators._widgetInDeployed(draggableWidgets.CODESCANNER),
        );

        //Open the Code Scanner modal and Scan a QR using fake webcam video
        cy.task("changeVideoSource", "qrCodeVideo.y4m");
        agHelper.RefreshPage("getConsolidatedData");
        agHelper.AssertElementVisibility(
          widgetLocators.codeScannerNewScanButton,
        );
        agHelper.GetNClick(widgetLocators.codeScannerNewScanButton, 0, true);
        agHelper.AssertElementVisibility(widgetLocators.codeScannerModal);
        agHelper.ValidateToastMessage("Code scanned using click to scan mode!");

        //Verify that the scanned data is correctly displayed on the app's screen
        agHelper.AssertElementAbsence(widgetLocators.codeScannerModal);
        agHelper.AssertText(
          locators._widgetInDeployed(draggableWidgets.TEXT),
          "text",
          "https://docs.appsmith.com/",
        );
      },
    );

    it("5. Validate scanning rotated QR code.", () => {
      //Open the Code Scanner modal and Scan rotated QR code using fake webcam video
      cy.task("changeVideoSource", "rotatedQRCode.y4m");
      agHelper.RefreshPage("getConsolidatedData");
      agHelper.AssertElementVisibility(widgetLocators.codeScannerNewScanButton);
      agHelper.GetNClick(widgetLocators.codeScannerNewScanButton, 0, true);
      agHelper.AssertElementVisibility(widgetLocators.codeScannerModal);
      agHelper.ValidateToastMessage("Code scanned using click to scan mode!");

      //Verify that the scanned data is correctly displayed on the app's screen
      agHelper.AssertElementAbsence(widgetLocators.codeScannerModal);
      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.TEXT),
        "text",
        "http://weibo.com/ljiianhua",
      );
    });

    it("6. Validate scanning invalid QR code.", () => {
      //Open the Code Scanner modal and Scan invalid QR code using fake webcam video
      cy.task("changeVideoSource", "invalidQRCode.y4m");
      agHelper.RefreshPage("getConsolidatedData");
      agHelper.AssertElementVisibility(widgetLocators.codeScannerNewScanButton);
      agHelper.GetNClick(widgetLocators.codeScannerNewScanButton, 0, true);
      agHelper.AssertElementVisibility(widgetLocators.codeScannerModal);
      //give it some time to scan code
      agHelper.Sleep(5000);
      //Verify that the QR code is not scanned
      agHelper.AssertContains(
        "Code scanned using click to scan mode!",
        "not.exist",
      );
      agHelper.AssertElementVisibility(widgetLocators.codeScannerModal);
      agHelper.GetNClick(widgetLocators.codeScannerClose);
    });

    it("7. Validate scanning multiple QR codes.", () => {
      //Open the Code Scanner modal and Scan multiple QR codes using fake webcam video
      cy.task("changeVideoSource", "multipleQRCodes.y4m");
      agHelper.RefreshPage("getConsolidatedData");
      agHelper.AssertElementVisibility(widgetLocators.codeScannerNewScanButton);
      agHelper.GetNClick(widgetLocators.codeScannerNewScanButton, 0, true);
      agHelper.AssertElementVisibility(widgetLocators.codeScannerModal);
      //give it some time to scan code
      agHelper.Sleep(5000);
      //Verify that the QR code is not scanned
      agHelper.AssertContains(
        "Code scanned using click to scan mode!",
        "not.exist",
      );
      agHelper.AssertElementVisibility(widgetLocators.codeScannerModal);
      agHelper.GetNClick(widgetLocators.codeScannerClose);
    });

    //skipping below test as it is not able to scan this code in CI even after 60Sec of wait, works fine in local - Need to be picked later
    // it("8. Validate scanning broken/damaged QR code.", () => {
    //   //Open the Code Scanner modal and Scan broken/damaged QR code using fake webcam video
    //   cy.task("changeVideoSource", "brokenQRCode.y4m");
    //   agHelper.RefreshPage("viewPage");
    //   agHelper.AssertElementVisibility(widgetLocators.codeScannerNewScanButton);
    //   agHelper.GetNClick(widgetLocators.codeScannerNewScanButton, 0, true);
    //   agHelper.AssertElementVisibility(widgetLocators.codeScannerModal);

    //   //Verify that the scanned data is correctly displayed on the app's screen
    //   agHelper.AssertElementAbsence(widgetLocators.codeScannerModal, 60000);
    //   agHelper.ValidateToastMessage("Code scanned using click to scan mode!");
    //   agHelper.AssertText(
    //     locators._widgetInDeployed(draggableWidgets.TEXT),
    //     "text",
    //     "http://en.m.wikipedia.org",
    //   );
    // });

    it("9. Validate scanning high density QR code.", () => {
      //Open the Code Scanner modal and Scan high density QR code using fake webcam video
      cy.task("changeVideoSource", "highDensityQRCode.y4m");
      agHelper.RefreshPage("getConsolidatedData");
      agHelper.AssertElementVisibility(widgetLocators.codeScannerNewScanButton);
      agHelper.GetNClick(widgetLocators.codeScannerNewScanButton, 0, true);
      agHelper.AssertElementVisibility(widgetLocators.codeScannerModal);
      agHelper.ValidateToastMessage("Code scanned using click to scan mode!");

      //Verify that the scanned data is correctly displayed on the app's screen
      agHelper.AssertElementAbsence(widgetLocators.codeScannerModal);
      agHelper.GetNAssertElementText(
        locators._widgetInDeployed(draggableWidgets.TEXT),
        "NL2:B4V.W9D",
        "contain.text",
      );
    });

    after(() => {
      //Reset video source to default
      cy.task("resetVideoSource");
    });
  },
);
