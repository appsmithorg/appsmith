import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../support/Pages/EditorNavigation";

const datasourceEditor = require("../../../locators/DatasourcesEditor.json");
import {
  agHelper,
  dataSources,
  debuggerHelper,
} from "../../../support/Objects/ObjectsCore";

const commonlocators = require("../../../locators/commonlocators.json");

describe(
  "MySQL noise test",
  {
    tags: ["@tag.Datasource", "@tag.Sanity", "@tag.Git", "@tag.AccessControl"],
  },
  function () {
    let datasourceName;

    beforeEach(() => {
      agHelper.AddDsl("noiseDsl");

      dataSources.StartDataSourceRoutes();
    });

    it("1. Verify after killing MySQL session, app should not crash", function () {
      cy.NavigateToDatasourceEditor();
      agHelper.GetNClick(datasourceEditor.MySQL);
      cy.generateUUID().then((uid) => {
        datasourceName = uid;
        cy.get(".t--edit-datasource-name").click();
        cy.get(".t--edit-datasource-name input")
          .clear()
          .type(datasourceName, { force: true })
          .should("have.value", datasourceName)
          .blur();
        cy.fillMySQLDatasourceForm();
        cy.testSaveDatasource();
        // mySQL query to fetch data
        dataSources.CreateQueryAfterDSSaved(
          "SELECT * FROM users where role = 'Admin' ORDER BY id LIMIT 10",
          "NoiseTestQuery",
        );
      });
      cy.WaitAutoSave();
      cy.runQuery();
      // API for killing mySQL session
      cy.CreateAPI("killSession");
      cy.enterDatasourceAndPath(
        "http://host.docker.internal:5001/",
        "v1/noise/killmysql",
      );
      cy.SaveAndRunAPI();
      cy.ResponseCheck("killed");
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      cy.wait(2000);
      // run kill query
      cy.get(".bp3-button-text:contains('Kill Session')").should("be.visible");
      cy.get(".bp3-button-text:contains('Kill Session')").click({
        force: true,
      });
      // run refresh query
      cy.get(".bp3-button-text:contains('Refresh Query')").click({
        force: true,
      });
      cy.wait(2000);

      debuggerHelper.OpenDebugger();
      debuggerHelper.ClickLogsTab();
      debuggerHelper.DoesConsoleLogExist(
        "Failed execution",
        true,
        "NoiseTestQuery",
      );

      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.statusCode).to.eq("200 OK");
      });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.statusCode).to.eq("200 OK");
      });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.statusCode).to.eq("PE-STC-5000");
        expect(response.body.data.title).to.eq("Connection is stale");
      });
    });
  },
);
