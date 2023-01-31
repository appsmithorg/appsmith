const explorer = require("../../../../../locators/explorerlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const widgetName = "codescannerwidget";
const codeScannerVideoOnPublishPage = `${publish.codescannerwidget} ${commonlocators.codeScannerVideo}`;
const codeScannerDisabledSVGIconOnPublishPage = `${publish.codescannerwidget} ${commonlocators.codeScannerDisabledSVGIcon}`;

describe("Code Scanner widget's functionality", () => {
  it("1 => Check if code scanner widget can be dropped on the canvas", () => {
    // Drop the widget
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas(widgetName, { x: 300, y: 100 });

    // Widget should be on the canvas
    cy.get(widgetsPage.codescannerwidget).should("exist");
  });

  it("2 => Check if the default scanner layout is ALWAYS_ON", () => {
    // Drop a text widget to test the code scanner value binding
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 600 });
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

  describe("3 => Checks for the 'Always On' Scanner Layout", () => {
    describe("3.1 => Checks for the disabled property", () => {
      describe("3.1.1 => Check if the scanner can be disabled", () => {
        it("3.1.1.1 => Disabled icon should be visible", () => {
          cy.openPropertyPane(widgetName);
          cy.moveToContentTab();

          // Disable and publish
          cy.togglebar(commonlocators.disableCheckbox);
          cy.PublishtheApp();

          // Disabled icon should be there
          cy.get(codeScannerDisabledSVGIconOnPublishPage).should("exist");
        });

        it("3.1.1.2 => Scanner should not be scanning and streaming video", () => {
          // Video should NOT be streaming
          cy.get(codeScannerVideoOnPublishPage).should("not.exist");

          // Back to editor
          cy.get(publish.backToEditor).click();
        });
      });

      describe("3.1.2 => Check if the scanner can be enabled", () => {
        it("3.1.2.1 => Disabled icon should not be visible", () => {
          cy.openPropertyPane(widgetName);
          cy.moveToContentTab();

          // Enable and publish
          cy.togglebarDisable(commonlocators.disableCheckbox);
          cy.PublishtheApp();

          // Disabled icon should NOT be visible
          cy.get(codeScannerDisabledSVGIconOnPublishPage).should("not.exist");
        });

        it("3.1.2.2 => Should be scanning and streaming video", () => {
          // Video should be streaming
          cy.get(codeScannerVideoOnPublishPage).should("exist");

          // Back to editor
          cy.get(publish.backToEditor).click();
        });
      });
    });

    describe("3.2 => Checks for the visible property", () => {
      it("3.2.1 => Widget should be invisible on the canvas", () => {
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

      it("3.2.2 => Widget should be visible on the canvas", () => {
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
    });
  });

  describe("4 => Checks for 'Click to Scan' Scanner Layout", () => {
    it("4.1 => Check if scanner layout can be changed from Always On to Click to Scan", () => {
      cy.openPropertyPane(widgetName);
      cy.moveToContentTab();

      // Select scanner layout as CLICK_TO_SCAN
      cy.get(
        `${commonlocators.codeScannerScannerLayout} .t--button-group-CLICK_TO_SCAN`,
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

    describe("4.2 => Checks for the disabled property", () => {
      it("4.2.1 => Button on the canvas should be disabled", () => {
        cy.openPropertyPane(widgetName);
        cy.moveToContentTab();

        // Disable and publish
        cy.togglebar(commonlocators.disableCheckbox);
        cy.PublishtheApp();

        // Button should be disabled
        cy.get(publish.codescannerwidget + " " + "button").should(
          "be.disabled",
        );

        // Back to editor
        cy.get(publish.backToEditor).click();
      });

      it("4.2.2 => Button on the canvas should be enabled again", () => {
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
    });

    describe("4.3 => Checks for the visible property", () => {
      it("4.3.1 => Button on the canvas should be invisible", () => {
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

      it("4.3.2 => Button on the canvas should be visible again", () => {
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
    });
  });
});

// Disabling this test for now.
// Check out - https://github.com/appsmithorg/appsmith/pull/15990#issuecomment-1241598309
// it("6. Open the Code Scanner modal and Scan a QR using fake webcam video.", () => {
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
