import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");
import {
  entityExplorer,
  agHelper,
  deployMode,
} from "../../../../support/Objects/ObjectsCore";

describe("Binding the multiple input Widget", function () {
  before(() => {
    agHelper.AddDsl("MultipleInput");
  });

  Cypress.on("uncaught:exception", (err, runnable) => {
    // returning false here prevents Cypress from
    // failing the test
    return false;
  });

  it("1. Cyclic depedancy error message validation", function () {
    EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
    cy.testJsontext("defaultvalue", testdata.defaultMoustacheData + "}}");

    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(commonlocators.toastmsg).contains("Cyclic dependency");
  });

  it("2. Binding input widget1 and validating", function () {
    EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
    cy.testJsontext("defaultvalue", testdata.defaultdata);

    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .should("contain", testdata.defaultdata);
  });

  it("3. Binding second input widget with first input widget and validating", function () {
    cy.selectEntityByName("Input2");
    cy.testJsontext("defaultvalue", testdata.defaultMoustacheData + "}}");

    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.xpath(testdata.input2)
      .invoke("attr", "value")
      .should("contain", testdata.defaultdata);
    deployMode.DeployApp();
    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .should("contain", testdata.defaultdata);
    cy.xpath(testdata.input2)
      .invoke("attr", "value")
      .should("contain", testdata.defaultdata);
    deployMode.NavigateBacktoEditor();
  });

  it("4. Binding third input widget with first input widget and validating", function () {
    cy.CheckAndUnfoldWidgets();
    cy.selectEntityByName("Input3");
    cy.testJsontext("defaultvalue", testdata.defaultMoustacheData + "}}");

    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    deployMode.DeployApp();
    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .should("contain", testdata.defaultdata);
    cy.xpath(testdata.input2)
      .invoke("attr", "value")
      .should("contain", testdata.defaultdata);
    cy.get(publish.inputWidget + " " + "input")
      .last()
      .invoke("attr", "value")
      .should("contain", testdata.defaultdata);
  });
});
