let pageid;
let appId;

describe("Login from UI and check the functionality", function() {
  it("Login/create page/delete page/delete app from UI", function() {
    const appname = localStorage.getItem("AppName");
    cy.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.SearchApp(appname);
    cy.get("#loading").should("not.exist");
    cy.wait("@getPropertyPane");
    cy.get("@getPropertyPane").should("have.property", "status", 200);
    cy.generateUUID().then(uid => {
      pageid = uid;
      cy.Createpage(pageid);
      cy.DeletepageFromSideBar();
    });
    cy.wait("@deletePage");
    cy.get("@deletePage").should("have.property", "status", 200);
    cy.DeleteApp(appname);
    cy.wait("@deleteApplication");
    cy.get("@deleteApplication").should("have.property", "status", 200);
  });
});
