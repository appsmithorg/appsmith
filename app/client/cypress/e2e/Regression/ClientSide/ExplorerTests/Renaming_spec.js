const explorer = require("../../../../locators/explorerlocators.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

const firstApiName = "First";
const secondApiName = "Second";

describe("Api Naming conflict on a page test", function () {
  it("1. Expects actions on the same page cannot have identical names", function () {
    // create an API
    _.apiPage.CreateApi(firstApiName);
    // create another API
    _.apiPage.CreateApi(secondApiName);
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    // try to rename one of the APIs with an existing API name
    cy.get(`.t--entity-item:contains(${secondApiName})`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.selectAction("Edit name");
    //cy.RenameEntity(tabname);
    cy.get(explorer.editEntity).last().type(firstApiName, { force: true });
    //cy.RenameEntity(firstApiName);
    cy.validateMessage(firstApiName);
    _.agHelper.PressEnter();
    _.entityExplorer.ActionContextMenuByEntityName(secondApiName, "Delete");
    _.entityExplorer.ActionContextMenuByEntityName(firstApiName, "Delete");
  });
});

describe("Api Naming conflict on different pages test", function () {
  it("2. It expects actions on different pages can have identical names", function () {
    // create a new API
    cy.CreateAPI(firstApiName);
    _.entityExplorer.ExpandCollapseEntity("Queries/JS", true);

    // create a new page and an API on that page
    _.entityExplorer.AddNewPage();
    cy.CreateAPI(firstApiName);
    _.entityExplorer.ExpandCollapseEntity("Queries/JS", true);
    cy.get(".t--entity-name").contains(firstApiName).should("exist");
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

describe("Entity Naming conflict test", function () {
  it("3. Expects JS objects and actions to not have identical names on the same page.", function () {
    _.entityExplorer.ExpandCollapseEntity("Queries/JS", true);
    // create JS object and name it
    _.jsEditor.CreateJSObject('return "Hello World";');
    cy.get(`.t--entity-item:contains('JSObject1')`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.selectAction("Edit name");
    cy.get(explorer.editEntity)
      .last()
      .type(firstApiName, { force: true })
      .type("{enter}");
    cy.wait(2000); //for the changed JS name to reflect

    cy.CreateAPI(secondApiName);

    cy.get(`.t--entity-item:contains(${secondApiName})`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.selectAction("Edit name");

    cy.get(explorer.editEntity).last().type(firstApiName, { force: true });
    _.entityExplorer.ValidateDuplicateMessageToolTip(firstApiName);
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
