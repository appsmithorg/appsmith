/// <reference types="Cypress" />

const dsl = require("../../../../fixtures/formInputTableDsl.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Binding the table widget and input Widget", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Input widget test with default value from table widget", function () {
    _.entityExplorer.ExpandCollapseEntity("Form1");
    _.entityExplorer.SelectEntityByName("Input1");
    cy.testJsontext("defaultvalue", testdata.defaultInputWidget + "}}");
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    //validation of data displayed in input widgets based on selected row
    _.entityExplorer.SelectEntityByName("Table1");

    cy.testJsontext("defaultselectedrow", "2");
    cy.readTabledataPublish("2", "0").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("6788734");
      cy.log("the value is" + tabValue);
      cy.get(publish.inputWidget + " " + "input")
        .first()
        .invoke("attr", "value")
        .should("contain", tabValue);
    });
  });
});
