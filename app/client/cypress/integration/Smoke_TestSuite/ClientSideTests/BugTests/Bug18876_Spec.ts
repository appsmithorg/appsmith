import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const apiPage = ObjectsRegistry.ApiPage,
  datasource = ObjectsRegistry.DataSources;

describe("Application crashes when saving datasource", () => {
  it("ensures application does not crash when saving datasource", () => {
    apiPage.CreateAndFillApi(
      "https://www.jsonplaceholder.com",
      "FirstAPI",
      10000,
      "POST",
    );
    apiPage.SelectPaneTab("Authentication");
    cy.get(apiPage._saveAsDS)
      .last()
      .click({ force: true });
    cy.get(".t--close-editor").click({ force: true });
    cy.get(datasource._datasourceModalSave).click();
    // ensures app does not crash and datasource is saved.
    cy.contains("Edit Datasource to access authentication settings").should(
      "exist",
    );
  });
});
