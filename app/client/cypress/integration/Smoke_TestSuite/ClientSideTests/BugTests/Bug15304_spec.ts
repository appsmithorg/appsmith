import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const {
  AggregateHelper: agHelper,
  ApiPage: apiPage,
  DataSources: dataSources,
  EntityExplorer: ee,
  JSEditor: jsEditor,
} = ObjectsRegistry;

let dsName: any;

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

    //Clean up
    ee.SelectEntityByName("Page1");
    ee.ActionContextMenuByEntityName(
      "JSObject1",
      "Delete",
      "Are you sure?",
      true,
    );
    ee.ActionContextMenuByEntityName(
      "JSObject1Copy",
      "Delete",
      "Are you sure?",
      true,
    );
  });

  it("2. Appends copy to name of Api when it already exist in another page", () => {
    // create Api in page 1
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

    //Clean up
    ee.SelectEntityByName("Page1");
    ee.ActionContextMenuByEntityName("Api1", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("Api1Copy", "Delete", "Are you sure?");
  });

  it("3. Appends copy to name of Query when it already exist in another page", () => {
    dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.CreateNewQueryInDS(
        dsName,
        "SELECT * FROM lightHouses LIMIT 10;",
      );
      dataSources.RunQueryNVerifyResponseViews(10);

      ee.SelectEntityByName("Page2");
      dataSources.CreateNewQueryInDS(
        dsName,
        "SELECT * FROM worldCountryInfo LIMIT 10;",
      );
      dataSources.RunQueryNVerifyResponseViews(10);
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

  after(() => {
    //Clean up
    ee.SelectEntityByName("Page1");
    ee.ActionContextMenuByEntityName("Query1", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("Query1Copy", "Delete", "Are you sure?");
    dataSources.DeleteDatasouceFromActiveTab(dsName);
  });
});
