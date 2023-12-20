import LicenseLocators from "../../../../locators/LicenseLocators.json";
import AppNavigation from "../../../../locators/AppNavigation.json";
import { agHelper } from "../../../../support/Objects/ObjectsCore";
import { license } from "../../../../support/ee/ObjectsCore_EE";

describe(
  "excludeForAirgap",
  "License and Billing dashboard",
  { tags: ["@tag.LicenseAndBilling"] },
  function () {
    it("1. Admin Settings - Enterprise Plan", function () {
      cy.LogOut();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      agHelper.AssertElementVisibility(
        LicenseLocators.adminSettingsEntryLink,
        true,
      );
      agHelper.GetNClick(LicenseLocators.adminSettingsEntryLink);
      agHelper.AssertURL("/settings/general");
      // click license and billing tab
      agHelper.GetNClick(LicenseLocators.billingDashboardTab);
      agHelper.AssertURL("/settings/license");
      agHelper.Sleep(2000);
      cy.get(LicenseLocators.billingHeader).within(() => {
        agHelper.GetNAssertElementText(
          LicenseLocators.headerText,
          "License & plans",
        );
      });
      //check if the 2 sections exist
      agHelper.AssertElementExist(LicenseLocators.planSection);
      agHelper.AssertElementExist(LicenseLocators.licenseSection);

      agHelper.AssertElementExist(LicenseLocators.planCard);
      agHelper.GetNAssertElementText(
        LicenseLocators.planCardTitle,
        "Plan",
        "contain.text",
      );
      agHelper.GetNAssertElementText(
        LicenseLocators.planCardName,
        "Enterprise",
        "contain.text",
      );
      agHelper.AssertElementExist(LicenseLocators.portalBtn);
      agHelper.AssertAttribute(
        LicenseLocators.portalBtn,
        "href",
        "https://customer.appsmith.com/plans",
      );
      agHelper.AssertElementExist(LicenseLocators.licenseCard);
      agHelper.GetNAssertElementText(
        LicenseLocators.licenseCardTitle,
        "License",
      );
      agHelper.GetNAssertElementText(
        LicenseLocators.licenseKeyText,
        "VALID-LI",
        "contain.text",
      );

      //Asserting the license key is Invalid

      agHelper.GetNClick(LicenseLocators.updateLicenseBtn);
      agHelper.Sleep(2000);

      agHelper.AssertElementVisibility(AppNavigation.modal);

      cy.get(AppNavigation.modal).within(() => {
        cy.get(AppNavigation.modalHeader).within(() => {
          cy.xpath(LicenseLocators.licenseModalHeader).should(
            "have.text",
            "Update license",
          );
        });
        cy.get(LicenseLocators.licenseForm).within(() => {
          agHelper.AssertAttribute(
            LicenseLocators.licenseFormInput,
            "placeholder",
            "Paste your license key here",
          );
          agHelper.AssertElementEnabledDisabled(
            LicenseLocators.activeInstanceModalBtn,
            0,
            true,
          );
        });
        agHelper.TypeText(
          LicenseLocators.licenseFormInput,
          "INVALID-LICENSE-KEY",
        );
        agHelper.GetNClick(LicenseLocators.activeInstanceModalBtn);
        agHelper.Sleep(2000);
        cy.request({
          method: "PUT",
          url: "/api/v1/tenants/license",
          body: { key: "INVALID-LICENSE-KEY", isDryRun: true },
          failOnStatusCode: false,
        })
          .its("status")
          .should("equal", 400);
      });
      agHelper.GetNClick(AppNavigation.modalClose);
      agHelper.Sleep(2000);
      agHelper.AssertElementAbsence(AppNavigation.modal);

      //Downgrading to Business plan
      agHelper.GetNClick(LicenseLocators.updateLicenseBtn);
      agHelper.Sleep(2000);

      agHelper.AssertElementVisibility(AppNavigation.modal);
      cy.get(AppNavigation.modal).within(() => {
        cy.get(AppNavigation.modalHeader).within(() => {
          cy.xpath(LicenseLocators.licenseModalHeader).should(
            "have.text",
            "Update license",
          );
        });
        cy.get(LicenseLocators.licenseForm).within(() => {
          agHelper.AssertAttribute(
            LicenseLocators.licenseFormInput,
            "placeholder",
            "Paste your license key here",
          );
          agHelper.AssertElementEnabledDisabled(
            LicenseLocators.activeInstanceModalBtn,
            0,
            true,
          );
        });
        agHelper.TypeText(
          LicenseLocators.licenseFormInput,
          "BUSINESS-PAID-LICENSE-KEY",
        );
      });
      agHelper.GetNClick(LicenseLocators.activeInstanceModalBtn);
      agHelper.Sleep(4000);
      agHelper.AssertElementExist(AppNavigation.modal);

      //Downgrade Confirmation Modal
      cy.get(AppNavigation.modal).within(() => {
        cy.get(AppNavigation.modalHeader).within(() => {
          cy.xpath(LicenseLocators.licenseModalHeader).should(
            "have.text",
            "Downgrade",
          );
        });
        agHelper.GetNAssertElementText(
          LicenseLocators.downgradeCallout,
          "Your license key is valid. However, please note that your new key corresponds to a lower tier plan than your current plan.",
        );
        agHelper.GetNAssertElementText(
          LicenseLocators.downgradeMainText,
          "If you decide to downgrade, you will lose access to the features that are exclusive to your current plan. To learn more about how this will impact your instance, refer to our documentation.Visit docs",
        );
      });

      agHelper.GetNClick(LicenseLocators.downgradeConfirmButton);
      agHelper.Sleep(10000);

      cy.get(LicenseLocators.planCardName, { timeout: 300000 }).should(
        "contain.text",
        "Business",
      );
    });

    it("2. Admin Settings - Business Plan", function () {
      license.UpdateLicenseKey("business");
      agHelper.Sleep(4000);
      cy.LogOut();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      agHelper.AssertElementVisibility(
        LicenseLocators.adminSettingsEntryLink,
        true,
      );
      agHelper.GetNClick(LicenseLocators.adminSettingsEntryLink);
      agHelper.AssertURL("/settings/general");
      // click license and billing tab
      agHelper.GetNClick(LicenseLocators.billingDashboardTab);
      agHelper.AssertURL("/settings/license");
      agHelper.Sleep(2000);
      cy.get(LicenseLocators.billingHeader).within(() => {
        agHelper.GetNAssertElementText(
          LicenseLocators.headerText,
          "License & plans",
        );
      });

      agHelper.AssertElementExist(LicenseLocators.planSection);
      agHelper.AssertElementExist(LicenseLocators.licenseSection);

      agHelper.AssertElementExist(LicenseLocators.planCard);
      agHelper.GetNAssertElementText(
        LicenseLocators.planCardTitle,
        "Plan",
        "contain.text",
      );
      agHelper.GetNAssertElementText(
        LicenseLocators.planCardName,
        "Business",
        "contain.text",
      );
      agHelper.AssertElementExist(LicenseLocators.portalBtn);
      agHelper.AssertAttribute(
        LicenseLocators.portalBtn,
        "href",
        "https://customer.appsmith.com/plans",
      );
      agHelper.AssertElementExist(LicenseLocators.licenseCard);
      agHelper.GetNAssertElementText(
        LicenseLocators.licenseCardTitle,
        "License",
      );
      agHelper.GetNAssertElementText(
        LicenseLocators.licenseKeyText,
        "BUSINESS",
        "contain.text",
      );
    });

    it("3. Admin Settings - Free Page", function () {
      license.RemoveLicenseKey();
      agHelper.Sleep(4000);
      cy.LogOut();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      agHelper.AssertElementVisibility(
        LicenseLocators.adminSettingsEntryLink,
        true,
      );
      agHelper.GetNClick(LicenseLocators.adminSettingsEntryLink);
      agHelper.AssertURL("/settings/general");
      // click license and billing tab
      agHelper.GetNClick(LicenseLocators.billingDashboardTab);
      agHelper.AssertURL("/settings/license");
      agHelper.Sleep(2000);
      cy.get(LicenseLocators.billingHeader).within(() => {
        agHelper.GetNAssertElementText(
          LicenseLocators.headerText,
          "License & plans",
        );
      });

      agHelper.AssertElementExist(LicenseLocators.freeLicenseSection);
      agHelper.AssertElementEnabledDisabled(
        LicenseLocators.licenseActivateButtonFree,
        0,
        true,
      );
      agHelper.AssertElementExist(LicenseLocators.freeLicenseInput);
      agHelper.AssertElementExist(
        LicenseLocators.freeLicenseCustomerPortalLink,
      );
      agHelper.ClearNType(LicenseLocators.freeLicenseInput, "123456789");
      agHelper.AssertElementEnabledDisabled(
        LicenseLocators.licenseActivateButtonFree,
        0,
        false,
      );
      agHelper.ClearNType(
        LicenseLocators.freeLicenseInput,
        "BUSINESS-PAID-LICENSE-KEY",
      );
      agHelper.GetNClick(LicenseLocators.licenseActivateButtonFree);
      agHelper.Sleep(10000);

      cy.get(LicenseLocators.planCardName, { timeout: 300000 }).should(
        "contain.text",
        "Business",
      );

      cy.get(LicenseLocators.licenseKeyText, { timeout: 300000 }).should(
        "contain.text",
        "BUSINESS",
      );
    });

    it("4. Bug 1409, Cancelling after Dry Run should not cause Remove License to Fail", function () {
      license.UpdateLicenseKey("enterprise");
      agHelper.Sleep(5000);
      cy.LogOut();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));

      agHelper.GetNClick(LicenseLocators.adminSettingsEntryLink);
      agHelper.AssertURL("/settings/general");
      // click license and billing tab
      agHelper.GetNClick(LicenseLocators.billingDashboardTab);
      agHelper.AssertURL("/settings/license");
      agHelper.Sleep(2000);

      agHelper.GetNClick(LicenseLocators.updateLicenseBtn);
      agHelper.Sleep(2000);

      agHelper.AssertElementVisibility(AppNavigation.modal);

      cy.get(AppNavigation.modal).within(() => {
        agHelper.TypeText(
          LicenseLocators.licenseFormInput,
          "BUSINESS-PAID-LICENSE-KEY",
        );
      });

      agHelper.GetNClick(LicenseLocators.activeInstanceModalBtn);
      agHelper.Sleep(4000);
      agHelper.AssertElementExist(AppNavigation.modal);

      agHelper.GetNClick(LicenseLocators.downgradeCancelButton);
      agHelper.Sleep(2000);

      agHelper.GetNAssertElementText(
        LicenseLocators.planCardName,
        "Enterprise",
        "contain.text",
      );

      license.RemoveLicenseKey();
      agHelper.Sleep(4000);
      cy.LogOut();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));

      agHelper.GetNClick(LicenseLocators.adminSettingsEntryLink);
      agHelper.AssertURL("/settings/general");
      // click license and billing tab
      agHelper.GetNClick(LicenseLocators.billingDashboardTab);
      agHelper.AssertURL("/settings/license");
      agHelper.Sleep(2000);

      agHelper.AssertElementExist(LicenseLocators.freeLicenseSection);
    });
  },
);
