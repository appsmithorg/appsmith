const explorer = require("../../../../locators/explorerlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
let ee = ObjectsRegistry.EntityExplorer;

const firstApiName = "First";
const secondApiName = "Second";

describe("Api Naming conflict on a page test", function() {
  it("1. Expects actions on the same page cannot have identical names", function() {
    cy.log("Login Successful");
    // create an API
    cy.NavigateToAPI_Panel();
    cy.CreateAPI(firstApiName);

    // create another API
    cy.NavigateToAPI_Panel();
    cy.CreateAPI(secondApiName);
    ee.ExpandCollapseEntity("QUERIES/JS", true);
    // try to rename one of the APIs with an existing API name
    cy.get(`.t--entity-item:contains(${secondApiName})`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.selectAction("Edit Name");
    //cy.RenameEntity(tabname);
    cy.get(explorer.editEntity)
      .last()
      .type(firstApiName, { force: true });
    //cy.RenameEntity(firstApiName);
    cy.validateMessage(firstApiName);
    cy.ClearSearch();
    cy.get(`.t--entity-item:contains(${secondApiName})`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.deleteActionAndConfirm();
    cy.get(`.t--entity-item:contains(${firstApiName})`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.deleteActionAndConfirm();
  });
});

describe("Api Naming conflict on different pages test", function() {
  it("2. It expects actions on different pages can have identical names", function() {
    cy.log("Login Successful");
    // create a new API
    cy.CreateAPI(firstApiName);
    ee.ExpandCollapseEntity("QUERIES/JS", true);
    // create a new page and an API on that page
    cy.Createpage("Page2");
    cy.CreateAPI(firstApiName);
    ee.ExpandCollapseEntity("QUERIES/JS", true);
    cy.get(".t--entity-name")
      .contains(firstApiName)
      .should("exist");
    cy.get(`.t--entity-item:contains(${firstApiName})`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.deleteActionAndConfirm();
    cy.get(`.t--entity-item:contains(Page2)`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.deleteActionAndConfirm();
    cy.get(`.t--entity-item:contains(${firstApiName})`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.deleteActionAndConfirm();
    cy.wait(1000);
  });
});

describe("Entity Naming conflict test", function() {
  it("3. Expects JS objects and actions to not have identical names on the same page.", function() {
    cy.log("Login Successful");
    ee.ExpandCollapseEntity("QUERIES/JS", true);
    // create JS object and name it
    cy.createJSObject('return "Hello World";');

    cy.get(`.t--entity-item:contains('JSObject1')`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.selectAction("Edit Name");
    cy.get(explorer.editEntity)
      .last()
      .type(firstApiName, { force: true })
      .type("{enter}");
    cy.wait(2000); //for the changed JS name to reflect

    cy.CreateAPI(secondApiName);

    cy.get(`.t--entity-item:contains(${secondApiName})`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.selectAction("Edit Name");

    cy.get(explorer.editEntity)
      .last()
      .type(firstApiName, { force: true });
    cy.VerifyPopOverMessage(firstApiName + " is already being used.", true);
    cy.get("body").click(0, 0);
    cy.wait(2000);
    cy.get(`.t--entity-item:contains(${firstApiName})`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.deleteActionAndConfirm();
    cy.get(`.t--entity-item:contains(${secondApiName})`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.deleteActionAndConfirm();
  });
});
