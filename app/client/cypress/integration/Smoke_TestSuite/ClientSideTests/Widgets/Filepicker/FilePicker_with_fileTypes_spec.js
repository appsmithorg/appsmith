const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/filepickerDsl.json");

describe("FilePicker Widget Functionality with different file types", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check file upload of type jpeg", function() {
    cy.SearchEntityandOpen("FilePicker1");
    const fixturePath = "AAAFlowerVase.jpeg";
    cy.get(commonlocators.filepickerv2).click();
    cy.get(commonlocators.filePickerInput)
      .first()
      .attachFile(fixturePath);
    cy.get(commonlocators.filePickerUploadButton).click();
    cy.get(commonlocators.dashboardItemName).contains("AAAFlowerVase.jpeg");
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get("button").contains("Upload 1 file");
  });

  it("Replace an existing file type with another file type", function() {
    cy.get(commonlocators.filepickerv2).click();
    cy.get("button.uppy-Dashboard-Item-action--remove").click();
    cy.get("button.uppy-Dashboard-browse").should("be.visible");
    cy.get(commonlocators.filePickerInput)
      .first()
      .attachFile("appsmithlogo.png");
    cy.get(commonlocators.filePickerUploadButton).click();
    cy.get(commonlocators.filepickerv2).click();
    cy.get(commonlocators.dashboardItemName).contains("appsmithlogo.png");
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(200);
    cy.get("button").contains("Upload 1 file");
  });
});
