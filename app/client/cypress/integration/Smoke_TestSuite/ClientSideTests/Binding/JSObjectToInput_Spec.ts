import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators,
  deployMode = ObjectsRegistry.DeployMode;

describe("Validate JSObjects binding to Input widget", () => {
  before(() => {
    cy.fixture("formInputTableDsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
  });

  let jsOjbNameReceived: any;

  it("1. Bind Input widget with JSObject", function() {
    jsEditor.CreateJSObject(`export default {
      myVar1: [],
      myVar2: {},
      myFun1: () => {
        return "Success";//write code here
      },
      myFun2: async () => {
        //use async-await or promises
      }
    }`, {
      paste: true,
      completeReplace: true,
      toRun: true,
      shouldCreateNewJSObj: true,
    });
    ee.expandCollapseEntity("WIDGETS"); //to expand widgets
    ee.expandCollapseEntity("Form1");
    ee.SelectEntityByName("Input2");
    cy.get(locator._inputWidget)
      .last()
      .invoke("attr", "value")
      .should("equal", "Hello"); //Before mapping JSObject value of input
    cy.get("@jsObjName").then((jsObjName) => {
      jsOjbNameReceived = jsObjName;
      jsEditor.EnterJSContext("Default Text", "{{" + jsObjName + ".myFun1()}}");
    });
    cy.get(locator._inputWidget)
      .last()
      .invoke("attr", "value")
      .should("equal", "Success"); //After mapping JSObject value of input
    deployMode.DeployApp(locator._inputWidgetInDeployed);
    cy.get(locator._inputWidgetInDeployed)
      .first()
      .should("have.value", "Hello");
    cy.get(locator._inputWidgetInDeployed)
      .last()
      .should("have.value", "Success");
    agHelper.NavigateBacktoEditor();

    // cy.get(locator._inputWidget)
    //   .last()
    //   .within(() => {
    //     cy.get("input")
    //       .invoke("attr", "value")
    //       .should("equal", 'Success');
    //   });
  });

  it("2. Bug 11529 - Verify autosave while editing JSObj & reference changes when JSObj is mapped", function() {
    const jsBody = `export default {
      myVar1: [],
      myVar2: {},
      renamed: () => {
        return "Success";//write code here
      },
      myFun2: async () => {
        //use async-await or promises
      }
    }`;
    ee.SelectEntityByName(jsOjbNameReceived as string, "QUERIES/JS");
    jsEditor.EditJSObj(jsBody);
    agHelper.AssertAutoSave();

    ee.expandCollapseEntity("Form1");
    ee.SelectEntityByName("Input2");
    cy.get(locator._inputWidget).last().invoke("attr", "value").should("equal", 'Success'); //Function is renamed & reference is checked if updated properly!
    deployMode.DeployApp(locator._inputWidgetInDeployed)
    cy.get(locator._inputWidgetInDeployed).first().should('have.value', 'Hello')
    cy.get(locator._inputWidgetInDeployed).last().should('have.value', 'Success')
  });
});
