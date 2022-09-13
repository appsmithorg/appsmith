import { ObjectsRegistry } from "../Objects/Registry";

type templateActions =
  | "SELECT"
  | "INSERT"
  | "UPDATE"
  | "DELETE"
  | "Find"
  | "Find by ID"
  | "Insert"
  | "Update"
  | "Delete"
  | "Count"
  | "Distinct"
  | "Aggregate";

export class EntityExplorer {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public locator = ObjectsRegistry.CommonLocators;
  private modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

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
  private _moreOptionsPopover =
    "//*[local-name()='g' and @id='Icon/Outline/more-vertical']";
  private _pageClone = ".single-select >div:contains('Clone')";
  private getPageLocator = (pageName: string) =>
    `.t--entity-name:contains(${pageName})`;
  private _visibleTextSpan = (spanText: string) =>
    "//span[text()='" + spanText + " Query']";
  _createNewPopup = ".bp3-overlay-content";
  _entityExplorerWrapper = ".t--entity-explorer-wrapper";
  _pinEntityExplorer = ".t--pin-entity-explorer";
  _entityExplorer = ".t--entity-explorer";
  private _modalTextWidget = (modalName: string) =>
    "//div[contains(@class, 't--entity-name')][text()='" +
    modalName +
    "']/ancestor::div[contains(@class, 't--entity-item')]/following-sibling::div//div[contains(@class, 't--entity-name')][contains(text(), 'Text')]";

  public SelectEntityByName(
    entityNameinLeftSidebar: string,
    section: "Widgets" | "Queries/JS" | "Datasources" | "Pages" | "" = "",
  ) {
    this.NavigateToSwitcher("explorer");
    if (section) this.ExpandCollapseEntity(section); //to expand respective section
    cy.xpath(this._entityNameInExplorer(entityNameinLeftSidebar))
      .last()
      .click({ multiple: true });
    this.agHelper.Sleep(500);
  }

  public SelectEntityInModal(
    modalNameinEE: string,
    section: "Widgets" | "Queries/JS" | "Datasources" | "" = "",
  ) {
    this.NavigateToSwitcher("explorer");
    if (section) this.ExpandCollapseEntity(section); //to expand respective section
    this.ExpandCollapseEntity(modalNameinEE);
    cy.xpath(this._modalTextWidget(modalNameinEE))
      .last()
      .click({ multiple: true });
    this.agHelper.Sleep(500);
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
    this.agHelper.AssertElementAbsence(
      this._entityNameInExplorer(entityNameinLeftSidebar),
    );
  }

  public ExpandCollapseEntity(entityName: string, expand = true, index = 0) {
    cy.xpath(this._expandCollapseArrow(entityName))
      .eq(index)
      .invoke("attr", "name")
      .then((arrow) => {
        if (expand && arrow == "arrow-right")
          cy.xpath(this._expandCollapseArrow(entityName))
            .eq(index)
            .trigger("click", { multiple: true })
            .wait(1000);
        else if (!expand && arrow == "arrow-down")
          cy.xpath(this._expandCollapseArrow(entityName))
            .eq(index)
            .trigger("click", { multiple: true })
            .wait(1000);
        else this.agHelper.Sleep(500);
      });
  }

  public ActionContextMenuByEntityName(
    entityNameinLeftSidebar: string,
    action = "Delete",
    subAction = "",
    jsDelete = false,
  ) {
    this.agHelper.Sleep();
    cy.xpath(this._contextMenu(entityNameinLeftSidebar))
      .last()
      .click({ force: true });
    cy.xpath(this._contextMenuItem(action)).click({ force: true });
    this.agHelper.Sleep(300);
    if (action == "Delete") {
      subAction = "Are you sure?";
    }
    if (subAction) {
      cy.xpath(this._contextMenuItem(subAction)).click({ force: true });
      this.agHelper.Sleep(300);
    }
    if (action == "Delete") {
      jsDelete && this.agHelper.ValidateNetworkStatus("@deleteJSCollection");
      jsDelete && this.agHelper.AssertContains("deleted successfully");
    }
  }

  public ActionTemplateMenuByEntityName(
    entityNameinLeftSidebar: string,
    action: templateActions,
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

  public ClonePage(pageName = "Page1") {
    this.ExpandCollapseEntity("Pages");
    cy.get(this.getPageLocator(pageName))
      .trigger("mouseover")
      .click({ force: true });
    cy.xpath(this._moreOptionsPopover)
      .first()
      .should("be.hidden")
      .invoke("show")
      .click({ force: true });
    cy.get(this._pageClone).click({ force: true });
    this.agHelper.ValidateNetworkStatus("@clonePage", 201);
  }

  public CreateNewDsQuery(dsName: string) {
    cy.get(this.locator._createNew)
      .last()
      .click({ force: true });
    cy.xpath(this._visibleTextSpan(dsName)).click({ force: true });
  }

  public CopyPasteWidget(widgetName: string) {
    this.NavigateToSwitcher("widgets");
    this.SelectEntityByName(widgetName);
    cy.get("body").type(`{${this.modifierKey}}{c}`);
    cy.get("body").type(`{${this.modifierKey}}{v}`);
  }

  public PinUnpinEntityExplorer(pin = true) {
    this.agHelper
      .GetElement(this._entityExplorer)
      .invoke("attr", "class")
      .then(($classes) => {
        if (pin && !$classes?.includes("fixed"))
          this.agHelper.GetNClick(this._pinEntityExplorer, 0, false, 1000);
        else if (!pin && $classes?.includes("fixed"))
          this.agHelper.GetNClick(this._pinEntityExplorer, 0, false, 1000);
        else this.agHelper.Sleep(200); //do nothing
      });
  }
}
