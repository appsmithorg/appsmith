const homePage = require("../../../locators/HomePage.json");
const commonlocators = require("../../../locators/commonlocators.json");

describe("Update Application", function() {
  let appname;
  let iconname;

  it("Open the application menu and update name and then check whether update is reflected in the application card", function() {
    cy.get(commonlocators.homeIcon).click({ force: true });
    appname = localStorage.getItem("AppName");
    cy.get(homePage.searchInput).type(appname);
    cy.wait(2000);

    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appMoreIcon)
      .first()
      .click({ force: true });
    cy.get(homePage.applicationName).type(appname + "{enter}");
    cy.wait("@updateApplication").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePage.applicationCardName).should("contain", appname);
  });

  it("Open the application menu and update icon and then check whether update is reflected in the application card", function() {
    cy.get(homePage.applicationIconSelector)
      .first()
      .click();
    cy.wait("@updateApplication")
      .then(xhr => {
        iconname = xhr.response.body.data.icon;
      })
      .should("have.nested.property", "response.body.responseMeta.status", 200);
    cy.get(homePage.applicationCard)
      .first()
      .within(() => {
        cy.get("a")
          .invoke("attr", "name")
          .should("equal", iconname);
      });
  });
});
