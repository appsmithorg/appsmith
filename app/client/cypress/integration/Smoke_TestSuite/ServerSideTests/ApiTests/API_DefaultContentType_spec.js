const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
import appPage from "../../../../locators/CMSApplocators";
import apiEditor from "../../../../locators/ApiEditor";

describe("API Panel request body", function() {
  it("Check whether the default content-type changes on changing method types and remains unchanged on switching to GET", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("FirstAPI");

    // Checking for default Body type to be NONE
    cy.contains(apiEditor.bodyTab).click({ force: true });
    cy.get(apiEditor.bodyTypeSelected).should("have.text", "NONE");

    //Switch to headers tab
    cy.contains(apiEditor.headersTab).click();

    // Changing method type to POST
    cy.get(apiEditor.ApiVerb).click();
    cy.xpath(appPage.selectPost).click();

    // Checking Header for POST Type
    cy.get(`${apiwidget.headerKey} .CodeMirror .CodeMirror-code`)
      .first()
      .should("have.text", "content-type");
    cy.get(`${apiwidget.headerValue} .CodeMirror .CodeMirror-code`)
      .first()
      .should("have.text", "application/json");

    // Checking Body type to be JSON
    cy.contains(apiEditor.bodyTab).click({ force: true });
    cy.get(apiEditor.bodyTypeSelected).should("have.text", "JSON");

    // Changing method type to GET
    cy.get(apiEditor.ApiVerb)
      .first()
      .click();
    cy.xpath(appPage.selectGet)
      .first()
      .click();

    // Checking Header for GET Type
    cy.contains(apiEditor.headersTab).click();
    cy.get(`${apiwidget.headerKey} .CodeMirror .CodeMirror-code`)
      .first()
      .should("have.text", "content-type");
    cy.get(`${apiwidget.headerValue} .CodeMirror .CodeMirror-code`)
      .first()
      .should("have.text", "application/json");

    cy.DeleteAPI();
  });

  it("Bug 14624 - Verifying the content-type none is not added", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("FirstAPI");

    // Checking for default Body type to be NONE
    cy.contains(apiEditor.bodyTab).click({ force: true });
    cy.get(apiEditor.bodyTypeSelected).should("have.text", "NONE");

    //Switch to headers tab
    cy.contains(apiEditor.headersTab).click();

    // Checking Header to not have content-type:none
    cy.get(`${apiwidget.headerKey} .CodeMirror .CodeMirror-code`)
      .first()
      .should("not.have.text", "content-type");
    cy.get(`${apiwidget.headerValue} .CodeMirror .CodeMirror-code`)
      .first()
      .should("not.have.text", "none");
    cy.DeleteAPI();
  });
});
