const explorer = require("../../../../../locators/explorerlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const publish = require("../../../../../locators/publishWidgetspage.json");

const widgetName = "codescannerwidget";

describe("Code Scanner widget", () => {
  it("1. Drag & drop Code Scanner/Text widgets", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas(widgetName, { x: 300, y: 300 });
    cy.get(widgetsPage.codescannerwidget).should("exist");
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(".t--property-control-text", `{{CodeScanner1.value}}`);
  });

  it("2. Code Scanner functionality to check disabled widget", function() {
    cy.openPropertyPane(widgetName);
    cy.togglebar(commonlocators.disableCheckbox);
    cy.PublishtheApp();
    cy.get(publish.codescannerwidget + " " + "button").should("be.disabled");
    cy.get(publish.backToEditor).click();
  });

  it("3. Code Scanner functionality to check enabled widget", function() {
    cy.openPropertyPane(widgetName);
    cy.togglebarDisable(commonlocators.disableCheckbox);
    cy.PublishtheApp();
    cy.get(publish.codescannerwidget + " " + "button").should("be.enabled");
    cy.get(publish.backToEditor).click();
  });

  it("4. Code Scanner functionality to uncheck visible widget", function() {
    cy.openPropertyPane(widgetName);
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.codescannerwidget + " " + "button").should("not.exist");
    cy.get(publish.backToEditor).click();
  });

  it("5. Code Scanner functionality to check visible widget", function() {
    cy.openPropertyPane(widgetName);
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.codescannerwidget + " " + "button").should("be.visible");
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
