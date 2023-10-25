import AppSidebarLocators from "../../locators/AppSidebar.js";
export enum AppState {
  Data = "data",
  Pages = "pages",
  Library = "libraries",
  Settings = "settings",
}

export class AppSidebar {
  navigate(state: AppState) {
    cy.get(AppSidebarLocators.Sidebar)
      .find(AppSidebarLocators.SidebarButton(state))
      .click();
  }
}
