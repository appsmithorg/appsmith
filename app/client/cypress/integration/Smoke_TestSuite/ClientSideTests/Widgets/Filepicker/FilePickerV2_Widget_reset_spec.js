const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/filePickerV2_reset_check_dsl.json");
const Layoutpage = require("../../../../../locators/Layout.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

describe("Checkbox Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check if the uploaded data reset when tab switch in the TabsWidget", () => {
    cy.get(widgetsPage.filepickerwidgetv2).should("contain", "Select Files");
    cy.get(widgetsPage.filepickerwidgetv2).click();
    cy.get(commonlocators.filePickerInput)
      .first()
      .attachFile("testFile.mov");
    cy.get(commonlocators.filePickerUploadButton).click();
    cy.get(widgetsPage.filepickerwidgetv2).should(
      "contain",
      "1 files selected",
    );
    cy.get(Layoutpage.tabWidget)
      .contains("Tab 2")
      .click({ force: true });
    cy.get(Layoutpage.tabWidget)
      .contains("Tab 2")
      .should("have.class", "is-selected");
    cy.get(Layoutpage.tabWidget)
      .contains("Tab 1")
      .click({ force: true });
    cy.get(Layoutpage.tabWidget)
      .contains("Tab 1")
      .should("have.class", "is-selected");
    cy.get(widgetsPage.filepickerwidgetv2).should("contain", "Select Files");
  });
});
