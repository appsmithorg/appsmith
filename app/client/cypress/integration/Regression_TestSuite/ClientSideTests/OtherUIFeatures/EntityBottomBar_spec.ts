import * as _ from "../../../../support/Objects/ObjectsCore";
import { PageType } from "../../../../support/Pages/DebuggerHelper";

describe("Entity bottom bar", () => {
  it("1. Debugger should be closable", () => {
    //Verify if bottom bar is closed.
    _.debuggerHelper.AssertClosed();
    //verify if bottom bar is open on clicking debugger icon in canvas.
    _.debuggerHelper.ClickDebuggerIcon();
    _.debuggerHelper.AssertOpen(PageType.Canvas);
    //Verify if selected tab is errors in tab title.
    _.debuggerHelper.AssertSelectedTab("Errors");
    // verify if bottom bar is closed on clicking close icon in canvas.
    _.debuggerHelper.CloseBottomBar();
    _.debuggerHelper.AssertClosed();
  });

  it("2. Api bottom pane should be collapsable", () => {
    cy.fixture("datasources").then((datasourceFormData: any) => {
      _.apiPage.CreateAndFillApi(datasourceFormData["mockApiUrl"]);
      //Verify if bottom bar opens on clicking debugger icon in api page.
      _.debuggerHelper.ClickDebuggerIcon();
      _.debuggerHelper.AssertOpen(PageType.API);
      //Verify if selected tab is errors in tab title.
      _.debuggerHelper.AssertSelectedTab("Errors");
      //Verify if bottom bar is closed on clicking close icon in API page.
      _.debuggerHelper.CloseBottomBar();
      _.debuggerHelper.AssertClosed();
      //Verify if bottom bar opens on clicking debugger icon in api page.
      _.debuggerHelper.ClickDebuggerIcon();
      _.debuggerHelper.AssertOpen(PageType.API);
      //Verify if bottom bar is open on executing api.
      _.apiPage.RunAPI();
      _.agHelper.Sleep(1000);
      _.debuggerHelper.AssertOpen(PageType.API);
      //verify if response tab is selected on execution api.
      _.debuggerHelper.AssertSelectedTab("Response");
    });
  });

  it("3. Jseditor bottom bar should be collapsable", () => {
    _.jsEditor.CreateJSObject(` return "hello world";`);
    //Verify if bottom bar open status is retained on changing from api to JSEditor.
    _.debuggerHelper.AssertOpen(PageType.JsEditor);
    // Verify if selected tab context is reatined on changing from api to JSEditor.
    _.debuggerHelper.AssertSelectedTab("Response");
    //Verify if bottom bar is closed on clicking close icon in JSEditor.
    _.debuggerHelper.CloseBottomBar();
    _.debuggerHelper.AssertClosed();
    //Verify if bottom bar is open on executing JSFunction.
    _.jsEditor.RunJSObj();
    _.debuggerHelper.AssertOpen(PageType.JsEditor);
    //verify if response tab is selected on execution JSFunction.
    _.debuggerHelper.AssertSelectedTab("Response");
  });

  it("4. Bottom bar in Datasource", () => {
    //Verify if bottom bar remain open on shifting to create new datasource page.
    _.dataSources.NavigateToDSCreateNew();
    _.debuggerHelper.AssertOpen(PageType.DataSources);
    //Verify if selected tab is errors in tab title.
    _.debuggerHelper.AssertSelectedTab("Errors");
    //Verify if bottom bar is closed on clicking close icon in datasource page.
    _.debuggerHelper.CloseBottomBar();
    _.debuggerHelper.AssertClosed();
    //Verify if bottom bar opens on clicking debugger icon in datasource page.
    _.debuggerHelper.ClickDebuggerIcon();
    _.debuggerHelper.AssertOpen(PageType.DataSources);
  });

  it("5. Query bottom bar should be collapsable", () => {
    _.dataSources.CreateMockDB("Users").then((dbName) => {
      //Verify if bottom bar remain open on shifting to active datasource page.
      _.debuggerHelper.AssertOpen(PageType.DataSources);
      //Verify if selected tab is errors and error count is
      //Verify if selected tab is errors in tab title.
      _.debuggerHelper.AssertSelectedTab("Errors");
      //Verify if bottom bar is closed on clicking close icon in active datasource page.
      _.debuggerHelper.CloseBottomBar();
      _.debuggerHelper.AssertClosed();
      //Verify if bottom bar opens on clicking debugger icon in query page.
      _.dataSources.CreateQueryFromActiveTab(dbName, false);
      _.debuggerHelper.ClickDebuggerIcon();
      _.debuggerHelper.AssertOpen(PageType.Query);
      //Verify if bottom bar is closed on clicking close icon in query page.
      _.debuggerHelper.CloseBottomBar();
      _.debuggerHelper.AssertClosed();
      //Create and run query.
      _.agHelper.GetNClick(_.dataSources._templateMenu);
      _.dataSources.EnterQuery(
        "SELECT * FROM users ORDER BY id LIMIT 10;",
        1000,
      );
      _.dataSources.RunQuery();
      //Verify if bottom bar is open on executing query.
      _.debuggerHelper.AssertOpen(PageType.Query);
      //Verify if response atb is selected on executing query.
      _.debuggerHelper.AssertSelectedTab("Response");
      // clean up
      _.dataSources.DeleteQuery("Query1");
      _.dataSources.DeleteDatasouceFromActiveTab(dbName);
    });
  });
});
