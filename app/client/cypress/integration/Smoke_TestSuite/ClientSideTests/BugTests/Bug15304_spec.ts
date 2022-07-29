import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const {
  AggregateHelper: agHelper,
  ApiPage: apiPage,
  EntityExplorer: ee,
  JSEditor: jsEditor,
} = ObjectsRegistry;

describe("Move objects/actions/queries to different pages", () => {
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
});
