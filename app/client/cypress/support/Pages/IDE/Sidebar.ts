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
      .click({ force: true })
      .should("have.attr", "data-selected", willFail ? "false" : "true");
  }

  assertVisible() {
    cy.get(this.locators.sidebar).should("be.visible");
  }
}
