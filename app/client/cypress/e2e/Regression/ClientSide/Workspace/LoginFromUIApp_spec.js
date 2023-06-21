import {
  entityExplorer,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";
let pageid;

describe("Login from UI and check the functionality", function () {
  it("1. Login/create page/delete page/delete app from UI", function () {
    const appname = localStorage.getItem("AppName");
    cy.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.SearchApp(appname);
    cy.get("#loading").should("not.exist");
    //cy.wait(5000);
    cy.generateUUID().then((uid) => {
      pageid = uid;
      cy.Createpage(pageid);
      cy.get(`.t--entity-name`).contains(pageid).trigger("mouseover");
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: pageid,
        action: "Delete",
        entityType: entityItems.Page,
      });
    });
  });
});
