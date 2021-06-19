const homePage = require("../../../../locators/HomePage.json");

describe("Organization Import Application", function() {
  let orgid;
  let newOrganizationName;
  const fixtureDummyAppPath = "application-file.json";
  it("Can Import Application", function() {
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      orgid = uid;
      localStorage.setItem("OrgName", orgid);
      cy.createOrg();
      cy.wait("@createOrg").then((createOrgInterception) => {
        newOrganizationName = createOrgInterception.response.body.data.name;
        cy.renameOrg(newOrganizationName, orgid);
        cy.get(homePage.orgImportAppOption).click({ force: true });

        cy.get(homePage.orgImportAppModal).should("be.visible");
        cy.xpath(homePage.uploadLogo).attachFile(fixtureDummyAppPath);

        cy.get(homePage.orgImportAppButton).click({ force: true });
        cy.wait("@importNewApplication").then((interception) => {
          let appId = interception.response.body.data.id;
          let defaultPage = interception.response.body.data.pages.find(
            (eachPage) => !!eachPage.isDefault,
          );
          cy.get(homePage.toastMessage).should(
            "contain",
            "Application imported successfully",
          );
          cy.url().should(
            "include",
            `/applications/${appId}/pages/${defaultPage.id}/edit`,
          );
        });
      });
    });
  });
});
