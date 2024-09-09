import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const publishPage = require("../../../../locators/publishWidgetspage.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
import {
  agHelper,
  deployMode,
  dataSources,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "API Panel Test Functionality",
  { tags: ["@tag.Datasource"] },
  function () {
    let datasourceName;
    before(() => {
      agHelper.AddDsl("executionParamsDsl");
    });
    beforeEach(() => {
      dataSources.StartDataSourceRoutes();
    });
    it("1. Create a postgres datasource", function () {
      cy.NavigateToDatasourceEditor();
      agHelper.GetNClick(datasource.PostgreSQL);
      cy.fillPostgresDatasourceForm();
      cy.testSaveDatasource();
      cy.get("@saveDatasource").then((httpResponse) => {
        datasourceName = httpResponse.response.body.data.name;
      });
    });

    it("2. Create and runs query", () => {
      dataSources.CreateQueryAfterDSSaved(
        "select * from {{ this.params.tableName || 'users' }} limit 10",
      );
      cy.get(queryLocators.settings).click({ force: true });
      dataSources.ToggleUsePreparedStatement(false);
      cy.xpath(queryLocators.query).click({ force: true });
      cy.runQuery();
    });

    it("3. Will pass execution params", function () {
      // Bind the table
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget, {}, [
        "Container3",
      ]);
      cy.EnableAllCodeEditors();
      cy.testJsontext("tabledata", "{{Query1.data}}");
      // Assert 'posts' data (default)
      cy.readTabledataPublish("0", "1").then((cellData) => {
        expect(cellData).to.be.equal("Test user 7");
      });
      // Choose static button
      EditorNavigation.SelectEntityByName("StaticButton", EntityType.Widget);
      // toggle js of onClick
      cy.get(".t--property-control-onclick")
        .find(".t--js-toggle")
        .click({ force: true });
      // Bind with MultiApi with static value
      cy.testJsontext(
        "onclick",
        "{{Query1.run(undefined, undefined, { tableName: 'users' })}}",
      );
      // Choose dynamic button
      EditorNavigation.SelectEntityByName("DynamicButton", EntityType.Widget);
      cy.wait(2000);
      // toggle js of onClick
      cy.get(".t--property-control-onclick").scrollIntoView();
      cy.get(".t--property-control-onclick")
        .find(".t--js-toggle")
        .click({ force: true });
      // Bind with MultiApi with dynamicValue value
      cy.testJsontext(
        "onclick",
        "{{Query1.run(undefined, undefined, { tableName: EndpointInput.text })}}",
      );

      // Publish the app
      deployMode.DeployApp();

      // Assert on load data in table
      cy.readTabledataPublish("0", "1").then((cellData) => {
        expect(cellData).to.be.equal("Test user 7");
      });

      // Click Static button
      cy.get(publishPage.buttonWidget).first().click();

      //Wait for postExecute to finish
      cy.wait("@postExecute").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(3000);
      // Assert statically bound "users" data
      cy.readTabledataPublish("1", "1").then((cellData) => {
        expect(cellData).to.be.equal("Test user 8");
      });

      // Click dynamic button
      cy.get(publishPage.buttonWidget).eq(1).click();

      //Wait for postExecute to finish
      cy.wait("@postExecute").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(3000);
      // Assert dynamically bound "todos" data
      cy.readTabledataPublish("0", "1").then((cellData) => {
        expect(cellData).to.be.equal("Test user 7");
      });
    });
  },
);
