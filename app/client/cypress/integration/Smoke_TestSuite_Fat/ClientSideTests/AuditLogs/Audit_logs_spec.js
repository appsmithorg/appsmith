const Access = {
  AdminSettingsEntryLink: ".admin-settings-menu-option",
  LeftPaneAuditLogsLink:
    "[data-testid='t--enterprise-settings-category-item-audit-logs']",
};

const Header = {
  Heading: "[data-testid='t--header-heading-container']",
  SubHeadings: "[data-testid='t--header-subHeadings-container']",
};

const Carousel = {
  Left: "[data-testid='t--carousel-left']",
  Right: "[data-testid='t--carousel-right']",
};

const UpgradePage = {
  UpgradeContainer: "[data-testid='t--upgrade-page-container']",
  HeaderContainer: "[data-testid='t--upgrade-page-header-container']",
  CarouselContainer: "[data-testid='t--upgrade-page-carousel-container']",
  FooterContainer: "[data-testid='t--upgrade-page-footer-container']",
  ...Header,
  ...Carousel,
};

const locators = { ...Access, ...UpgradePage };

describe("Audit logs", () => {
  it("super user can access audit logs page", () => {
    if (Cypress.env("Edition") === 0) {
      cy.LogOut();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      cy.visit("/applications");
      cy.get(locators.AdminSettingsEntryLink).should("be.visible");
      cy.get(locators.AdminSettingsEntryLink).click();
      cy.url().should("contain", "/settings/general");
      cy.get(locators.LeftPaneAuditLogsLink).should("be.visible");
      cy.get(locators.LeftPaneAuditLogsLink).click();
      cy.wait(2000);
      cy.get(locators.UpgradeContainer).should("be.visible");
      cy.get(locators.HeaderContainer).should("be.visible");
      cy.get(locators.CarouselContainer).should("be.visible");
      cy.get(locators.FooterContainer).should("be.visible");

      cy.get(locators.Heading)
        .should("be.visible")
        .should("have.text", "Introducing Audit Logs");
      cy.get(locators.SubHeadings)
        .should("be.visible")
        .should(
          "have.text",
          "See a timestamped trail of events in your workspace. Filter by type of event, user, resource ID, and time. Drill down into each event to investigate further.",
        );

      cy.get(locators.Left)
        .should("be.visible")
        .children()
        .should("have.length", 3);

      cy.get(locators.Right)
        .should("be.visible")
        .children()
        .should("have.length", 1);
    }
  });
});
