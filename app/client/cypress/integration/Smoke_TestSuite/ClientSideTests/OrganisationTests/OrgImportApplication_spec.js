const homePage = require("../../../../locators/HomePage.json");

describe("Organization Import Application", function() {
  let orgid;
  let newOrganizationName;

  it("Can Import Application", function() {
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      orgid = uid;
      localStorage.setItem("OrgName", orgid);
      cy.createOrg();
      cy.wait("@createOrg").then((interception) => {
        newOrganizationName = interception.response.body.data.name;
        cy.renameOrg(newOrganizationName, orgid);
        cy.get(homePage.orgImportAppOption).click({ force: true });
      });
    });
  });

  // it("Open the org general settings and update org email. The update should reflect in the org.", function() {
  //   cy.createOrg();
  //   cy.wait("@createOrg").then((interception) => {
  //     newOrganizationName = interception.response.body.data.name;
  //     cy.renameOrg(newOrganizationName, orgid);
  //     cy.get(homePage.orgSettingOption).click({ force: true });
  //   });
  //   cy.get(homePage.orgEmailInput).clear();
  //   cy.get(homePage.orgEmailInput).type(Cypress.env("TESTUSERNAME2"));
  //   cy.wait("@updateOrganization").should(
  //     "have.nested.property",
  //     "response.body.responseMeta.status",
  //     200,
  //   );
  //   cy.get(homePage.orgEmailInput).should(
  //     "have.value",
  //     Cypress.env("TESTUSERNAME2"),
  //   );
  // });

  // it("Upload logo / delete logo and validate", function() {
  //   const fixturePath = "appsmithlogo.png";
  //   cy.xpath(homePage.uploadLogo).attachFile(fixturePath);
  //   cy.wait("@updateLogo").should(
  //     "have.nested.property",
  //     "response.body.responseMeta.status",
  //     200,
  //   );
  //   cy.xpath(homePage.membersTab).click({ force: true });
  //   cy.xpath(homePage.generalTab).click({ force: true });
  //   cy.get(homePage.removeLogo)
  //     .last()
  //     .should("be.hidden")
  //     .invoke("show")
  //     .click({ force: true });
  //   cy.wait("@deleteLogo").should(
  //     "have.nested.property",
  //     "response.body.responseMeta.status",
  //     200,
  //   );
  // });
});
