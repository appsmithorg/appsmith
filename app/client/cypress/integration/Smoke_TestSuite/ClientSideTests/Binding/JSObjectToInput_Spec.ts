import { AggregateHelper } from "../../../../support/Pages/AggregateHelper";
import { JSEditor } from "../../../../support/Pages/JSEditor";
import { CommonLocators } from "../../../../support/Objects/CommonLocators";

const agHelper = new AggregateHelper();
const jsEditor = new JSEditor();
const locator = new CommonLocators();

describe("Validate Create Api and Bind to Table widget via JSObject", () => {
  before(() => {
    cy.fixture('formInputTableDsl').then((val: any) => {
      agHelper.AddDsl(val)
    });
  });

  it("1. Bind Input widget with JSObject", function () {
    jsEditor.CreateJSObject('return "Success";', false);
    agHelper.SelectEntityByName("WIDGETS")//to expand widgets
    agHelper.expandCollapseEntity("Form1")
    agHelper.SelectEntityByName("Input2")
    cy.get("@jsObjName").then((jsObjName) => {
      jsEditor.EnterJSContext("defaulttext", "{{" + jsObjName + ".myFun1()}}")
    });
    cy.get(locator._inputWidget).last().invoke("attr", "value").should("equal", 'Success');
    // cy.get(locator._inputWidget)
    //   .last()
    //   .within(() => {
    //     cy.get("input")
    //       .invoke("attr", "value")
    //       .should("equal", 'Success');
    //   });
  });

  it.skip("2. Bug 10284, 11529 - Verify timeout issue with running JS Objects", function () {
    jsEditor.CreateJSObject('return "Success";', true);
    agHelper.expandCollapseEntity("Form1")
    agHelper.SelectEntityByName("Input2")
    cy.get("@jsObjName").then((jsObjName) => {
      jsEditor.EnterJSContext("defaulttext", "{{" + jsObjName + ".myFun1()}}")
    });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(locator._inputWidget).last().invoke("attr", "value").should("equal", 'Success');
  });

});