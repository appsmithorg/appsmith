import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const {
  AggregateHelper: agHelper,
  ApiPage: apiPage,
  DataSources: dataSources,
  EntityExplorer: ee,
  JSEditor: jsEditor,
} = ObjectsRegistry;

let guid: any, dsName: any;

describe("Move objects/actions/queries to different pages", () => {
  before(() => {
    dataSources.StartDataSourceRoutes();
  });

  it("1. Appends copy to name of JS object when it already exist in another page", () => {
    // create object in page 1
    jsEditor.CreateJSObject('return "Hello World";', {
      paste: true,
      completeReplace: false,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    // create a new page and a js object in it
    ee.AddNewPage(); // page 2
    jsEditor.CreateJSObject('return "Hello World";', {
      paste: true,
      completeReplace: false,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("JSObject1", "Move to page", "Page1");

    agHelper.WaitUntilToastDisappear(
      "JSObject1Copy moved to page Page1 successfully",
    );

    // check that the copy and original objects both exist in page 1
    ee.AssertEntityPresenceInExplorer("JSObject1Copy");
    ee.AssertEntityPresenceInExplorer("JSObject1");

    // check that js object no longer exists in page 2
    ee.SelectEntityByName("Page2");
    ee.AssertEntityAbsenceInExplorer("JSObject1");
  });

  it("2. Appends copy to name of Api when it already exist in another page", () => {
    // create Api in page 1
    ee.SelectEntityByName("Page1");
    apiPage.CreateAndFillApi("https://randomuser.me/api/", "Api1");

    // create api in page 2
    ee.SelectEntityByName("Page2");
    apiPage.CreateAndFillApi("https://randomuser.me/api/", "Api1");

    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("Api1", "Move to page", "Page1");

    agHelper.WaitUntilToastDisappear(
      "Api1Copy action moved to page Page1 successfully",
    );

    // check that the copy and original objects both exist in page 1
    ee.AssertEntityPresenceInExplorer("Api1Copy");
    ee.AssertEntityPresenceInExplorer("Api1");

    // check that js object no longer exists in page 2
    ee.SelectEntityByName("Page2");
    ee.AssertEntityAbsenceInExplorer("Api1");
  });

  it("3. Appends copy to name of Query when it already exist in another page", () => {
    ee.SelectEntityByName("Page1");
    dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });

    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("verifyDescribe");
    runQueryNValidate("Describe customers;", [
      "Field",
      "Type",
      "Null",
      "Key",
      "Default",
      "Extra",
    ]);

    ee.SelectEntityByName("Page2");
    dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });

    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("verifyDescribe");
    runQueryNValidate("Describe customers;", [
      "Field",
      "Type",
      "Null",
      "Key",
      "Default",
      "Extra",
    ]);

    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("Query1", "Move to page", "Page1");

    // check that the copy and original objects both exist in page 1
    ee.AssertEntityPresenceInExplorer("Query1Copy");
    ee.AssertEntityPresenceInExplorer("Query1");

    // check that js object no longer exists in page 2
    ee.SelectEntityByName("Page2");
    ee.AssertEntityAbsenceInExplorer("Query1");
  });
});

function runQueryNValidate(query: string, columnHeaders: string[]) {
  dataSources.EnterQuery(query);
  dataSources.RunQuery();
  dataSources.AssertQueryResponseHeaders(columnHeaders);
}
