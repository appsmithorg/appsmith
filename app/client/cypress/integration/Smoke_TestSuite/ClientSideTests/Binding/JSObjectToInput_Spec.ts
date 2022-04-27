import { ObjectsRegistry } from "../../../../support/Objects/Registry"

let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators;

describe("Validate JSObjects binding to Input widget", () => {
  before(() => {
    cy.fixture('formInputTableDsl').then((val: any) => {
      agHelper.AddDsl(val)
    });
  });

  let jsOjbNameReceived: any;

  it("1. Bind Input widget with JSObject", function () {
    jsEditor.CreateJSObject('return "Success";', false);
    ee.expandCollapseEntity("WIDGETS")//to expand widgets
    ee.expandCollapseEntity("Form1")
    ee.SelectEntityByName("Input2")
    cy.get(locator._inputWidget).last().invoke("attr", "value").should("equal", 'Hello');//Before mapping JSObject value of input
    cy.get("@jsObjName").then((jsObjName) => {
      jsOjbNameReceived = jsObjName;
      jsEditor.EnterJSContext("Default Text", "{{" + jsObjName + ".myFun1()}}")
    });
    cy.get(locator._inputWidget).last().invoke("attr", "value").should("equal", 'Success');//After mapping JSObject value of input
    agHelper.DeployApp(locator._inputWidgetInDeployed)
    cy.get(locator._inputWidgetInDeployed).first().should('have.value', 'Hello')
    cy.get(locator._inputWidgetInDeployed).last().should('have.value', 'Success')
    agHelper.NavigateBacktoEditor()

    // cy.get(locator._inputWidget)
    //   .last()
    //   .within(() => {
    //     cy.get("input")
    //       .invoke("attr", "value")
    //       .should("equal", 'Success');
    //   });
  });

  it.skip("2. Bug 10284, 11529 - Verify autosave while editing JSObj & reference changes when JSObj is mapped", function () {
    ee.SelectEntityByName(jsOjbNameReceived as string, 'QUERIES/JS')
    jsEditor.EditJSObj("myFun1", "newName")

    //jsEditor.CreateJSObject('return "Success";', true);
    // ee.expandCollapseEntity("Form1")
    // ee.SelectEntityByName("Input2")
    // cy.get("@jsObjName").then((jsObjName) => {
    //   jsEditor.EnterJSContext("defaulttext", "{{" + jsObjName + ".myFun1()}}")
    // });
    // // cy.wait("@updateLayout").should(
    // //   "have.nested.property",
    // //   "response.body.responseMeta.status",
    // //   200,
    // // );
    // cy.get(locator._inputWidget).last().invoke("attr", "value").should("equal", 'Success');
    // agHelper.DeployApp(locator._inputWidgetInDeployed)
    // cy.get(locator._inputWidgetInDeployed).first().should('have.value', 'Hello')
    // cy.get(locator._inputWidgetInDeployed).last().should('have.value', 'Success')
  });

});