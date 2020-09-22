const explorer = require("../../../locators/explorerlocators.json");
const queryEditor = require("../../../locators/QueryEditor.json");

let datasourceName;

describe("Entity explorer datasource structure", function() {
  beforeEach(() => {
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
});
