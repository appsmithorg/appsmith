const explorer = require("../../../../locators/explorerlocators.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
import {
  entityExplorer,
  dataSources,
} from "../../../../support/Objects/ObjectsCore";

describe("Entity explorer datasource structure", function () {
  let datasourceName;

  beforeEach(() => {
    //cy.ClearSearch();
    cy.startRoutesForDatasource();
    cy.createPostgresDatasource();
    cy.get("@saveDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });

  it("1. Entity explorer datasource structure", function () {
    cy.NavigateToActiveDSQueryPane(datasourceName);
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
    entityExplorer.ExpandCollapseEntity("Datasources");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: datasourceName,
      action: "Refresh",
    });
    cy.wait(2000); //for the tables to open
    cy.wait("@getDatasourceStructure").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    // cy.get(explorer.datasourceStructure)
    //   .first()
    //   .find(explorer.collapse)
    //   .click();
    // cy.get(explorer.datasourceColumn)
    //   .first()
    //   .click();
    // cy.get(".bp3-popover-content").should("be.visible");

    cy.get(explorer.templateMenuIcon).first().click({ force: true });
    // assert suggested tag is present
    cy.get(".t--structure-template-menu-popover").last().contains("Suggested");
    cy.get(".t--structure-template-menu-popover")
      .last()
      .contains("Select")
      .click({ force: true });
    cy.wait("@createNewApi").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    cy.deleteQueryUsingContext();
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "MyQuery",
    });
    cy.deleteDatasource(datasourceName);
  });

  it("2. Refresh datasource structure", function () {
    cy.NavigateToActiveDSQueryPane(datasourceName);

    //cy.GlobalSearchEntity(datasourceName);
    // cy.get(`.t--entity.datasource:contains(${datasourceName})`)
    //   .find(explorer.collapse)
    //   .as("datasourceEntityCollapse");
    // cy.wait("@getDatasourceStructure").should(
    //   "have.nested.property",
    //   "response.body.responseMeta.status",
    //   200,
    // );
    //cy.get(commonlocators.entityExplorersearch).clear({ force: true });

    const tableName = Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, "");
    dataSources.EnterQuery(`CREATE TABLE public.${tableName} ( ID int );`);
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.request.requestParams.Query.value).to.contain(
        tableName,
      );
    });

    //cy.wait(8000)
    // cy.GlobalSearchEntity(datasourceName);
    // cy.get("@datasourceEntityCollapse")
    //   .first()
    //   .click();
    // cy.xpath(explorer.datsourceEntityPopover)
    //   .last()
    //   .click({ force: true });
    dataSources.AssertTableInVirtuosoList(
      datasourceName,
      `public.${tableName}`,
    );

    cy.typeValueNValidate(`DROP TABLE public.${tableName}`);
    cy.runQuery();
    dataSources.AssertTableInVirtuosoList(
      datasourceName,
      `public.${tableName}`,
      false,
    );
    cy.deleteQueryUsingContext();
    cy.deleteDatasource(datasourceName);
  });
});
