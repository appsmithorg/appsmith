export class Sidebar {
  buttons: string[];
  locators = {
    sidebar: ".t--sidebar",
    sidebarButton: (name: string) => `.t--sidebar-${name}`,
  };

  constructor(buttons: string[]) {
    this.buttons = buttons;
  }

  navigate(button: string, willFail = false) {
    this.assertVisible();
    cy.get(this.locators.sidebar)
      .find(this.locators.sidebarButton(button))
      .as("navigateBtn")
      .click({ force: true });
    cy.get("@navigateBtn").should(
      "have.attr",
      "data-selected",
      willFail ? "false" : "true",
    );
  }

  assertVisible(timeout?: number) {
    cy.get(this.locators.sidebar, { timeout }).should("be.visible");
  }
}
