import { ObjectsRegistry } from "../Objects/Registry";

export class EntityExplorer {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public locator = ObjectsRegistry.CommonLocators;

  private _contextMenu = (entityNameinLeftSidebar: string) =>
    "//div[text()='" +
    entityNameinLeftSidebar +
    "']/ancestor::div[1]/following-sibling::div//div[contains(@class, 'entity-context-menu-icon')]";
  private _contextMenuItem = (item: string) =>
    "//div[text()='" +
    item +
    "']/ancestor::a[contains(@class, 'single-select')]";
  _entityNameInExplorer = (entityNameinLeftSidebar: string) =>
    "//div[contains(@class, 't--entity-name')][text()='" +
    entityNameinLeftSidebar +
    "']";
  private _expandCollapseArrow = (entityNameinLeftSidebar: string) =>
    "//div[text()='" +
    entityNameinLeftSidebar +
    "']/ancestor::div/preceding-sibling::a[contains(@class, 't--entity-collapse-toggle')]";
  private _templateMenuTrigger = (entityNameinLeftSidebar: string) =>
    "//div[contains(@class, 't--entity-name')][text()='" +
    entityNameinLeftSidebar +
    "']/ancestor::div[contains(@class, 't--entity-item')]//div[contains(@class, 't--template-menu-trigger')]";
  private _templateMenuItem = (menuItem: string) =>
    "//div[contains(@class, 'bp3-popover-dismiss')][text()='" + menuItem + "']";

  public SelectEntityByName(
    entityNameinLeftSidebar: string,
    section: "WIDGETS" | "QUERIES/JS" | "DATASOURCES" | "" = "",
  ) {
    if (section) this.expandCollapseEntity(section); //to expand respective section
    cy.xpath(this._entityNameInExplorer(entityNameinLeftSidebar))
      .last()
      .click({ multiple: true });
    this.agHelper.Sleep();
  }

  public AddNewPage() {
    cy.get(this.locator._newPage)
      .first()
      .click();
    this.agHelper.ValidateNetworkStatus("@createPage", 201);
  }

  public NavigateToSwitcher(navigationTab: "explorer" | "widgets") {
    cy.get(this.locator._openNavigationTab(navigationTab)).click();
  }

  public AssertEntityPresenceInExplorer(entityNameinLeftSidebar: string) {
    cy.xpath(this._entityNameInExplorer(entityNameinLeftSidebar)).should(
      "have.length",
      1,
    );
  }

  public AssertEntityAbsenceInExplorer(entityNameinLeftSidebar: string) {
    cy.xpath(this._entityNameInExplorer(entityNameinLeftSidebar)).should(
      "not.exist",
    );
  }

  public expandCollapseEntity(entityName: string, expand = true) {
    cy.xpath(this._expandCollapseArrow(entityName))
      .invoke("attr", "name")
      .then((arrow) => {
        if (expand && arrow == "arrow-right")
          cy.xpath(this._expandCollapseArrow(entityName))
            .trigger("click", { multiple: true })
            .wait(1000);
        else if (!expand && arrow == "arrow-down")
          cy.xpath(this._expandCollapseArrow(entityName))
            .trigger("click", { multiple: true })
            .wait(1000);
        else this.agHelper.Sleep(500);
      });
  }

  public ActionContextMenuByEntityName(
    entityNameinLeftSidebar: string,
    action = "Delete",
    subAction = "",
  ) {
    this.agHelper.Sleep();
    cy.xpath(this._contextMenu(entityNameinLeftSidebar))
      .last()
      .click({ force: true });
    cy.xpath(this._contextMenuItem(action)).click({ force: true });
    this.agHelper.Sleep(500);
    if (subAction) {
      cy.xpath(this._contextMenuItem(subAction)).click({ force: true });
      this.agHelper.Sleep(500);
    }
  }

  public ActionTemplateMenuByEntityName(
    entityNameinLeftSidebar: string,
    action: "SELECT" | "INSERT" | "UPDATE" | "DELETE",
  ) {
    cy.xpath(this._templateMenuTrigger(entityNameinLeftSidebar))
      .last()
      .click({ force: true });
    cy.xpath(this._templateMenuItem(action)).click({ force: true });
    this.agHelper.Sleep(500);
  }

  public DragDropWidgetNVerify(widgetType: string, x: number, y: number) {
    this.NavigateToSwitcher("widgets");
    this.agHelper.Sleep();
    cy.get(this.locator._widgetPageIcon(widgetType))
      .first()
      .trigger("dragstart", { force: true })
      .trigger("mousemove", x, y, { force: true });
    cy.get(this.locator._dropHere)
      .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
      .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
      .trigger("mouseup", x, y, { eventConstructor: "MouseEvent" });
    this.agHelper.AssertAutoSave(); //settling time for widget on canvas!
    cy.get(this.locator._widgetInCanvas(widgetType)).should("exist");
  }
}
