import { ObjectsRegistry } from "../Objects/Registry";
import EditorNavigation, {
  AppSidebar,
  AppSidebarButton,
  EntityType,
} from "./EditorNavigation";
import { EntityItems } from "./AssertHelper";
import { PAGE_ENTITY_NAME } from "../../../src/ce/constants/messages";
class PageList {
  private locators = {
    pageListItem: (pageName: string) =>
      `.t--entity-item.page:contains('${pageName}')`,
    newButton: ".pages .t--entity-add-btn",
    newPageOption: ".ads-v2-menu__menu-item-children",
    switcher: `.t--pages-switcher`,
  };

  public DefaultPageName = PAGE_ENTITY_NAME + "1";
  public numberOfPages = `.pages > .ads-v2-text`;

  public AddNewPage(
    option:
      | "New blank page"
      | "Generate page with data"
      | "Add page from template" = "New blank page",
  ) {
    AppSidebar.navigate(AppSidebarButton.Editor);
    this.ShowList();
    ObjectsRegistry.AggregateHelper.GetNClick(this.locators.newButton);
    cy.get(this.locators.newPageOption)
      .contains(option, { matchCase: false })
      .click({ force: true });
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
    this.HideList();
  }

  public SelectedPageItem(): Cypress.Chainable {
    this.ShowList();
    return cy.get(".t--entity-item.page > .active");
    this.HideList();
  }

  public ClonePage(pageName = this.DefaultPageName) {
    AppSidebar.navigate(AppSidebarButton.Editor);
    EditorNavigation.SelectEntityByName(pageName, EntityType.Page);
    ObjectsRegistry.EntityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: pageName,
      action: "Clone",
      entityType: EntityItems.Page,
    });
    ObjectsRegistry.AssertHelper.AssertNetworkStatus("@clonePage", 201);
  }

  public ShowList() {
    cy.get(this.locators.switcher).then(($switcher) => {
      const isActive: string | undefined = $switcher
        .parent()
        .attr("data-state");
      if (isActive === "closed") {
        cy.get(this.locators.switcher).click();
      }
    });
  }

  public HideList() {
    cy.get(this.locators.switcher).then(($switcher) => {
      const isActive: string | undefined = $switcher
        .parent()
        .attr("data-state");
      if (isActive === "open") {
        cy.get(this.locators.switcher).click({ force: true });
      }
    });
  }

  assertPresence(pageName: string) {
    this.ShowList();
    ObjectsRegistry.AggregateHelper.AssertElementVisibility(
      this.locators.pageListItem(pageName),
    );
    this.HideList();
  }

  assertAbsence(pageName: string) {
    this.ShowList();
    ObjectsRegistry.AggregateHelper.AssertElementAbsence(
      this.locators.pageListItem(pageName),
    );
    this.HideList();
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
    this.HideList();
  }

  public HidePage(pageName = this.DefaultPageName) {
    AppSidebar.navigate(AppSidebarButton.Editor);
    EditorNavigation.SelectEntityByName(pageName, EntityType.Page);
    ObjectsRegistry.EntityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: pageName,
      action: "Hide",
      entityType: EntityItems.Page,
    });
  }

  assertAbsenceOfAddPage() {
    this.ShowList();
    ObjectsRegistry.AggregateHelper.AssertElementAbsence(
      this.locators.newButton,
    );
    this.HideList();
  }
}

export default new PageList();
