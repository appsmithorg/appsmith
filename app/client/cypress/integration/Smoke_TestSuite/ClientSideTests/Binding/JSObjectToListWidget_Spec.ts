import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dataSet: any, valueToTest: any, jsName: any;
let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators,
  apiPage = ObjectsRegistry.ApiPage,
  table = ObjectsRegistry.Table,
  deployMode = ObjectsRegistry.DeployMode,
  propPane = ObjectsRegistry.PropertyPane;

describe("Validate JSObj binding to Table widget", () => {
  before(() => {
    cy.fixture("listwidgetdsl").then((val: any) => {
      agHelper.AddDsl(val);
    });

    cy.fixture("example").then(function(data: any) {
      dataSet = data;
    });
  });

  it("1. Add users api and bind to JSObject", () => {
    apiPage.CreateAndFillApi(dataSet.userApi + "/users");
    apiPage.RunAPI();
    apiPage.ReadApiResponsebyKey("name");
    cy.get("@apiResp").then((value) => {
      valueToTest = value;
      cy.log("valueToTest to test returned is :" + valueToTest);
      //cy.log("value to test returned is :" + value)
    });
    jsEditor.CreateJSObject("return Api1.data.users;", {
      paste: false,
      completeReplace: false,
      toRun: true,
      shouldCreateNewJSObj: true,
    });
    cy.get("@jsObjName").then((jsObj) => {
      jsName = jsObj;
      cy.log("jsName returned is :" + jsName);
    });
  });

  it("2. Validate the Api data is updated on List widget + Bug 12438", function() {
    ee.SelectEntityByName("List1", "WIDGETS");
    propPane.UpdatePropertyFieldValue(
      "Items",
      (("{{" + jsName) as string) + ".myFun1()}}",
    );
    cy.get(locator._textWidget).should("have.length", 8);
    deployMode.DeployApp(locator._textWidgetInDeployed);
    agHelper.AssertElementLength(locator._textWidgetInDeployed, 8);
    cy.get(locator._textWidgetInDeployed)
      .first()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal((valueToTest as string).trimEnd());
      });

    table.AssertPageNumber_List(1);
    table.NavigateToNextPage_List();
    table.AssertPageNumber_List(2);
    agHelper.AssertElementLength(locator._textWidgetInDeployed, 8);
    table.NavigateToNextPage_List();
    table.AssertPageNumber_List(3, true);
    agHelper.AssertElementLength(locator._textWidgetInDeployed, 4);
    table.NavigateToPreviousPage_List();
    table.AssertPageNumber_List(2);
    agHelper.AssertElementLength(locator._textWidgetInDeployed, 8);
    table.NavigateToPreviousPage_List();
    table.AssertPageNumber_List(1);
    agHelper.AssertElementLength(locator._textWidgetInDeployed, 8);
    deployMode.NavigateBacktoEditor();
  });

  it("3. Validate the List widget + Bug 12438 ", function() {
    ee.SelectEntityByName("List1", "WIDGETS");
    propPane.UpdatePropertyFieldValue("Item Spacing (px)", "50");
    cy.get(locator._textWidget).should("have.length", 6);
    deployMode.DeployApp(locator._textWidgetInDeployed);
    agHelper.AssertElementLength(locator._textWidgetInDeployed, 6);
    cy.get(locator._textWidgetInDeployed)
      .first()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal((valueToTest as string).trimEnd());
      });

    table.AssertPageNumber_List(1);
    agHelper.AssertElementLength(locator._textWidgetInDeployed, 6);
    table.NavigateToNextPage_List();
    table.AssertPageNumber_List(2);
    agHelper.AssertElementLength(locator._textWidgetInDeployed, 6);
    table.NavigateToNextPage_List();
    table.AssertPageNumber_List(3);
    agHelper.AssertElementLength(locator._textWidgetInDeployed, 6);
    table.NavigateToNextPage_List();
    table.AssertPageNumber_List(4, true);
    agHelper.AssertElementLength(locator._textWidgetInDeployed, 2);
    table.NavigateToPreviousPage_List();
    table.AssertPageNumber_List(3);
    agHelper.AssertElementLength(locator._textWidgetInDeployed, 6);
    table.NavigateToPreviousPage_List();
    table.AssertPageNumber_List(2);
    agHelper.AssertElementLength(locator._textWidgetInDeployed, 6);
    table.NavigateToPreviousPage_List();
    table.AssertPageNumber_List(1);
    agHelper.AssertElementLength(locator._textWidgetInDeployed, 6);
    //agHelper.NavigateBacktoEditor()
  });
});
