import { ObjectsRegistry } from "../Objects/Registry";
import { EntityItems } from "./AssertHelper";

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
  | "Aggregate"
  | "Select"
  | "Create";

interface EntityActionParams {
  entityNameinLeftSidebar: string;
  action?:
    | "Show bindings"
    | "Edit name"
    | "Delete"
    | "Clone"
    | "Settings"
    | "Copy to page"
    | "Move to page"
    | "Hide"
    | "Refresh";
  subAction?: string;
  entityType?: EntityItems;
  toAssertAction?: boolean;
  toastToValidate?: string;
}

export class EntityExplorer {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public locator = ObjectsRegistry.CommonLocators;
  private modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
  private assertHelper = ObjectsRegistry.AssertHelper;

  private _contextMenu = (entityNameinLeftSidebar: string) =>
    "//div[text()='" +
    entityNameinLeftSidebar +
    "']/ancestor::div[1]/following-sibling::div//button[contains(@class, 'entity-context-menu')]";
  _entityNameInExplorer = (entityNameinLeftSidebar: string) =>
    "//div[contains(@class, 't--entity-name')][text()='" +
    entityNameinLeftSidebar +
    "']";
  private _expandCollapseArrow = (entityNameinLeftSidebar: string) =>
    "//div[text()='" +
    entityNameinLeftSidebar +
    "']/ancestor::div/span[contains(@class, 't--entity-collapse-toggle')]";
  private _expandCollapseSection = (entityNameinLeftSidebar: string) =>
    this._expandCollapseArrow(entityNameinLeftSidebar) +
    "/ancestor::div[contains(@class, 't--entity')]//div[@class='bp3-collapse']";

  private _templateMenuTrigger = (entityNameinLeftSidebar: string) =>
    "//div[contains(@class, 't--entity-name')][text()='" +
    entityNameinLeftSidebar +
    "']/ancestor::div[contains(@class, 't--entity-item')]//button[contains(@class, 't--template-menu-trigger')]";
  private _moreOptionsPopover =
    "//*[local-name()='g' and @id='Icon/Outline/more-vertical']";
  private _pageClone = ".single-select >div:contains('Clone')";
  private _pageNameDiv = (pageName: string) =>
    `.t--entity.page:contains('${pageName}')`;
  private _visibleTextSpan = (spanText: string) =>
    "//span[text()='" + spanText + "']";
  _createNewPopup = ".bp3-overlay-content";
  _adsPopup = "div[role='menu']";
  _entityExplorerWrapper = ".t--entity-explorer-wrapper";
  _pinEntityExplorer = ".t--pin-entity-explorer";
  _entityExplorer = ".t--entity-explorer";
  private _modalTextWidget = (modalName: string) =>
    "//div[contains(@class, 't--entity-name')][text()='" +
    modalName +
    "']/ancestor::div[contains(@class, 't--entity-item')]/following-sibling::div//div[contains(@class, 't--entity-name')][contains(text(), 'Text')]";
  private _newPageOptions = (option: string) =>
    `//span[text()='${option}']/parent::div`;
  _openNavigationTab = (tabToOpen: string) =>
    "//span[text()='" + tabToOpen + "']/ancestor::div";
  private _overlaySearch = "[data-testId='t--search-file-operation']";
  _allQueriesforDB = (dbName: string) =>
    "//span[text()='" +
    dbName +
    "']/following-sibling::div[contains(@class, 't--entity') and contains(@class, 'action')]//div[contains(@class, 't--entity-name')]";

  public SelectEntityByName(
    entityNameinLeftSidebar: string,
    section:
      | "Widgets"
      | "Queries/JS"
      | "Datasources"
      | "Pages"
      | ""
      | string = "",
    ctrlKey = false,
  ) {
    this.NavigateToSwitcher("Explorer");
    if (section) this.ExpandCollapseEntity(section); //to expand respective section
    cy.xpath(this._entityNameInExplorer(entityNameinLeftSidebar))
      .last()
      .click(
        ctrlKey ? { ctrlKey, force: true } : { multiple: true, force: true },
      );
    this.agHelper.Sleep(); //for selection to settle
  }

  public SelectEntityInModal(
    modalNameinEE: string,
    section: "Widgets" | "Queries/JS" | "Datasources" | "" = "",
    ctrlKey = false,
  ) {
    this.NavigateToSwitcher("Explorer");
    if (section) this.ExpandCollapseEntity(section); //to expand respective section
    this.ExpandCollapseEntity(modalNameinEE);
    cy.xpath(this._modalTextWidget(modalNameinEE))
      .last()
      .click(ctrlKey ? { ctrlKey } : { multiple: true });
    this.agHelper.Sleep(500);
  }

  public AddNewPage(
    option:
      | "New blank page"
      | "Generate page with data"
      | "Add page from template" = "New blank page",
  ) {
    this.agHelper.GetNClick(this.locator._newPage);
    this.agHelper.GetNClick(this._newPageOptions(option));
    if (option === "New blank page") {
      this.assertHelper.AssertNetworkStatus("@createPage", 201);
      return cy
        .get("@createPage")
        .then(($pageName: any) => $pageName.response?.body.data.name);
    }
  }

  public NavigateToSwitcher(
    navigationTab: "Explorer" | "Widgets",
    index = 0,
    force = false,
  ) {
    this.agHelper.GetNClick(
      this._openNavigationTab(navigationTab),
      index,
      force,
    );
  }

  public AssertEntityPresenceInExplorer(entityNameinLeftSidebar: string) {
    this.agHelper.AssertElementLength(
      this._entityNameInExplorer(entityNameinLeftSidebar),
      1,
    );
  }

  public AssertEntityAbsenceInExplorer(entityNameinLeftSidebar: string) {
    this.agHelper.AssertElementAbsence(
      this._entityNameInExplorer(entityNameinLeftSidebar),
    );
  }

  public ExpandCollapseEntity(entityName: string, expand = true, index = 0) {
    this.agHelper.AssertElementVisible(
      this._expandCollapseArrow(entityName),
      index,
      30000,
    );

    cy.xpath(this._expandCollapseArrow(entityName))
      .eq(index)
      .wait(500)
      .invoke("attr", "id")
      .then((arrow) => {
        if (expand && arrow == "arrow-right-s-line") {
          cy.xpath(this._expandCollapseArrow(entityName))
            .eq(index)
            .trigger("click", { force: true })
            .wait(500);
          // this.agHelper
          //   .GetElement(this._expandCollapseSection(entityName))
          //   .then(($div: any) => {
          //     cy.log("Checking style - expand");
          //     while (!$div.attr("style").includes("overflow-y: visible;")) {
          //       cy.log("Inside style check - expand");
          //       cy.xpath(this._expandCollapseArrow(entityName))
          //         .eq(index)
          //         .trigger("click", { multiple: true })
          //         .wait(500);
          //     }
          //   });
        } else if (!expand && arrow == "arrow-down-s-line") {
          cy.xpath(this._expandCollapseArrow(entityName))
            .eq(index)
            .trigger("click", { force: true })
            .wait(500);
          // this.agHelper
          //   .GetElement(this._expandCollapseSection(entityName))
          //   .then(($div: any) => {
          //     cy.log("Checking style - collapse");
          //     while ($div.attr("style").includes("overflow-y: visible;")) {
          //       cy.log("Inside style check - collapse");
          //       cy.xpath(this._expandCollapseArrow(entityName))
          //         .eq(index)
          //         .trigger("click", { multiple: true })
          //         .wait(500);
          //     }
          //   });
        } else this.agHelper.Sleep(200);
      });
  }

  public GetEntityNamesInSection(
    sectionName: string,
    entityFilterSelector: string,
  ) {
    return cy
      .xpath(this._expandCollapseSection(sectionName))
      .find(entityFilterSelector)
      .then((entities) => {
        const entityNames = entities.map((_, el) => Cypress.$(el).text()).get();
        return entityNames;
      });
  }

  public ActionContextMenuByEntityName({
    entityNameinLeftSidebar,
    action = "Delete",
    subAction = "",
    entityType = EntityItems.Query,
    toAssertAction,
    toastToValidate = "",
  }: EntityActionParams) {
    this.agHelper.Sleep();
    cy.xpath(this._contextMenu(entityNameinLeftSidebar))
      .scrollIntoView()
      .last()
      .click({ force: true });
    cy.xpath(this.locator._contextMenuItem(action)).click({ force: true });
    this.agHelper.Sleep(1000);
    if (action == "Delete") {
      toAssertAction = toAssertAction === false ? false : true;
      this.agHelper.DeleteEntityNAssert(entityType, toAssertAction);
    } else if (subAction) {
      this.agHelper.ActionContextMenuSubItem({
        subAction: subAction,
        force: true,
        toastToValidate: toastToValidate,
      });
    }
  }

  public DeleteWidgetFromEntityExplorer(widgetNameinLeftSidebar: string) {
    cy.xpath(this._contextMenu(widgetNameinLeftSidebar))
      .last()
      .click({ force: true });
    cy.xpath(this.locator._contextMenuItem("Delete")).click({ force: true });
    this.agHelper.Sleep(500);
    this.assertHelper.AssertNetworkStatus("@updateLayout");
    this.AssertEntityAbsenceInExplorer(widgetNameinLeftSidebar);
  }

  public ValidateDuplicateMessageToolTip(tooltipText: string) {
    cy.get(".rc-tooltip-inner").should(($x) => {
      expect($x).contain(tooltipText.concat(" is already being used."));
    });
  }

  public DeleteAllQueriesForDB(dsName: string) {
    this.agHelper.GetElement(this._allQueriesforDB(dsName)).each(($el: any) => {
      cy.wrap($el)
        .invoke("text")
        .then(($query) => {
          this.ActionContextMenuByEntityName({
            entityNameinLeftSidebar: $query as string,
            action: "Delete",
            entityType: EntityItems.Query,
          });
        });
    });
  }

  public HoverOnEntityItem(entityNameinLeftSidebar: string) {
    this.agHelper.ClickOutside();
    //cy.get("body").trigger("mousedown");
    cy.xpath(this._entityNameInExplorer(entityNameinLeftSidebar)).realHover();
  }

  public ActionTemplateMenuByEntityName(
    entityNameinLeftSidebar: string,
    action: templateActions,
  ) {
    this.HoverOnEntityItem(entityNameinLeftSidebar);
    cy.xpath(this._templateMenuTrigger(entityNameinLeftSidebar))
      .first()
      .click()
      .wait(100); //for menu template to appear
    this.agHelper.GetNClick(this.locator._contextMenuItem(action), 0, true);
    this.agHelper.Sleep(500);
  }

  public DragDropWidgetNVerify(
    widgetType: string,
    x = 300,
    y = 100,
    dropTargetId = "",
  ) {
    this.NavigateToSwitcher("Widgets");
    this.agHelper.Sleep();
    this.agHelper.ClearTextField(this.locator._entityExplorersearch);
    this.agHelper.TypeText(
      this.locator._entityExplorersearch,
      widgetType.split("widget")[0].trim(),
    );
    cy.get(this.locator._widgetPageIcon(widgetType))
      .first()
      .trigger("dragstart", { force: true })
      .trigger("mousemove", x, y, { force: true });
    cy.get(
      dropTargetId
        ? this.locator._widgetInCanvas(dropTargetId) +
            " " +
            this.locator._dropHere
        : this.locator._dropHere,
    )
      .first()
      .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
      .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" });
    this.agHelper.Sleep(200);
    cy.get(
      dropTargetId
        ? this.locator._widgetInCanvas(dropTargetId) +
            " " +
            this.locator._dropHere
        : this.locator._dropHere,
    )
      .first()
      .trigger("mouseup", x, y, { eventConstructor: "MouseEvent" });
    this.agHelper.AssertAutoSave(); //settling time for widget on canvas!
    if (widgetType === "modalwidget") {
      cy.get(".t--modal-widget").should("exist");
    } else {
      if (dropTargetId) {
        this.agHelper.AssertElementExist(
          `${this.locator._widgetInCanvas(
            dropTargetId,
          )} ${this.locator._widgetInCanvas(widgetType)}`,
        );
      } else {
        this.agHelper.AssertElementExist(
          this.locator._widgetInCanvas(widgetType),
        );
      }
    }
    this.agHelper.Sleep(200); //waiting a bit for widget properties to open
  }

  public ClonePage(pageName = "Page1") {
    this.SelectEntityByName(pageName, "Pages");
    this.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: pageName,
      action: "Clone",
    });
    this.assertHelper.AssertNetworkStatus("@clonePage", 201);
  }

  public CreateNewDsQuery(dsName: string, isQuery = true) {
    this.agHelper.ClickOutside(); //to close the evaluated pop-up
    cy.get(this.locator._createNew).last().click();
    const searchText = isQuery ? dsName + " query" : dsName;
    this.SearchAndClickOmnibar(searchText);
  }

  public SearchAndClickOmnibar(searchText: string) {
    this.agHelper.UpdateInputValue(this._overlaySearch, searchText);
    let overlayItem = this._visibleTextSpan(searchText);
    this.agHelper.GetNClick(overlayItem);
  }

  public CopyPasteWidget(widgetName: string) {
    this.NavigateToSwitcher("Widgets");
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

  public RenameEntityFromExplorer(
    entityName: string,
    renameVal: string,
    viaMenu = false,
  ) {
    if (viaMenu)
      this.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: entityName,
        action: "Edit name",
      });
    else cy.xpath(this._entityNameInExplorer(entityName)).dblclick();
    cy.xpath(this.locator._entityNameEditing(entityName)).type(
      renameVal + "{enter}",
    );
    this.AssertEntityPresenceInExplorer(renameVal);
    this.agHelper.Sleep(); //allowing time for name change to reflect in EntityExplorer
  }

  public VerifyIsCurrentPage(pageName: string) {
    this.agHelper
      .GetElement(this._pageNameDiv(pageName))
      .should("have.class", "activePage");
  }
}
