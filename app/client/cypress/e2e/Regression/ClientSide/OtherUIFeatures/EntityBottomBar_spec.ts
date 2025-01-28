import * as _ from "../../../../support/Objects/ObjectsCore";
import { PageType } from "../../../../support/Pages/DebuggerHelper";
import EditorNavigation from "../../../../support/Pages/EditorNavigation";

describe(
  "Entity bottom bar",
  { tags: ["@tag.IDE", "@tag.PropertyPane"] },
  () => {
    it("1. Debugger should be closable", () => {
      //Verify if bottom bar is closed.
      _.debuggerHelper.AssertClosed();
      //verify if bottom bar is open on clicking debugger icon in canvas.
      _.debuggerHelper.OpenDebugger();
      _.debuggerHelper.AssertOpen(PageType.Canvas);
      //Verify if selected tab is errors in tab title.
      _.debuggerHelper.AssertSelectedTab(
        Cypress.env("MESSAGES").DEBUGGER_ERRORS(),
      );
      // verify if bottom bar is closed on clicking close icon in canvas.
      _.debuggerHelper.CloseBottomBar();
      _.debuggerHelper.AssertClosed();
    });

    it("2. Jseditor bottom bar should be collapsable", () => {
      _.jsEditor.CreateJSObject(` return "hello world";`);
      //Verify if bottom bar opens JSEditor.
      _.debuggerHelper.AssertOpen(PageType.JsEditor);
      // Verify if selected tab is response.
      _.debuggerHelper.AssertSelectedTab(
        Cypress.env("MESSAGES").DEBUGGER_RESPONSE(),
      );
      //Verify if bottom bar is closed on clicking close icon in JSEditor.
      _.debuggerHelper.CloseBottomBar();
      _.debuggerHelper.AssertClosed();
      //Verify if bottom bar is open on executing JSFunction.
      _.jsEditor.RunJSObj();
      _.debuggerHelper.AssertOpen(PageType.JsEditor);
      //verify if response tab is selected on execution JSFunction.
      _.debuggerHelper.AssertSelectedTab(
        Cypress.env("MESSAGES").DEBUGGER_RESPONSE(),
      );
      //verify if bottom bar is closed on switching to canvas page.
      EditorNavigation.ShowCanvas();
      _.debuggerHelper.AssertClosed();
    });

    it("3. Api bottom pane should be collapsable", () => {
      _.apiPage.CreateAndFillApi(
        _.dataManager.dsValues[_.dataManager.defaultEnviorment].mockApiUrl,
      );
      //Verify that the errors tab is still closed.
      _.debuggerHelper.AssertClosed();
      //Verify if bottom bar opens on clicking debugger icon in api page.
      _.debuggerHelper.OpenDebugger();
      _.debuggerHelper.AssertOpen(PageType.API);
      //Verify if selected tab is errors in tab title.
      _.debuggerHelper.AssertSelectedTab(
        Cypress.env("MESSAGES").DEBUGGER_ERRORS(),
      );
      //Verify if bottom bar is open on executing api.
      _.apiPage.RunAPI();
      _.agHelper.Sleep(1000);
      _.debuggerHelper.AssertOpen(PageType.API);
      //verify if response tab is selected on execution api.
      _.debuggerHelper.AssertSelectedTab(
        Cypress.env("MESSAGES").DEBUGGER_RESPONSE(),
      );
    });

    it("4. Bottom bar in Datasource", () => {
      //Verify if bottom bar remain open on shifting to create new datasource page.
      _.dataSources.NavigateToDSCreateNew();
      //Expecting errors tab to be closed as this is now a datasource
      _.debuggerHelper.AssertClosed();
      //Verify if bottom bar opens on clicking debugger icon in datasource page.
      _.debuggerHelper.OpenDebugger();
      _.debuggerHelper.AssertOpen(PageType.DataSources);
    });

    it(
      "5. Query bottom bar should be collapsable",
      { tags: ["@tag.excludeForAirgap"] },
      () => {
        _.dataSources.CreateMockDB("Users").then((dbName) => {
          //Verify if bottom bar remain open on shifting to active datasource page.
          _.debuggerHelper.AssertOpen(PageType.DataSources);
          //Verify if selected tab is errors and error count is
          //Verify if selected tab is errors in tab title.
          _.debuggerHelper.AssertSelectedTab(
            Cypress.env("MESSAGES").DEBUGGER_ERRORS(),
          );
          //Verify if bottom bar is closed on clicking close icon in active datasource page.
          _.debuggerHelper.CloseBottomBar();
          _.debuggerHelper.AssertClosed();
          //Verify if bottom bar opens on clicking debugger icon in query page.
          _.dataSources.CreateQueryAfterDSSaved();
          _.debuggerHelper.OpenDebugger();
          _.debuggerHelper.AssertOpen(PageType.Query);
          //Verify if bottom bar is closed on clicking close icon in query page.
          _.debuggerHelper.CloseBottomBar();
          _.debuggerHelper.AssertClosed();
          //Create and run query.

          _.dataSources.EnterQuery(
            "SELECT * FROM users ORDER BY username LIMIT 10;",
            1000,
          );
          _.dataSources.RunQuery();
          //Verify if bottom bar is open on executing query.
          _.debuggerHelper.AssertOpen(PageType.Query);
          //Verify if response atb is selected on executing query.
          _.debuggerHelper.AssertSelectedTab(
            Cypress.env("MESSAGES").DEBUGGER_RESPONSE(),
          );
          // clean up
          _.dataSources.DeleteQuery("Query1");
          _.dataSources.DeleteDatasourceFromWithinDS(dbName);
        });
      },
    );

    it("airgap", "5. Query bottom bar should be collapsable - airgap", () => {
      _.dataSources.CreateDataSource("Postgres");
      //Verify if bottom bar remain open on shifting to active datasource page.
      _.debuggerHelper.AssertOpen(PageType.DataSources);
      //Verify if selected tab is errors and error count is
      //Verify if selected tab is errors in tab title.
      _.debuggerHelper.AssertSelectedTab(
        Cypress.env("MESSAGES").DEBUGGER_ERRORS(),
      );
      //Verify if bottom bar is closed on clicking close icon in active datasource page.
      _.debuggerHelper.CloseBottomBar();
      _.debuggerHelper.AssertClosed();
      //Verify if bottom bar opens on clicking debugger icon in query page.
      _.dataSources.CreateQueryAfterDSSaved();
      _.debuggerHelper.OpenDebugger();
      _.debuggerHelper.AssertOpen(PageType.Query);
      //Verify if bottom bar is closed on clicking close icon in query page.
      _.debuggerHelper.CloseBottomBar();
      _.debuggerHelper.AssertClosed();
      //Create and run query.
      _.dataSources.EnterQuery(
        "SELECT * FROM users ORDER BY id LIMIT 10;",
        1000,
      );
      _.dataSources.RunQuery();
      //Verify if bottom bar is open on executing query.
      _.debuggerHelper.AssertOpen(PageType.Query);
      //Verify if response atb is selected on executing query.
      _.debuggerHelper.AssertSelectedTab(
        Cypress.env("MESSAGES").DEBUGGER_RESPONSE(),
      );
      // clean up - sample
      _.dataSources.DeleteQuery("Query1");
      cy.get("@dsName").then(($dsName) => {
        _.dataSources.DeleteDatasourceFromWithinDS($dsName as any);
      });
    });
  },
);
