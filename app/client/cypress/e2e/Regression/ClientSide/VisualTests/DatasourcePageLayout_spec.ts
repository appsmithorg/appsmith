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
  /* cy.NavigateToDatasourceEditor();
    cy.wait(2000);
    cy.get("#new-api").matchImageSnapshot("apiSection");
    cy.get("span:contains('Database')")
      .first()
      .click();
    cy.get("#new-datasources").matchImageSnapshot("databaseSection");
    cy.get("#mock-database")
      .scrollIntoView()
      .matchImageSnapshot("sampleDatabasesSection");
  });
  it("Layout validation for postgres page", () => {
    cy.get(datasource.PostgreSQL).click();
    cy.get(".t--edit-datasource-name").click();
    cy.get(".t--edit-datasource-name input")
      .clear()
      .type(postgres, { force: true })
      .should("have.value", postgres)
      .blur();
    cy.get('[data-testid="section-Connection"]')
      .next()
      .matchImageSnapshot("postgresConnectionSection2");
    cy.get('[data-testid="section-Connection"]').click();
    cy.get('[data-testid="section-Authentication"]')
      .scrollIntoView()
      .click();
    cy.wait(1000);
    cy.get('[data-testid="section-Authentication"]')
      .next()
      .matchImageSnapshot("postgresAuthenticationSection2");
    cy.get('[data-testid="section-Authentication"]').click();
    cy.get('[data-testid="section-SSL (optional)"]')
      .scrollIntoView()
      .click();
    cy.wait(1000);
    cy.get('[data-testid="section-SSL (optional)"]')
      .next()
      .matchImageSnapshot("postgresSSLSection2");
    cy.get('[data-testid="section-SSL (optional)"]').click();
    cy.get('[data-testid="section-SSL (optional)"]')
      .next()
      .next()
      .matchImageSnapshot("ctaButtons");
    cy.get(".t--close-editor").click();
    cy.contains(".t--datasource-name", postgres).matchImageSnapshot(
      "PostgresActivetab",
    );
  });
  it("Layout validation for mongodb page", () => {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MongoDB).click({ force: true });
    cy.get(".t--edit-datasource-name").click();
    cy.get(".t--edit-datasource-name input")
      .clear()
      .type(mongo, { force: true })
      .should("have.value", mongo)
      .blur();
    cy.get('[data-testid="section-Connection"]')
      .next()
      .matchImageSnapshot("mongoConnectionSection2");
    cy.get('[data-testid="section-Connection"]').click();
    cy.get('[data-testid="section-Authentication"]')
      .scrollIntoView()
      .click();
    cy.wait(1000);
    cy.get('[data-testid="section-Authentication"]')
      .next()
      .matchImageSnapshot("mongoAuthenticationSection2");
    cy.get('[data-testid="section-Authentication"]').click();
    cy.get('[data-testid="section-SSL (optional)"]')
      .scrollIntoView()
      .click();
    cy.wait(1000);
    cy.get('[data-testid="section-SSL (optional)"]')
      .next()
      .matchImageSnapshot("mongoSSLSection2");
    cy.get('[data-testid="section-SSL (optional)"]').click();
    cy.get('[data-testid="section-SSL (optional)"]')
      .next()
      .next()
      .matchImageSnapshot("ctaButtons");
    cy.get(".t--close-editor").click();
    cy.contains(".t--datasource-name", mongo).matchImageSnapshot(
      "MongoDBActivetab",
    );
  }); */
});
