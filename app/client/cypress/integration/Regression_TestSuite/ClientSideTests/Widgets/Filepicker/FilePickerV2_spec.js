const explorer = require("../../../../../locators/explorerlocators.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
let ee = ObjectsRegistry.EntityExplorer;

const widgetName = "filepickerwidgetv2";

describe("File picker widget v2", () => {
  it("1. Drag & drop FilePicker/Text widgets", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas(widgetName, { x: 300, y: 300 });
    cy.get(widgetsPage.filepickerwidgetv2).should("exist");
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(".t--property-control-text", `{{FilePicker1.isDirty}}`);
  });

  it("2. Check isDirty meta property", function() {
    // Check if initial value of isDirty is false
    cy.get(".t--widget-textwidget").should("contain", "false");
    // Upload a new file
    cy.get(widgetsPage.filepickerwidgetv2).click();
    cy.get(commonlocators.filePickerInput)
      .first()
      .attachFile("testFile.mov");
    cy.get(commonlocators.filePickerUploadButton).click();
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    // Check if isDirty is set to true
    cy.get(".t--widget-textwidget").should("contain", "true");
  });

  it("3. Check if the uploaded data does not reset when back from query page", () => {
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(
      ".t--property-control-text",
      `{{FilePicker1.files[0].name}}`,
    );
    cy.createAndFillApi("https://mock-api.appsmith.com/users", "");
    cy.updateCodeInput(
      "[class*='t--actionConfiguration']",
      "{{FilePicker1.files}}",
    );
    cy.wait(1000);
    cy.validateEvaluatedValue("testFile.mov");

    cy.get(".t--more-action-menu")
      .first()
      .click({ force: true });

    // Go back to widgets page
    cy.get(explorer.widgetSwitchId).click();
    cy.get(widgetsPage.filepickerwidgetv2).should(
      "contain",
      "1 files selected",
    );
    cy.get(".t--widget-textwidget").should("contain", "testFile.mov");
  });

  it("4. Check if the uploaded file is removed on click of cancel button", () => {
    cy.get(widgetsPage.filepickerwidgetv2).click();
    cy.get(widgetsPage.filepickerwidgetv2CancelBtn).click();
    cy.get(widgetsPage.filepickerwidgetv2).should("contain", "Select Files");
    cy.get(widgetsPage.filepickerwidgetv2CloseModalBtn).click();
    cy.get(widgetsPage.explorerSwitchId).click();
    ee.ExpandCollapseEntity("Queries/JS");
    cy.get(".t--entity-item:contains(Api1)").click();
    cy.get("[class*='t--actionConfiguration']")
      .eq(0)
      .click();
    cy.wait(1000);
    cy.validateEvaluatedValue("[]");
  });
});
