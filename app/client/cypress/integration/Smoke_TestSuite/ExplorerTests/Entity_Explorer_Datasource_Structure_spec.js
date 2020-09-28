const explorer = require("../../../locators/explorerlocators.json");
const queryEditor = require("../../../locators/QueryEditor.json");
const queryLocators = require("../../../locators/QueryEditor.json");
const commonlocators = require("../../../locators/commonlocators.json");

let datasourceName;

describe("Entity explorer datasource structure", function() {
  beforeEach(() => {
    cy.ClearSearch();
    cy.createPostgresDatasource();
    cy.get("@createDatasource").then(httpResponse => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });

  it("Entity explorer datasource structure", function() {
    cy.GlobalSearchEntity(datasourceName);
    cy.get(`.t--entity.datasource:contains(${datasourceName})`)
      .find(explorer.collapse)
      .click();
    cy.wait("@getDatasourceStructure").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get(explorer.datasourceStructure)
      .first()
      .find(explorer.collapse)
      .click();
    cy.get(explorer.datasourceColumn)
      .first()
      .click();
    cy.get(".bp3-popover-content").should("be.visible");

    cy.get(explorer.templateMenuIcon)
      .first()
      .click({ force: true });
    cy.get(".bp3-popover-content")
      .last()
      .contains("SELECT")
      .click({ force: true });
    cy.wait("@createNewApi").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    cy.get(queryEditor.deleteQuery).click();
    cy.wait("@deleteAction").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.deletePostgresDatasource(datasourceName);
  });

  it("Refresh datasource structure", function() {
    cy.GlobalSearchEntity(datasourceName);
    cy.get(`.t--entity.datasource:contains(${datasourceName})`)
      .find(explorer.collapse)
      .as("datasourceEntityCollapse");

    cy.get("@datasourceEntityCollapse").click();
    cy.wait("@getDatasourceStructure").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get(commonlocators.entityExplorersearch).clear();

    cy.NavigateToQueryEditor();
    cy.get(".t--datasource-name")
      .contains(datasourceName)
      .click();
    cy.get(queryLocators.templateMenu).click();

    const tableName = Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, "");
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type(`CREATE TABLE ${tableName} ( ID int );`);

    cy.get(queryEditor.runQuery).click();
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.GlobalSearchEntity(datasourceName);
    cy.get("@datasourceEntityCollapse").click();
    cy.xpath(explorer.datsourceEntityPopover)
      .last()
      .click({ force: true });

    cy.get(explorer.refreshStructure).click({ force: true });
    cy.wait("@getDatasourceStructure").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    // TODO (Akash): Check for new table name to be visible in UI as well
    // cy.get(explorer.datasourceStructure)
    //   .contains(`public.${tableName}`)
    //   .should("be.visible");

    cy.get(".CodeMirror")
      .first()
      .then(editor => {
        editor[0].CodeMirror.setValue(`DROP TABLE ${tableName}`);
        cy.WaitAutoSave();
        cy.get(queryEditor.runQuery).click();
        cy.wait("@postExecute").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );

        cy.get(queryEditor.deleteQuery).click();
        cy.wait("@deleteAction").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        cy.deletePostgresDatasource(datasourceName);
      });
  });
});
