const explorer = require("../../../../locators/explorerlocators.json");
const queryEditor = require("../../../../locators/QueryEditor.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

let datasourceName;

describe("Entity explorer datasource structure", function() {
  beforeEach(() => {
    cy.ClearSearch();
    cy.startRoutesForDatasource();
    cy.createPostgresDatasource();
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });

  it("Entity explorer datasource structure", function() {
    cy.NavigateToQueryEditor();
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();
    cy.wait("@createNewApi").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    cy.get(apiwidget.apiTxt)
      .clear()
      .type("MyQuery", { force: true })
      .should("have.value", "MyQuery")
      .blur();
    cy.WaitAutoSave();

    cy.GlobalSearchEntity(datasourceName);
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
    cy.get(".t--structure-template-menu-popover")
      .last()
      .contains("SELECT")
      .click({ force: true });
    cy.wait("@createNewApi").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    cy.get(queryEditor.queryMoreAction).click();
    cy.get(queryEditor.deleteUsingContext).click();
    cy.wait("@deleteAction").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.GlobalSearchEntity("MyQuery");
    cy.get(`.t--entity-name:contains(MyQuery)`).click();
    cy.get(queryEditor.queryMoreAction).click();
    cy.get(queryEditor.deleteUsingContext).click();
    cy.wait("@deleteAction").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get(commonlocators.entityExplorersearch).clear({ force: true });

    cy.deleteDatasource(datasourceName);
  });

  it("Refresh datasource structure", function() {
    cy.NavigateToQueryEditor();
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();
    cy.get(queryLocators.templateMenu).click();

    cy.GlobalSearchEntity(datasourceName);
    cy.get(`.t--entity.datasource:contains(${datasourceName})`)
      .find(explorer.collapse)
      .as("datasourceEntityCollapse");

    cy.wait("@getDatasourceStructure").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get(commonlocators.entityExplorersearch).clear({ force: true });

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
    cy.get("@datasourceEntityCollapse")
      .first()
      .click();
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
      .then((editor) => {
        editor[0].CodeMirror.setValue(`DROP TABLE ${tableName}`);
        cy.WaitAutoSave();
        cy.get(queryEditor.runQuery).click();
        cy.wait("@postExecute").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );

        cy.get(queryEditor.queryMoreAction).click();
        cy.get(queryEditor.deleteUsingContext).click();
        cy.wait("@deleteAction").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );

        cy.get(commonlocators.entityExplorersearch).clear({ force: true });
        cy.deleteDatasource(datasourceName);
      });
  });
});
