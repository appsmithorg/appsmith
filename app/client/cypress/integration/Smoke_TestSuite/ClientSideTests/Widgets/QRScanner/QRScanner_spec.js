const explorer = require("../../../../../locators/explorerlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const publish = require("../../../../../locators/publishWidgetspage.json");

const widgetName = "qrscannerwidget";

describe("QR Scanner widget", () => {
  it("1. Drag & drop QR Scanner/Text widgets", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas(widgetName, { x: 300, y: 300 });
    cy.get(widgetsPage.qrscannerwidget).should("exist");
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(".t--property-control-text", `{{QRScanner1.value}}`);
  });

  it("2. QR Scanner functionality to check disabled widget", function() {
    cy.openPropertyPane(widgetName);
    cy.togglebar(commonlocators.disableCheckbox);
    cy.PublishtheApp();
    cy.get(publish.qrscannerwidget + " " + "button").should("be.disabled");
    cy.get(publish.backToEditor).click();
  });

  it("3. QR Scanner functionality to check enabled widget", function() {
    cy.openPropertyPane(widgetName);
    cy.togglebarDisable(commonlocators.disableCheckbox);
    cy.PublishtheApp();
    cy.get(publish.qrscannerwidget + " " + "button").should("be.enabled");
    cy.get(publish.backToEditor).click();
  });

  it("4. QR Scanner functionality to uncheck visible widget", function() {
    cy.openPropertyPane(widgetName);
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.qrscannerwidget + " " + "button").should("not.exist");
    cy.get(publish.backToEditor).click();
  });

  it("5. QR Scanner functionality to check visible widget", function() {
    cy.openPropertyPane(widgetName);
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.qrscannerwidget + " " + "button").should("be.visible");
    cy.get(publish.backToEditor).click();
  });
});
