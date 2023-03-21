import * as _ from "../../../../support/Objects/ObjectsCore";
let dataSet: any, valueToTest: any, jsName: any;

describe("Validate JSObj binding to Table widget", () => {
  before(() => {
    cy.fixture("listwidgetdsl").then((val: any) => {
      _.agHelper.AddDsl(val);
    });

    cy.fixture("example").then(function (data: any) {
      dataSet = data;
    });
  });

  it("1. Add users api and bind to JSObject", () => {
    cy.fixture("datasources").then((datasourceFormData: any) => {
      _.apiPage.CreateAndFillApi(datasourceFormData["mockApiUrl"]);
    });
    _.apiPage.RunAPI();
    _.agHelper.GetNClick(_.dataSources._queryResponse("JSON"));
    _.apiPage.ReadApiResponsebyKey("name");
    cy.get("@apiResp").then((value) => {
      valueToTest = value;
      cy.log("valueToTest to test returned is :" + valueToTest);
      //cy.log("value to test returned is :" + value)
    }); //Since now mock-api is generating random data, this valueToTest value cannot be used in subsequent tests to validate

    _.jsEditor.CreateJSObject("return Api1.data;", {
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

  it("2. Validate the Api data is updated on List widget + Bug 12438", function () {
    _.entityExplorer.SelectEntityByName("List1", "Widgets");
    _.propPane.UpdatePropertyFieldValue(
      "Items",
      (("{{" + jsName) as string) + ".myFun1()}}",
    );
    cy.get(_.locators._textWidget).should("have.length", 8);
    _.deployMode.DeployApp(_.locators._textWidgetInDeployed);
    _.agHelper.AssertElementLength(_.locators._textWidgetInDeployed, 8);
    cy.wait("@postExecute").then((interception: any) => {
      valueToTest = JSON.stringify(
        interception.response.body.data.body[0].name,
      ).replace(/['"]+/g, "");
      cy.get(_.locators._textWidgetInDeployed)
        .first()
        .invoke("text")
        .then((text) => {
          expect(text).to.equal((valueToTest as string).trimEnd());
        });
    });
    _.table.AssertPageNumber_List(1);
    _.table.NavigateToNextPage_List();
    _.table.AssertPageNumber_List(2);
    _.agHelper.AssertElementLength(_.locators._textWidgetInDeployed, 8);
    _.table.NavigateToNextPage_List();
    _.table.AssertPageNumber_List(3, true);
    _.agHelper.AssertElementLength(_.locators._textWidgetInDeployed, 4);
    _.table.NavigateToPreviousPage_List();
    _.table.AssertPageNumber_List(2);
    _.agHelper.AssertElementLength(_.locators._textWidgetInDeployed, 8);
    _.table.NavigateToPreviousPage_List();
    _.table.AssertPageNumber_List(1);
    _.agHelper.AssertElementLength(_.locators._textWidgetInDeployed, 8);
    _.deployMode.NavigateBacktoEditor();
  });

  it("3. Validate the List widget + Bug 12438 ", function () {
    _.entityExplorer.SelectEntityByName("List1", "Widgets");
    _.propPane.MoveToTab("STYLE");
    _.propPane.UpdatePropertyFieldValue("Item Spacing (px)", "50");
    cy.get(_.locators._textWidget).should("have.length", 6);
    _.deployMode.DeployApp(_.locators._textWidgetInDeployed);
    _.agHelper.AssertElementLength(_.locators._textWidgetInDeployed, 6);
    cy.wait("@postExecute").then((interception: any) => {
      valueToTest = JSON.stringify(
        interception.response.body.data.body[0].name,
      ).replace(/['"]+/g, "");
      cy.get(_.locators._textWidgetInDeployed)
        .first()
        .invoke("text")
        .then((text) => {
          expect(text).to.equal((valueToTest as string).trimEnd());
        });
    });
    _.table.AssertPageNumber_List(1);
    _.agHelper.AssertElementLength(_.locators._textWidgetInDeployed, 6);
    _.table.NavigateToNextPage_List();
    _.table.AssertPageNumber_List(2);
    _.agHelper.AssertElementLength(_.locators._textWidgetInDeployed, 6);
    _.table.NavigateToNextPage_List();
    _.table.AssertPageNumber_List(3);
    _.agHelper.AssertElementLength(_.locators._textWidgetInDeployed, 6);
    _.table.NavigateToNextPage_List();
    _.table.AssertPageNumber_List(4, true);
    _.agHelper.AssertElementLength(_.locators._textWidgetInDeployed, 2);
    _.table.NavigateToPreviousPage_List();
    _.table.AssertPageNumber_List(3);
    _.agHelper.AssertElementLength(_.locators._textWidgetInDeployed, 6);
    _.table.NavigateToPreviousPage_List();
    _.table.AssertPageNumber_List(2);
    _.agHelper.AssertElementLength(_.locators._textWidgetInDeployed, 6);
    _.table.NavigateToPreviousPage_List();
    _.table.AssertPageNumber_List(1);
    _.agHelper.AssertElementLength(_.locators._textWidgetInDeployed, 6);
    //_.agHelper.NavigateBacktoEditor()
  });
});
