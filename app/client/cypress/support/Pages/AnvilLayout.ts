import { ObjectsRegistry } from "../Objects/Registry";

type DragDropWidgetOptions = {
  parentWidgetType?: string;
  dropTargetId?: string;
  skipWidgetSearch?: boolean;
};
export class AnvilLayout {
  private entityExplorer = ObjectsRegistry.EntityExplorer;
  private locator = ObjectsRegistry.CommonLocators;
  private agHelper = ObjectsRegistry.AggregateHelper;
  public DragNDropAnvilWidget(
    widgetType: string,
    x = 300,
    y = 100,
    options = {} as DragDropWidgetOptions,
  ) {
    const { parentWidgetType, dropTargetId, skipWidgetSearch } = options;
    if (!skipWidgetSearch) {
      this.entityExplorer.SearchWidgetPane(widgetType);
    } else {
      this.entityExplorer.NavigateToSwitcher("Widgets", 0, true);
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
      // to activate ANVIL canvas
      .trigger("mousemove", x, y, {
        eventConstructor: "MouseEvent",
        force: true,
      })
      .trigger("mousemove", x, y, {
        eventConstructor: "MouseEvent",
      })
      .trigger("mousemove", x, y, {
        eventConstructor: "MouseEvent",
      });
    this.agHelper.Sleep(200);
    cy.get(
      parentWidgetType
        ? this.locator._widgetInCanvas(parentWidgetType) +
            " " +
            this.locator._dropHere
        : this.locator._dropHere,
    )
      .first()
      .trigger("mouseup", x, y, { eventConstructor: "MouseEvent" });
  }

  public DragDropAnvilWidgetNVerify(
    widgetType: string,
    x = 300,
    y = 100,
    options = {} as DragDropWidgetOptions,
  ) {
    const { parentWidgetType = "" } = options;
    this.DragNDropAnvilWidget(widgetType, x, y, options);
    this.agHelper.AssertAutoSave(); //settling time for widget on canvas!
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
}
