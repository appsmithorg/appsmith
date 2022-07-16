const explorer = require("../../../../../locators/explorerlocators.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

const widgetName = "filepickerwidgetv2";

describe("File picker widget v2", () => {
  it("1. Drag & drop FilePicker/Text widgets", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas(widgetName, { x: 300, y: 300 });
    cy.get(`.t--widget-${widgetName}`).should("exist");
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(".t--property-control-text", `{{FilePicker1.isDirty}}`);
  });

  it("Check isDirty meta property", function() {
    // Check if initial value of isDirty is false
    cy.get(".t--widget-textwidget").should("contain", "false");
    // Upload a new file
    cy.get(`.t--widget-${widgetName}`).click();
    cy.get(commonlocators.filePickerInput)
      .first()
      .attachFile("testFile.mov");
    cy.get(commonlocators.filePickerUploadButton).click();
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    // Check if isDirty is set to true
    cy.get(".t--widget-textwidget").should("contain", "true");
  });

  it("Check if the uploaded data retains when shifting to query page", () => {
    cy.createAndFillApi("{{FilePicker1.files[0]}}", "");
    cy.get(".t--more-action-menu")
      .first()
      .click({ force: true });
    cy.get(explorer.widgetSwitchId).click();
    cy.get(`.t--widget-${widgetName}`).should("contain", "1 files selected");
  });
});
