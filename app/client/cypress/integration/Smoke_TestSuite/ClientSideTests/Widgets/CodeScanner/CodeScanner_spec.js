const explorer = require("../../../../../locators/explorerlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const publish = require("../../../../../locators/publishWidgetspage.json");

const widgetName = "codescannerwidget";
const codeScannerVideoOnPublishPage = `${publish.codescannerwidget} ${commonlocators.codeScannerVideo}`;
const codeScannerDisabledSVGIconOnPublishPage = `${publish.codescannerwidget} ${commonlocators.codeScannerDisabledSVGIcon}`;

describe("Code Scanner widget", () => {
  it("1. Drag & drop Code Scanner widget", () => {
    // Drop the widget
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas(widgetName, { x: 300, y: 100 });

    // Widget should be on the canvas
    cy.get(widgetsPage.codescannerwidget).should("exist");

    // Drop a text widget to test the code scanner value binding
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 600 });
    cy.openPropertyPane("textwidget");
    cy.moveToContentTab();
    cy.updateCodeInput(
      ".t--property-control-text",
      `CodeScanner Value - {{CodeScanner1.value}}`,
    );

    cy.wait(200);

    // Value will be undefined initially
    cy.get(commonlocators.TextInside).should(
      "have.text",
      `CodeScanner Value - undefined`,
    );
  });

  it("2. Check if default scanner layout is ALWAYS_ON", () => {
    // Update the text widget to check the value of scanner layout
    cy.openPropertyPane("textwidget");
    cy.moveToContentTab();
    cy.updateCodeInput(
      ".t--property-control-text",
      `{{CodeScanner1.scannerLayout}}`,
    );

    cy.wait(200);

    // Check the value of scanner layout
    cy.get(commonlocators.TextInside).should("have.text", "ALWAYS_ON");
  });

  it("3. Check if the ALWAYS_ON scanner is DISABLED and (1) IS showing disabled icon (2) NOT streaming video ", function() {
    cy.openPropertyPane(widgetName);
    cy.moveToContentTab();

    // Disable and publish
    cy.togglebar(commonlocators.disableCheckbox);
    cy.PublishtheApp();

    // Video should NOT be streaming
    cy.get(codeScannerVideoOnPublishPage).should("not.exist");

    // Disabled icon should be there
    cy.get(codeScannerDisabledSVGIconOnPublishPage).should("exist");

    // Back to editor
    cy.get(publish.backToEditor).click();
  });

  it("4. Check if the ALWAYS_ON scanner is ENABLED and (1) NOT showing disabled icon (2) IS streaming video", () => {
    cy.openPropertyPane(widgetName);
    cy.moveToContentTab();

    // Enable and publish
    cy.togglebarDisable(commonlocators.disableCheckbox);
    cy.PublishtheApp();

    // Video should be streaming
    cy.get(codeScannerVideoOnPublishPage).should("exist");

    // Disabled icon should NOT be visible
    cy.get(codeScannerDisabledSVGIconOnPublishPage).should("not.exist");

    // Back to editor
    cy.get(publish.backToEditor).click();
  });

  it("5. Check if the ALWAYS_ON scanner is (1) NOT visible (2) NOT streaming video", function() {
    cy.openPropertyPane(widgetName);
    cy.moveToContentTab();

    // Visibilty OFF and publish
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();

    // Video should NOT be streaming
    cy.get(codeScannerVideoOnPublishPage).should("not.exist");

    // Back to editor
    cy.get(publish.backToEditor).click();
  });

  it("6. Check if the ALWAYS_ON scanner (1) IS visible (2) IS streaming video", function() {
    cy.openPropertyPane(widgetName);
    cy.moveToContentTab();

    // Visibilty ON and publish
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();

    // Video should be streaming
    cy.get(codeScannerVideoOnPublishPage).should("be.visible");

    // Back to editor
    cy.get(publish.backToEditor).click();
  });

  it("7. Change scanner layout from ALWAYS_ON to CLICK_TO_SCAN and verify layout change", function() {
    cy.openPropertyPane(widgetName);
    cy.moveToContentTab();

    // Select scanner layout as CLICK_TO_SCAN
    cy.get(
      `${commonlocators.codeScannerScannerLayout} .t--button-tab-CLICK_TO_SCAN`,
    )
      .last()
      .click({
        force: true,
      });

    cy.wait(200);

    // Check if previously dropped text widget with value {{CodeScanner1.scannerLayout}} is updated
    cy.get(commonlocators.TextInside).should("have.text", "CLICK_TO_SCAN");

    // Publish
    cy.PublishtheApp();

    // Check if a button is added to the canvas
    cy.get(publish.codescannerwidget + " " + "button").should("be.visible");
    cy.get(publish.codescannerwidget + " " + "button").should("be.enabled");

    // and video should not be streaming
    cy.get(codeScannerVideoOnPublishPage).should("not.exist");

    // Back to editor
    cy.get(publish.backToEditor).click();
  });

  it("8. Check if the CLICK_TO_SCAN scanner's button is DISABLED", function() {
    cy.openPropertyPane(widgetName);
    cy.moveToContentTab();

    // Disable and publish
    cy.togglebar(commonlocators.disableCheckbox);
    cy.PublishtheApp();

    // Button should be disabled
    cy.get(publish.codescannerwidget + " " + "button").should("be.disabled");

    // Back to editor
    cy.get(publish.backToEditor).click();
  });

  it("9. Check if the CLICK_TO_SCAN scanner's button is ENABLED", function() {
    cy.openPropertyPane(widgetName);
    cy.moveToContentTab();

    // Enable and publish
    cy.togglebarDisable(commonlocators.disableCheckbox);
    cy.PublishtheApp();

    // Button should be enabled
    cy.get(publish.codescannerwidget + " " + "button").should("be.enabled");

    // Back to editor
    cy.get(publish.backToEditor).click();
  });

  it("10. Check if the CLICK_TO_SCAN scanner's button is NOT visible", function() {
    cy.openPropertyPane(widgetName);
    cy.moveToContentTab();

    // Visibilty OFF and publish
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();

    // Button should NOT be visible
    cy.get(publish.codescannerwidget + " " + "button").should("not.exist");

    // Back to editor
    cy.get(publish.backToEditor).click();
  });

  it("11. Check if the CLICK_TO_SCAN scanner's button is IS visible", function() {
    cy.openPropertyPane(widgetName);
    cy.moveToContentTab();

    // Visibilty ON and publish
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();

    // Button should be visible
    cy.get(publish.codescannerwidget + " " + "button").should("be.visible");

    // Back to editor
    cy.get(publish.backToEditor).click();
  });

  // Disabling this test for now.
  // Check out - https://github.com/appsmithorg/appsmith/pull/15990#issuecomment-1241598309
  // it("6. Open the Code Scanner modal and Scan a QR using fake webcam video.", function() {
  //   // Open
  //   cy.get(widgetsPage.codescannerwidget).click();
  //   //eslint-disable-next-line cypress/no-unnecessary-waiting
  //   cy.wait(2000);
  //   // Check if the QR code was read
  //   cy.get(".t--widget-textwidget").should(
  //     "contain",
  //     "Hello Cypress, this is from Appsmith!",
  //   );
  // });
});
