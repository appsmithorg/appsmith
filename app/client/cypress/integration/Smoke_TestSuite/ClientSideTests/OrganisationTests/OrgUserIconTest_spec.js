/// <reference types="Cypress" />

const homePage = require("../../../../locators/HomePage.json");

describe("Check if org has user icons on homepage", function() {
  let orgid;

  it("create org and check if user icons exists in that org on homepage", function() {
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      orgid = uid;
      localStorage.setItem("OrgName", orgid);
      cy.createOrg(orgid);
      cy.get(homePage.orgList.concat(orgid).concat(")"))
        .scrollIntoView()
        .should("be.visible")
        .within(() => {
          cy.get(homePage.shareUserIcons)
            .first()
            .should("be.visible");
        });
    });
    cy.LogOut();
  });
});
