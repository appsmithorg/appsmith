import * as _ from "../../../../support/Objects/ObjectsCore";
import {
  AppSidebar,
  AppSidebarButton,
} from "../../../../support/Pages/EditorNavigation";

describe("Visual tests for datasources", { tags: ["@tag.Visual"] }, () => {
  // for any changes in UI, update the screenshot in snapshot folder, to do so:
  //  1. Delete the required screenshot which you want to update.
  //  2. Run test in headless mode with any browser
  //      command: "npx cypress run --spec cypress/e2e/Regression_TestSuite/ClientSideTests/VisualTests/DatasourcePageLayout_spec.js  --browser chrome"
  //  3. New screenshot will be generated in the snapshot folder.
  it("1. Layout validation for datasource page", () => {
    _.homePage.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
    });
    AppSidebar.navigate(AppSidebarButton.Data);
    cy.get(".t--data-blank-state").matchImageSnapshot("emptydatasourcepage");
  });
});
