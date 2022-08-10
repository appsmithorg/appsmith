import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const {
  AggregateHelper: agHelper,
  ApiPage: apiPage,
  DataSources: dataSources,
  EntityExplorer: ee,
  JSEditor: jsEditor,
} = ObjectsRegistry;

let dsName: any;

describe("Copy Action/JS objects to different pages", () => {
  it("1. Copies Action object to a different page from the additional menu in Queries/JS section", () => {
    ee.AddNewPage(); //Page2
    apiPage.CreateAndFillApi("https://randomuser.me/api/", "get_data");
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("get_data", "Copy to page", "Page1");
    agHelper.WaitUntilToastDisappear(
      "get_data action copied to page Page1 successfully",
    );
    ee.SelectEntityByName("Page1");
    ee.AssertEntityPresenceInExplorer("get_data");
    ee.AssertEntityAbsenceInExplorer("get_dataCopy");
  });

  it("2. Copies action object to a different page from the additional menu on Api Editor page", () => {
    ee.AddNewPage(); //Page3
    ee.SelectEntityByName("Page2");
    ee.SelectEntityByName("get_data", "QUERIES/JS");
    agHelper.ActionContextMenuWithInPane("Copy to page", "Page3");
    agHelper.WaitUntilToastDisappear(
      "get_data action copied to page Page3 successfully",
    );
    ee.SelectEntityByName("Page3");
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.AssertEntityPresenceInExplorer("get_data");
    ee.AssertEntityAbsenceInExplorer("get_dataCopy");
  });

  it("3. Copies JS object to a different page from the additional menu in Queries/JS section", () => {
    ee.SelectEntityByName("Page1");
    jsEditor.CreateJSObject('return "Hello World";');
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("JSObject1", "Copy to page", "Page2");
    agHelper.WaitUntilToastDisappear(
      "JSObject1 copied to page Page2 successfully",
    );
    ee.SelectEntityByName("Page2");
    ee.AssertEntityPresenceInExplorer("JSObject1");
    ee.AssertEntityAbsenceInExplorer("JSObject1Copy");
  });

  it("4. Copies JS object to a different page from the additional menu on JS Editor page", () => {
    ee.SelectEntityByName("Page2");
    ee.SelectEntityByName("JSObject1", "QUERIES/JS");
    agHelper.ActionContextMenuWithInPane("Copy to page", "Page3");
    agHelper.WaitUntilToastDisappear(
      "JSObject1 copied to page Page3 successfully",
    );
    ee.SelectEntityByName("Page3");
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.AssertEntityPresenceInExplorer("JSObject1");
    ee.AssertEntityAbsenceInExplorer("JSObject1Copy");
  });

  it("5. Copies Queries to a different page from the additional menu in Queries/JS section", () => {
    ee.SelectEntityByName("Page1");
    dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.CreateNewQueryInDS(
        dsName,
        "SELECT * FROM lightHouses LIMIT 10;",
      );
      dataSources.RunQueryNVerifyResponseViews(10);

      ee.ExpandCollapseEntity("QUERIES/JS");
      ee.ActionContextMenuByEntityName("Query1", "Copy to page", "Page2");

      ee.SelectEntityByName("Page2");

      // check that the copy and original objects both exist in page 1
      ee.AssertEntityPresenceInExplorer("Query1");
      ee.AssertEntityAbsenceInExplorer("Query1Copy");

      // check that js object no longer exists in page 2
      ee.SelectEntityByName("Page1");
      ee.AssertEntityAbsenceInExplorer("Query1");
    });
  });

  it("6. Copies Queries to a different page from the additional menu on Query Editor page", () => {
    ee.SelectEntityByName("Page2");
    ee.SelectEntityByName("Query1", "QUERIES/JS");
    agHelper.ActionContextMenuWithInPane("Copy to page", "Page3");
    agHelper.WaitUntilToastDisappear(
      "Query1 copied to page Page3 successfully",
    );
    ee.SelectEntityByName("Page3");
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.AssertEntityPresenceInExplorer("JSObject1");
    ee.AssertEntityAbsenceInExplorer("JSObject1Copy");
  });

  after(() => {
    //Deleting test data
    ee.ActionContextMenuByEntityName("Page2", "Delete", "Are you sure?"); //No page1 since its home page
    ee.ActionContextMenuByEntityName("Page3", "Delete", "Are you sure?");
    dataSources.DeleteDatasouceFromActiveTab(dsName);
  });
});
