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
    switcher: `.t--pages-switcher`,
  };

  public AddNewPage(
    option:
      | "New blank page"
      | "Generate page with data"
      | "Add page from template" = "New blank page",
  ) {
    AppSidebar.navigate(AppSidebarButton.Editor);
    this.ShowList();
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
    this.ShowList();
    ObjectsRegistry.AggregateHelper.GetElement(
      this.locators.pageListItem(pageName),
    ).should("have.class", "activePage");
  }

  public SelectedPageItem(): Cypress.Chainable {
    return cy.get(".t--entity.page > .active");
  }

  public ClonePage(pageName = "Page1") {
    AppSidebar.navigate(AppSidebarButton.Editor);
    this.ShowList();
    EditorNavigation.SelectEntityByName(pageName, EntityType.Page);
    ObjectsRegistry.EntityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: pageName,
      action: "Clone",
    });
    ObjectsRegistry.AssertHelper.AssertNetworkStatus("@clonePage", 201);
  }

  public ShowList() {
    cy.get(this.locators.switcher).then(($switcher) => {
      const isActive: string | undefined = $switcher.attr("data-active");
      if (isActive === "false") {
        cy.get(this.locators.switcher).click();
      }
    });
  }

  assertPresence(pageName: string) {
    this.ShowList();
    ObjectsRegistry.AggregateHelper.AssertElementVisibility(
      this.locators.pageListItem(pageName),
    );
  }

  assertAbsence(pageName: string) {
    this.ShowList();
    ObjectsRegistry.AggregateHelper.AssertElementAbsence(
      this.locators.pageListItem(pageName),
    );
  }

  DeletePage(name: string) {
    this.ShowList();
    cy.get(this.locators.pageListItem(name)).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.wait(2000);
    cy.selectAction("Delete");
    cy.selectAction("Are you sure?");
    cy.wait("@deletePage")
      .its("response.body.responseMeta.status")
      .should("eq", 200);
  }
}

export default new PageList();
