const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const testdata = require("../../../../fixtures/testdata.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const datasourceEditor = require("../../../../locators/DatasourcesEditor.json");
const datasourceFormData = require("../../../../fixtures/datasources.json");

describe("Undo/Redo functionality", function() {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  it("Checks undo/redo in datasource forms", () => {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    cy.generateUUID().then((uid) => {
      let postgresDatasourceName = uid;

      cy.get(".t--edit-datasource-name").click();
      cy.get(".t--edit-datasource-name input")
        .clear()
        .type(postgresDatasourceName, { force: true })
        .should("have.value", postgresDatasourceName)
        .blur();
    });
    cy.get(datasourceEditor.sectionAuthentication).click();
    cy.get(datasourceEditor.username).type(
      datasourceFormData["postgres-username"],
    );
    cy.get(datasourceEditor.password).type(
      datasourceFormData["postgres-password"],
    );
    cy.get(datasourceEditor.sectionAuthentication).click();
    cy.get("body").type(`{${modifierKey}}z`);
    cy.get(
      `${datasourceEditor.sectionAuthentication} .bp3-icon-chevron-up`,
    ).should("exist");
    cy.get(".t--application-name").click({ force: true });
    cy.get("li:contains(Edit)").trigger("mouseover");
    cy.get("li:contains(Undo)").click({ multiple: true });
    cy.get(datasourceEditor.username).should("be.empty");
  });

  it("checks undo/redo for Api pane", function() {
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("FirstAPI");
    cy.get(`${apiwidget.resourceUrl} .CodeMirror-placeholder`).should(
      "have.text",
      "https://mock-api.appsmith.com/users",
    );
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methods);
    cy.get(`${apiwidget.headerKey}`).type("Authorization");
    cy.get("body").click(0, 0);
    cy.get(apiwidget.settings).click({ force: true });
    cy.get(apiwidget.onPageLoad).click({ force: true });
    cy.get("body").click(0, 0);
    cy.get("body").type(`{${modifierKey}}z`);
    cy.get("body").type(`{${modifierKey}}z`);
    cy.get(apiwidget.headers).should("have.class", "react-tabs__tab--selected");
    cy.get("body").type(`{${modifierKey}}z`);
    cy.get(`${apiwidget.resourceUrl} .CodeMirror-placeholder`).should(
      "have.text",
      "https://mock-api.appsmith.com/users",
    );
    cy.get(`${apiwidget.headerKey} .CodeMirror-placeholder`).should(
      "have.text",
      "Key 1",
    );
    cy.get("body").type(`{${modifierKey}}{shift}z`);
    cy.get("body").type(`{${modifierKey}}{shift}z`);
    cy.get(`${apiwidget.headerKey} .cm-m-null`).should(
      "have.text",
      "Authorization",
    );
  });
});
