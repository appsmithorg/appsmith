import homePage from "../../../../locators/HomePage";
import explorer from "../../../../locators/explorerlocators.json";
describe("Visual regression tests", () => {
  // for any changes in UI, update the screenshot in snapshot folder, to do so:
  //  1. Delete the required screenshot which you want to update.
  //  2. Run test in headless mode with any browser
  //      command: "npx cypress run --spec cypress/integration/Smoke_TestSuite/ClientSideTests/LayoutValidation/AppPageLayout_spec.js  --browser chrome"
  //  3. New screenshot will be generated in the snapshot folder.

  it("Layout validation for app page in edit mode", () => {
    // create new organization
    //cy.NavigateToHome();
    // cy.createWorkspace();
    // cy.wait("@createWorkspace").then((interception) => {
    //   const newWorkspaceName = interception.response.body.data.name;
    //   cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
    //  });
    cy.NavigateToDatasourceEditor();
    cy.NavigateToActiveTab();
    cy.get(".t--integrationsHomePage").matchImageSnapshot(
      "emptydatasourcepage",
    );
    cy.NavigateToDatasourceEditor();
    cy.get("#new-api").matchImageSnapshot("apiSection");
    cy.get("span:contains('Database')")
      .first()
      .click();
    cy.get("#new-datasources").matchImageSnapshot("databaseSection");
    cy.get("#mock-database")
      .scrollIntoView()
      .matchImageSnapshot("sampleDatabasesSection");
  });
});
