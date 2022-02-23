const dsl = require("../../../../fixtures/passingparamdsl.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../../locators/QueryEditor.json");

describe("Passing params in a query", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Bug 10211:passing params is broken", function() {
    cy.NavigateToJSEditor();
    cy.wait(1000);
    cy.addJsEditorText(
      "export default { getUser: () => { return fetchUsers.data.map((item) => {\
              return {\
                label: item.email,\
                value: item.name \
              }\
            })},\
          searchUsers: (text) => {\
            showAlert(text);\
            fetchUsers.run(undefined, undefined, { searchText: text});\
          }\
        }",
    );
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.mockUserDatabase).click();
    cy.get(`${datasource.createQuerty}`)
      .last()
      .click({ force: true });
    cy.get(".t--action-name-edit-field").click({ force: true });
    cy.get(queryLocators.queryNameField).type("fetchUsers");
    //Click on Write query area
    cy.get(queryLocators.templateMenu).click();
    cy.get(queryLocators.query).click({ force: true });
    //writing query to get the schema
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type(
        'select * from users WHERE name LIKE {{"%" + this.params.searchText + "%"}} limit 10',
        {
          force: true,
          parseSpecialCharSequences: false,
        },
      );
    cy.WaitAutoSave();
    cy.get('.t--entity-name:contains("Page1")').click({ force: true });
    cy.wait(1000);
    cy.reload();
    cy.wait(2000);
    cy.get(".bp3-button-text")
      .should("be.visible")
      .click();
    // cy.wait(2000)
    cy.get(".bp3-input")
      .last()
      .type("Darlene");
    cy.wait(4000);
    cy.wait("@postExecute", { timeout: 8000 }).then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
    });
    cy.wait("@postExecute", { timeout: 8000 }).then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      cy.log(response.body.data.body);
      expect(response.body.data.body[0].email).to.eq("darlene@example.com");
    });
  });
});
