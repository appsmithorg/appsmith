export enum SidebarButton {
  Data = "Data",
  Pages = "Pages",
  Libraries = "Libraries",
  Settings = "Settings",
}
class EditorNavigation {
  locators = {
    sidebar: ".t--sidebar",
    sidebarButtons: (name: SidebarButton) => `.t--sidebar-${name}`,
  };
  sidebar(button: SidebarButton) {
    cy.get(this.locators.sidebar)
      .should("be.visible")
      .find(this.locators.sidebarButtons(button))
      .click();
  }
}

export default new EditorNavigation();
