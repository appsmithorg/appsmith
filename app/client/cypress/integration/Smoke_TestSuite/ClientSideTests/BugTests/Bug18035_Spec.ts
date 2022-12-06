import datasourceFormData from "../../../../fixtures/datasources.json";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const dataSources = ObjectsRegistry.DataSources,
  agHelper = ObjectsRegistry.AggregateHelper;

describe("Bug 18035: Updates save button text on datasource discard popup", function() {
  it("1. Create gsheet datasource, click on back button, discard popup should contain save and authorize", function() {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Google Sheets");
    agHelper.GoBack();
    cy.get(dataSources._discardPopupSaveButton)
      .contains("SAVE AND AUTHORIZE")
      .should("be.visible");
    cy.get(dataSources._discardPopupDiscardButton).click();
  });

  it("2. Create any other datasource, click on back button, discard popup should contain save", function() {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("PostgreSQL");
    agHelper.GoBack();
    cy.get(dataSources._discardPopupSaveButton)
      .contains("SAVE")
      .should("be.visible");
    cy.get(dataSources._discardPopupDiscardButton).click();
  });
});
