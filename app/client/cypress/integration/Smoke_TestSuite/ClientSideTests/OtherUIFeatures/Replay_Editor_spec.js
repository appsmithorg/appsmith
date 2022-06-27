const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const testdata = require("../../../../fixtures/testdata.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const datasourceEditor = require("../../../../locators/DatasourcesEditor.json");
const datasourceFormData = require("../../../../fixtures/datasources.json");
const queryLocators = require("../../../../locators/QueryEditor.json");

describe("Undo/Redo functionality", function() {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
  let postgresDatasourceName;

  it("Checks undo/redo in datasource forms", () => {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    cy.generateUUID().then((uid) => {
      postgresDatasourceName = uid;

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
    cy.get(datasourceEditor.sectionAuthentication)
      .trigger("click")
      .wait(1000);

    cy.get("body").type(`{${modifierKey}}z`);
    cy.get(
      `${datasourceEditor.sectionAuthentication} .bp3-icon-chevron-up`,
    ).should("exist");
    cy.get(".t--application-name").click({ force: true });
    cy.get("li:contains(Edit)")
      .eq(1)
      .trigger("mouseover");
    cy.get("li:contains(Undo)").click({ multiple: true });
    cy.get(datasourceEditor.username).should("be.empty");
    cy.get(datasourceEditor.saveBtn).click({ force: true });
  });

  it("Checks undo/redo for Api pane", function() {
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
    //cy.get(apiwidget.onPageLoad).click({ force: true });
    cy.get("body").click(0, 0);
    cy.get("body").type(`{${modifierKey}}z`);
    // cy.wait(2000);
    // cy.get("body").type(`{${modifierKey}}z`);
    cy.wait(2000);
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

  it("Checks undo/redo in query editor", () => {
    cy.NavigateToActiveDSQueryPane(postgresDatasourceName);
    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("{{FirstAPI}}", {
        force: true,
        parseSpecialCharSequences: false,
      });
    cy.get("body").click(0, 0);
    // verifying Relationships is visible on dynamic binding
    cy.get(".icon-text")
      .eq(1)
      .within(() => {
        cy.get(".connection-type").should("have.text", "Incoming entities");
      });
    cy.get(".icon-text")
      .eq(1)
      .next()
      .children()
      .within(() => {
        cy.get(".connection").should("have.text", "FirstAPI");
      });
    cy.get(".icon-text")
      .last()
      .within(() => {
        cy.get(".connection-type").should("have.text", "Outgoing entities");
      });
    cy.get("body").type(`{${modifierKey}}z`);
    cy.get(".CodeMirror-code").should("not.have.text", "{{FirstAPI}}");
    cy.get("body").click(0, 0);
    cy.get("body").type(`{${modifierKey}}{shift}z`);
    cy.get(".CodeMirror-code").should("have.text", "{{FirstAPI}}");
    // undo/redo through app menu
    cy.get(".t--application-name").click({ force: true });
    cy.get("li:contains(Edit)")
      .eq(1)
      .trigger("mouseover");
    cy.get("li:contains(Undo)").click({ multiple: true });
    cy.get(".CodeMirror-code").should("not.have.text", "{{FirstAPI}}");
  });

  it("Checks undo/redo in JS Objects", () => {
    cy.NavigateToJSEditor();
    cy.wait(1000);
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("{downarrow}{downarrow}{downarrow}  ")
      .type("testJSFunction:()=>{},");
    cy.get("body").type(`{${modifierKey}}z{${modifierKey}}z{${modifierKey}}z`);
    // verifying testJSFunction is not visible on page after undo
    cy.contains("testJSFunction").should("not.exist");
    cy.get("body").type(
      `{${modifierKey}}{shift}z{${modifierKey}}{shift}z{${modifierKey}}{shift}z`,
    );
    // verifying testJSFunction is visible on page after redo
    cy.contains("testJSFunction").should("exist");
    // performing undo from app menu
    cy.get(".t--application-name").click({ force: true });
    cy.get("li:contains(Edit)")
      .eq(1)
      .trigger("mouseover");
    cy.get("li:contains(Undo)").click({ multiple: true });
    // cy.get(".function-name").should("not.contain.text", "test");
  });

  it("Checks undo/redo for Authenticated APIs", () => {
    cy.NavigateToAPI_Panel();
    cy.get(apiwidget.createAuthApiDatasource).click({ force: true });
    cy.wait(2000);
    cy.get("input[name='url']").type(testdata.baseUrl);
    cy.get("input[name='headers[0].key']").type(testdata.headerKey);
    cy.get("body").click(0, 0);
    cy.get("body").type(`{${modifierKey}}z`);
    cy.get("body").type(`{${modifierKey}}z`);
    cy.get("input[name='url']").should("have.value", "");
    cy.get("input[name='headers[0].key']").should("have.value", "");
    cy.get("body").type(`{${modifierKey}}{shift}z`);
    cy.get("body").type(`{${modifierKey}}{shift}z`);
    cy.get("input[name='url']").should(
      "have.value",
      "https://mock-api.appsmith.com/",
    );
    cy.get("input[name='headers[0].key']").should("have.value", "Content-Type");
  });
});
