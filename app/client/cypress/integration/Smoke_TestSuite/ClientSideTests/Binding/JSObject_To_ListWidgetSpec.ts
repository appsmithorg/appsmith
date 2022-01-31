// import { ApiPage } from "../../../../support/Pages/ApiPage";
// import { AggregateHelper } from "../../../../support/Pages/AggregateHelper";
// import { JSEditor } from "../../../../support/Pages/JSEditor";
// import { CommonLocators } from "../../../../support/Objects/CommonLocators";

// const apiPage = new ApiPage();
// const agHelper = new AggregateHelper();
// const jsEditor = new JSEditor();
// const locator = new CommonLocators();

// let dataSet: any, valueToTest: any;

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
//     jsEditor.CreateJSObject("return Api1.data.users;");
//   });

//   it("2. Validate the Api data is updated on List widget", function () {
//     agHelper.SelectEntityByName("Widgets")//to expand widgets
//     agHelper.SelectEntityByName("List1");
//     jsEditor.EnterJSContext("items", "{{JSObject1.myFun1()}}")
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
//     cy.get(locator._backToEditor).click({ force: true });
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
//     cy.get(locator._backToEditor).click({ force: true });
//   });

//   it("4. Bind Input widget with JSObject", function () {
//     cy.fixture('formInputTableDsl').then((val: any) => {
//       agHelper.AddDsl(val)
//     });
//     jsEditor.CreateJSObject('return "Success";', false);
//     agHelper.SelectEntityByName("Widgets")//to expand widgets
//     agHelper.expandCollapseEntity("Form1")
//     agHelper.SelectEntityByName("Input2")
//     jsEditor.EnterJSContext("defaulttext", "{{JSObject2.myFun1()}}")
//     cy.wait("@updateLayout").should(
//       "have.nested.property",
//       "response.body.responseMeta.status",
//       200,
//     );
//     cy.get(locator._inputWidget)
//       .last()
//       .within(() => {
//         cy.get("input")
//           .invoke("attr", "value")
//           .should("equal", 'Success');
//       });
//   });
// });
