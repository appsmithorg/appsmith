import { ObjectsRegistry } from "../Objects/Registry";
import type { EntityItemsType } from "./AssertHelper";
import { EntityItems } from "./AssertHelper";
import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
  PageLeftPane,
  PagePaneSegment,
} from "./EditorNavigation";
import AddView from "./IDE/AddView";
import PageList from "./PageList";

type templateActions =
  | "Find"
  | "Find by id"
  | "Insert"
  | "Update"
  | "Delete"
  | "Count"
  | "Distinct"
  | "Aggregate"
  | "Select"
  | "Create"
  | "List files";

interface EntityActionParams {
  entityNameinLeftSidebar: string;
  action?:
    | "Show bindings"
    | "Rename"
    | "Delete"
    | "Clone"
    | "Settings"
    | "Copy to page"
    | "Move to page"
    | "Hide"
    | "Refresh"
    | "Set as home page"
    | "Export"
    | "Import";
  subAction?: string;
  entityType?: EntityItemsType;
  toAssertAction?: boolean;
  toastToValidate?: string;
}

export class EntityExplorer {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public locator = ObjectsRegistry.CommonLocators;
  private modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
  private assertHelper = ObjectsRegistry.AssertHelper;

  public _contextMenu = (entityNameinLeftSidebar: string) =>
    "//span[text()='" +
    entityNameinLeftSidebar +
    "']/parent::div/following-sibling::div//button";

  private _visibleTextSpan = (spanText: string) =>
    "//span[text()='" + spanText + "']";
  _adsPopup = "div[role='menu']";
  _entityExplorerWrapper = ".t--entity-explorer-wrapper";
  _widgetTagsList =
    "[data-testid='t--widget-sidebar-scrollable-wrapper'] .widget-tag-collapsible";
  _widgetCards = ".t--widget-card-draggable";
  _widgetSearchInput = "#entity-explorer-search";
  _widgetCardTitle = ".t--widget-card-draggable span.ads-v2-text";
  _widgetTagSuggestedWidgets = ".widget-tag-collapsible-suggested";
  _widgetTagBuildingBlocks = ".widget-tag-collapsible-building-blocks";
  _widgetSeeMoreButton = "[data-testid='t--explorer-ui-entity-tag-see-more']";
  _entityAddButton = ".t--entity-add-btn";
  _entityName = ".t--entity-name";

  public ActionContextMenuByEntityName({
    action = "Delete",
    entityNameinLeftSidebar,
    entityType = EntityItems.Query,
    subAction = "",
    toAssertAction,
    toastToValidate = "",
  }: EntityActionParams) {
    AppSidebar.navigate(AppSidebarButton.Editor);
    this.agHelper.Sleep();
    if (entityType === EntityItems.Page) {
      PageList.ShowList();
    }
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
    if (entityType === EntityItems.Page && action !== "Rename") {
      PageList.HideList();
    }
  }

  public DeleteWidgetFromEntityExplorer(widgetNameinLeftSidebar: string) {
    AppSidebar.navigate(AppSidebarButton.Editor);
    PageLeftPane.switchSegment(PagePaneSegment.UI);
    cy.xpath(this._contextMenu(widgetNameinLeftSidebar))
      .last()
      .click({ force: true });
    cy.xpath(this.locator._contextMenuItem("Delete")).click({ force: true });
    this.agHelper.Sleep(500);
    this.assertHelper.AssertNetworkStatus("@updateLayout");
    PageLeftPane.assertAbsence(widgetNameinLeftSidebar);
  }

  public ValidateDuplicateMessageToolTip(tooltipText: string) {
    this.agHelper.AssertTooltip(
      tooltipText.concat(" is already being used or is a restricted keyword."),
    );
  }

  public DeleteAllQueriesForDB(dsName: string) {
    AppSidebar.navigate(AppSidebarButton.Editor);
    PageLeftPane.switchSegment(PagePaneSegment.Queries);
    this.agHelper
      .GetElement(this._visibleTextSpan(dsName))
      .siblings()
      .children()
      .each(($el: any) => {
        cy.wrap($el)
          .find(".t--entity-name")
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

  public SearchWidgetPane(widgetType: string) {
    this.agHelper.Sleep();
    this.agHelper.ClearTextField(this.locator._entityExplorersearch);
    this.agHelper.TypeText(
      this.locator._entityExplorersearch,
      widgetType.split("widget")[0].trim(),
    );
    this.agHelper.Sleep(500);
  }

  public DragNDropWidget(
    widgetType: string,
    x = 300,
    y = 100,
    parentWidgetType = "",
    dropTargetId = "",
    skipWidgetSearch = false,
  ) {
    PageLeftPane.switchToAddNew();
    if (!skipWidgetSearch) {
      this.SearchWidgetPane(widgetType);
    }

    cy.get(this.locator._widgetPageIcon(widgetType))
      .first()
      .trigger("dragstart", { force: true })
      .trigger("mousemove", x, y, { force: true });
    cy.get(
      dropTargetId
        ? dropTargetId + this.locator._dropHere
        : parentWidgetType
          ? this.locator._widgetInCanvas(parentWidgetType) +
            " " +
            this.locator._dropHere
          : this.locator._dropHere,
    )
      .first()
      .trigger("mousemove", x, y, {
        eventConstructor: "MouseEvent",
        scrollBehavior: false,
      })
      .trigger("mousemove", x, y, {
        eventConstructor: "MouseEvent",
        scrollBehavior: false,
      });
    this.agHelper.Sleep(200);
    cy.get(
      parentWidgetType
        ? `${this.locator._widgetInCanvas(parentWidgetType)} ${
            this.locator._dropHere
          }`
        : this.locator._dropHere,
    )
      .first()
      .trigger("mouseup", x, y, {
        eventConstructor: "MouseEvent",
        scrollBehavior: false,
      });
  }

  public DragDropWidgetNVerify(
    widgetType: string,
    x = 300,
    y = 100,
    parentWidgetType = "",
    dropTargetId = "",
    skipWidgetSearch = false,
  ) {
    AppSidebar.navigate(AppSidebarButton.Editor);
    PageLeftPane.switchSegment(PagePaneSegment.UI);
    PageLeftPane.switchToAddNew();

    this.DragNDropWidget(
      widgetType,
      x,
      y,
      parentWidgetType,
      dropTargetId,
      skipWidgetSearch,
    );
    this.agHelper.AssertAutoSave(); //allowing widget to autosave on canvas!
    if (widgetType === "modalwidget") {
      cy.get(".t--modal-widget").should("exist");
    } else {
      if (parentWidgetType) {
        this.agHelper.AssertElementExist(
          `${this.locator._widgetInCanvas(
            parentWidgetType,
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

  public CreateNewDsQuery(dsName: string, isQuery = true) {
    AppSidebar.navigate(AppSidebarButton.Editor);
    this.agHelper.ClickOutside(); //to close the evaluated pop-up
    PageLeftPane.switchSegment(PagePaneSegment.Queries);
    PageLeftPane.switchToAddNew();
    AddView.clickCreateOption(dsName);
  }

  public CopyPasteWidget(widgetName: string) {
    PageLeftPane.switchSegment(PagePaneSegment.UI);
    EditorNavigation.SelectEntityByName(widgetName, EntityType.Widget);
    cy.get("body").type(`{${this.modifierKey}}{c}`);
    cy.get("body").type(`{${this.modifierKey}}{v}`);
  }

  public RenameEntityFromExplorer(
    entityName: string,
    renameVal: string,
    viaMenu = false,
    entityType?: EntityItemsType,
  ) {
    AppSidebar.navigate(AppSidebarButton.Editor);
    if (viaMenu)
      this.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: entityName,
        action: "Rename",
        entityType,
      });
    else {
      if (entityType === EntityItems.Page) {
        PageList.ShowList();
        cy.get(this.locator._entityTestId(entityName)).click();
        PageList.ShowList();
        cy.get(this.locator._entityTestId(entityName)).dblclick();
      } else {
        cy.get(this.locator._entityTestId(entityName)).dblclick();
      }
    }
    cy.get(this.locator._entityNameEditing)
      .clear()
      .type(renameVal)
      .wait(500)
      .type("{enter}")
      .wait(300);
    this.agHelper.Sleep(); //allowing time for name change to reflect in EntityExplorer
    if (entityType === EntityItems.Page) {
      PageList.assertPresence(renameVal);
    } else {
      PageLeftPane.assertPresence(renameVal);
    }
  }
}
