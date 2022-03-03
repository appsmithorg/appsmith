// import { ApiPage } from "../../../../support/Pages/ApiPage";
// import { AggregateHelper } from "../../../../support/Pages/AggregateHelper";
// import { JSEditor } from "../../../../support/Pages/JSEditor";
// import { CommonLocators } from "../../../../support/Objects/CommonLocators";

// const apiPage = new ApiPage();
// const agHelper = new AggregateHelper();
// const jsEditor = new JSEditor();
// const locator = new CommonLocators();

// let dataSet: any, valueToTest: any, jsName: any;

// describe("Validate Create Api and Bind to Table widget via JSObject", () => {
//   before(() => {
//     cy.fixture('listwidgetdsl').then((val: any) => {
//       agHelper.AddDsl(val)
//     });

//     cy.fixture("example").then(function (data: any) {
//       dataSet = data;
//     });
//   });

//   it("1. Add users api and bind to JSObject", () => {
//     apiPage.CreateAndFillApi(dataSet.userApi + "/users")
//     apiPage.RunAPI()
//     apiPage.ReadApiResponsebyKey("name");
//     cy.get("@apiResp").then((value) => {
//       valueToTest = value;
//       cy.log("valueToTest to test returned is :" + valueToTest)
//       //cy.log("value to test returned is :" + value)
//     })
//     jsEditor.CreateJSObject("return Api1.data.users;", false);
//     cy.get("@jsObjName").then((jsObj) => {
//       jsName = jsObj;
//       cy.log("jsName returned is :" + jsName)
//     })
//   });

//   it("2. Validate the Api data is updated on List widget", function () {
//     agHelper.SelectEntityByName("Widgets")//to expand widgets
//     agHelper.SelectEntityByName("List1");
//     jsEditor.EnterJSContext("items", "{{" + jsName as string + ".myFun1()}}")
//     cy.get(locator._textWidget).should("have.length", 8);
//     cy.get(locator._textWidget)
//       .first()
//       .invoke("text")
//       .then((text) => {
//         expect(text).to.equal((valueToTest as string).trimEnd());
//       });
//     agHelper.DeployApp();
//     cy.get(locator._textWidgetInDeployed).should("have.length", 8);
//     cy.get(locator._textWidgetInDeployed)
//       .first()
//       .invoke("text")
//       .then((text) => {
//         expect(text).to.equal((valueToTest as string).trimEnd());
//       });
//   });

//   it("3. Validate the List widget ", function () {
//     agHelper.NavigateBacktoEditor()
//     agHelper.SelectEntityByName("Widgets")//to expand widgets
//     agHelper.SelectEntityByName("List1");
//     jsEditor.EnterJSContext("itemspacing\\(px\\)", "50")
//     cy.get(locator._textWidget).should("have.length", 6);
//     cy.get(locator._textWidget)
//       .first()
//       .invoke("text")
//       .then((text) => {
//         expect(text).to.equal((valueToTest as string).trimEnd());
//       });
//     agHelper.DeployApp();
//     cy.get(locator._textWidgetInDeployed).should("have.length", 6);
//     cy.get(locator._textWidgetInDeployed).first()
//       .invoke("text")
//       .then((text) => {
//         expect(text).to.equal((valueToTest as string).trimEnd());
//       });
//     agHelper.NavigateBacktoEditor()
//   });
// });
