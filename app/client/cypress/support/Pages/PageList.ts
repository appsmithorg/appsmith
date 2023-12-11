import { ObjectsRegistry } from "../Objects/Registry";
import EditorNavigation, {
  AppSidebar,
  AppSidebarButton,
  EntityType,
} from "./EditorNavigation";

class PageList {
  private locators = {
    pageListItem: (pageName: string) =>
      `.t--entity.page:contains('${pageName}')`,
    newButton: ".pages .t--entity-add-btn",
    newPageOption: (option: string) => `//span[text()='${option}']/parent::div`,
  };

  public AddNewPage(
    option:
      | "New blank page"
      | "Generate page with data"
      | "Add page from template" = "New blank page",
  ) {
    AppSidebar.navigate(AppSidebarButton.Editor);
    ObjectsRegistry.AggregateHelper.GetNClick(this.locators.newButton);
    ObjectsRegistry.AggregateHelper.GetNClick(
      this.locators.newPageOption(option),
    );
    if (option === "New blank page") {
      ObjectsRegistry.AssertHelper.AssertNetworkStatus("@createPage", 201);
      return cy
        .get("@createPage")
        .then(($pageName: any) => $pageName.response?.body.data.name);
    }
  }

  public VerifyIsCurrentPage(pageName: string) {
    ObjectsRegistry.AggregateHelper.GetElement(
      this.locators.pageListItem(pageName),
    ).should("have.class", "activePage");
  }

  public SelectedPageItem(): Cypress.Chainable {
    return cy.get(".t--entity.page > .active");
  }

  public ClonePage(pageName = "Page1") {
    AppSidebar.navigate(AppSidebarButton.Editor);
    EditorNavigation.SelectEntityByName(pageName, EntityType.Page);
    ObjectsRegistry.EntityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: pageName,
      action: "Clone",
    });
    ObjectsRegistry.AssertHelper.AssertNetworkStatus("@clonePage", 201);
  }
}

export default new PageList();
