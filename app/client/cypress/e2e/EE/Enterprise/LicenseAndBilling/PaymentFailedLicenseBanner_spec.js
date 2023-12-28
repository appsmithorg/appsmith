import LicenseLocators from "../../../../locators/LicenseLocators.json";
import { agHelper, homePage } from "../../../../support/Objects/ObjectsCore";

describe(
  "Payment Failed License Banner",
  { tags: ["@tag.LicenseAndBilling", "@tag.excludeForAirgap"] },
  function () {
    it("1. should show payment failure banner for tenants with payment failure", function () {
      cy.interceptLicenseApi({
        licenseStatus: "ACTIVE",
        licenseType: "PAID",
        licenseStatus: "IN_GRACE_PERIOD",
      });
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      cy.wait(2000);
      cy.get(LicenseLocators.billingBanner).should("be.visible");
    });

    it("2. should show payment failure banner for tenants with payment failure with red color for less than 3 days", function () {
      cy.interceptLicenseApi({
        licenseStatus: "ACTIVE",
        licenseType: "PAID",
        licenseStatus: "IN_GRACE_PERIOD",
        expiry: (new Date().getTime() + 2 * 24 * 60 * 60 * 1000) / 1000,
      });
      agHelper.RefreshPage("getReleaseItems");
      cy.get(LicenseLocators.billingBanner).contains(
        "Your most recent payment has failed. Update your payment methods or your instances will stop working",
      );
      cy.get(LicenseLocators.billingBanner).should(
        "have.css",
        "background-color",
        "rgb(255, 242, 242)",
      );
    });

    it("3. should not have banner in paid license", () => {
      cy.interceptLicenseApi({ licenseStatus: "ACTIVE", licenseType: "PAID" });
      agHelper.RefreshPage("getReleaseItems");
      cy.get(LicenseLocators.billingBanner).should("not.exist");
    });

    it("4. should not show payment failure banner for tenants with payment failure for non admin users", function () {
      homePage.LogOutviaAPI();
      homePage.LogintoApp(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
      );
      cy.interceptLicenseApi({
        licenseStatus: "ACTIVE",
        licenseType: "PAID",
        licenseStatus: "IN_GRACE_PERIOD",
      });
      agHelper.Sleep(3000);
      agHelper.RefreshPage("getReleaseItems");
      agHelper.AssertElementAbsence(LicenseLocators.billingBanner);
    });
  },
);
